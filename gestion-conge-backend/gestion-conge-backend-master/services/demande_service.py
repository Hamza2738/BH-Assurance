# services/demandes_service.py
from __future__ import annotations

from datetime import datetime, timedelta
from flask import jsonify
from typing import Any, Dict, Optional, List, Tuple

from extension import db
from models.demande import Demande
from models.solde_conge import SoldeConge
from models.type_conge import TypeConge
from models.historique import Historique
from models.utilisateur import Utilisateur
from models.grade import Grade
from models.type_notification import TypeNotification  # <-- important

from services.notification_service import (
    creer_notification_db,
    push_notification_to_user,
)

# -------------------- Utils --------------------
def calcul_nb_jours(date_debut, date_fin) -> int:
    return (date_fin - date_debut).days + 1


def consommer_solde(utilisateur_id, type_conge_id, date_debut, date_fin):
    nb_jours = calcul_nb_jours(date_debut, date_fin)
    annee = date_debut.year

    solde_prec = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id, type_conge_id=type_conge_id, annee=annee - 1
    ).first()
    solde_courant = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id, type_conge_id=type_conge_id, annee=annee
    ).first()

    restant = nb_jours

    if solde_prec and solde_prec.solde > 0:
        deduction = min(solde_prec.solde, restant)
        solde_prec.solde -= deduction
        restant -= deduction

    if restant > 0:
        if not solde_courant:
            solde_courant = SoldeConge(
                utilisateur_id=utilisateur_id,
                type_conge_id=type_conge_id,
                annee=annee,
                solde=0,
                last_recharge=datetime.utcnow()
            )
            db.session.add(solde_courant)
            db.session.flush()
        solde_courant.solde -= restant

    db.session.commit()


def restituer_solde(utilisateur_id, type_conge_id, date_debut, date_fin):
    nb_jours = calcul_nb_jours(date_debut, date_fin)
    annee = date_debut.year

    solde = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id, type_conge_id=type_conge_id, annee=annee
    ).first()

    if solde:
        solde.solde += nb_jours
    else:
        solde = SoldeConge(
            utilisateur_id=utilisateur_id,
            type_conge_id=type_conge_id,
            annee=annee,
            solde=nb_jours,
            last_recharge=datetime.utcnow()
        )
        db.session.add(solde)
    db.session.commit()


def creer_historique(demande: Demande, utilisateur_id: int, ancien_statut: str, nouveau_statut: str):
    historique = Historique(
        demande_id=demande.id,
        utilisateur_id=utilisateur_id,
        ancien_statut=ancien_statut,
        nouveau_statut=nouveau_statut,
        date_changement=datetime.utcnow()
    )
    db.session.add(historique)
    db.session.commit()


def _get_role_name(user: Utilisateur):
    if getattr(getattr(user, "role", None), "nom", None):
        return user.role.nom
    if getattr(user, "role_id", None) == 1:
        return "super_admin"
    return "user"


def _manager_can_act_on(demande: Demande, manager: Utilisateur) -> Tuple[bool, str]:
    if not demande or not manager or not demande.utilisateur:
        return False, "Contexte invalide."

    # Ajout : si la phase 1 a été sautée, aucun manager ne peut agir
    if demande.statut_phase1 == 'sauté':
        return False, "Phase manager sautée : demande envoyée directement au super administrateur."

    if demande.statut_phase1 != 'en attente' or demande.statut not in ['en attente']:
        return False, "La demande n'est pas en attente (phase 1)."

    if demande.utilisateur.departement_id != manager.departement_id:
        return False, "Département différent."

    demande_grade = Grade.query.get(demande.utilisateur.grade_id) if demande.utilisateur.grade_id else None
    manager_grade = Grade.query.get(manager.grade_id) if manager.grade_id else None
    if not demande_grade or not manager_grade:
        return False, "Grades introuvables."

    if not (demande_grade.pouvoir < manager_grade.pouvoir):
        return False, "Pouvoir insuffisant."

    return True, ""


def _superadmin_can_act_on(demande: Demande) -> bool:
    return demande.statut == 'en attente super_admin'


def _fullname(u: Utilisateur) -> str:
    return f"{(u.nom or '').strip()} {(u.prenom or '').strip()}".strip() or u.email


# -------------------- Type notification helper (évite l'erreur FK) --------------------
def _ensure_type_notification(label: str) -> int:
    tn = TypeNotification.query.filter_by(LIBELLE=label).first()
    if tn:
        return tn.ID_TYPE_NOTIFICATION
    tn = TypeNotification(LIBELLE=label)
    db.session.add(tn)
    db.session.commit()
    return tn.ID_TYPE_NOTIFICATION


# -------------------- Sélection des destinataires --------------------
def _get_managers_for_user(user: Utilisateur) -> List[Utilisateur]:
    """
    Managers = même département + grade.pouvoir strictement supérieur à celui de l'utilisateur.
    """
    if not user or not user.departement_id or not user.grade_id:
        return []

    user_grade = Grade.query.get(user.grade_id)
    if not user_grade:
        return []

    managers = (
        Utilisateur.query
        .join(Grade, Utilisateur.grade_id == Grade.id)
        .filter(
            Utilisateur.departement_id == user.departement_id,
            Grade.pouvoir > user_grade.pouvoir,
            Utilisateur.is_active == True  # noqa: E712
        )
        .all()
    )
    return managers


def _has_manager_above(user: Utilisateur) -> bool:
    """
    True s'il existe au moins un utilisateur du même département
    avec un grade.pouvoir strictement supérieur.
    """
    if not user or not user.departement_id or not user.grade_id:
        return False
    user_grade = Grade.query.get(user.grade_id)
    if not user_grade:
        return False

    exists = (
        Utilisateur.query
        .join(Grade, Utilisateur.grade_id == Grade.id)
        .filter(
            Utilisateur.departement_id == user.departement_id,
            Grade.pouvoir > user_grade.pouvoir,
            Utilisateur.is_active == True  # noqa: E712
        )
        .first()
    )
    return bool(exists)


def _get_super_admins() -> List[Utilisateur]:
    supers = (
        Utilisateur.query
        .filter(
            (Utilisateur.role_id == 1) |  # fallback minimal
            ((Utilisateur.role_id.isnot(None)) & (Utilisateur.is_active == True))  # noqa: E712
        )
        .all()
    )
    return [u for u in supers if _get_role_name(u) == "super_admin" and u.is_active]


# -------------------- Notification Helpers --------------------
def _notify_users(users: List[Utilisateur], titre: str, texte: str, *, type_label: str = "Demande - création"):
    """
    Crée + push une notif pour CHAQUE destinataire (rooms = id utilisateur).
    Utilise un type de notif existant ou le crée si absent (évite l'erreur FK).
    """
    if not users:
        return
    type_id = _ensure_type_notification(type_label)
    for dest in users:
        notif = creer_notification_db(
            titre=titre[:200],
            texte=texte[:500],
            id_utilisateur_expediteur=str(0),
            id_utilisateur_destinataire=str(dest.id),
            username_expediteur="System",
            username_destinataire=_fullname(dest),
            id_type_notification=type_id,
            id_derogation=None,
            utilisateur_expediteur_id=None,
            utilisateur_destinataire_id=dest.id,
        )
        push_notification_to_user(notif)


def _notify_user(user_id: int, titre: str, texte: str, *, type_label: str = "Info"):
    u = Utilisateur.query.get(user_id)
    if not u:
        return
    _notify_users([u], titre, texte, type_label=type_label)


# -------------------- CRUD --------------------
def create_demande(data: Dict[str, Any], current_user_id: int):
    try:
        if not all(k in data for k in ('date_debut', 'date_fin', 'type_conge_id')):
            return None, "Champs obligatoires manquants."

        date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%d').date()
        date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d').date()
        if date_fin < date_debut:
            return None, "Date fin antérieure à date début."

        type_conge = TypeConge.query.get(data['type_conge_id'])
        if not type_conge:
            return None, "Type de congé invalide."

        nb_jours = float(data.get('nb_jours')) if data.get('nb_jours') else calcul_nb_jours(date_debut, date_fin)

        # création en 'en attente' par défaut
        demande = Demande(
            utilisateur_id=current_user_id,
            type_conge_id=type_conge.id,
            date_debut=date_debut,
            date_fin=date_fin,
            nb_jours=nb_jours,
            motif=data.get('motif'),
            statut_phase1='en attente',
            statut_final='en attente',
            statut='en attente',
            date_demande=datetime.utcnow(),
            date_modification=datetime.utcnow()
        )
        db.session.add(demande)
        db.session.flush()  # on veut l'id avant de décider du routing

        employe = Utilisateur.query.get(current_user_id)

        # --- Nouveau: si aucun manager au-dessus, sauter phase 1 et router au super admin
        if not _has_manager_above(employe):
            # on "marque" la phase1 comme sautée pour éviter toute action manager
            demande.statut_phase1 = 'sauté'  # ou 'non applicable' si tu préfères
            demande.statut = 'en attente super_admin'
            demande.date_modification = datetime.utcnow()
            db.session.commit()

            # notifier l'employé
            _notify_user(
                current_user_id,
                "Demande envoyée au super administrateur",
                f"Votre demande #{demande.id} (du {date_debut} au {date_fin}) a été envoyée directement au super administrateur (aucun supérieur hiérarchique dans votre département).",
                type_label="Demande - routage direct",
            )

            # notifier les super admins
            supers = _get_super_admins()
            if supers:
                titre = "Demande à valider (routage direct)"
                texte = f"La demande #{demande.id} de {_fullname(employe)} (du {date_debut} au {date_fin}) est en attente de votre décision."
                _notify_users(supers, titre, texte, type_label="Demande - création")
            return demande, None

        # --- Cas normal: managers existent -> notifier les managers (phase 1)
        db.session.commit()  # commit la création en statut 'en attente'
        managers = _get_managers_for_user(employe) if employe else []
        if managers:
            titre = "Nouvelle demande de congé"
            texte = f"{_fullname(employe)} a soumis la demande #{demande.id} du {date_debut} au {date_fin}."
            _notify_users(managers, titre, texte, type_label="Demande - création")

        return demande, None

    except Exception as e:
        db.session.rollback()
        return None, str(e)


def update_demande(demande_id: int, data: Dict[str, Any], current_user_id: int):
    demande = Demande.query.get(demande_id)
    if not demande:
        return None, "Demande non trouvée."
    if demande.utilisateur_id != current_user_id:
        return None, "Action non autorisée."
    if demande.statut_phase1 not in ['en attente'] and demande.statut_final != 'en attente':
        return None, "Modification interdite : demande déjà traitée."
    try:
        if 'date_debut' in data:
            demande.date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%d').date()
        if 'date_fin' in data:
            demande.date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d').date()
        demande.nb_jours = calcul_nb_jours(demande.date_debut, demande.date_fin)
        if 'motif' in data:
            demande.motif = data['motif']
        demande.date_modification = datetime.utcnow()
        db.session.commit()

        _notify_user(current_user_id, "Demande modifiée", f"Votre demande #{demande_id} a été modifiée.", type_label="Info")
        return demande, None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


def delete_demande(demande_id: int, current_user_id: int):
    demande = Demande.query.get(demande_id)
    if not demande:
        return False, "Demande non trouvée."
    if demande.utilisateur_id != current_user_id:
        return False, "Action non autorisée."
    if demande.statut_phase1 not in ['en attente'] and demande.statut_final != 'en attente':
        return False, "Suppression interdite : demande déjà traitée."
    try:
        if demande.statut_final == 'accepté':
            restituer_solde(current_user_id, demande.type_conge_id, demande.date_debut, demande.date_fin)
        db.session.delete(demande)
        db.session.commit()

        _notify_user(current_user_id, "Demande supprimée", f"Votre demande #{demande_id} a été supprimée.", type_label="Info")
        return True, None
    except Exception as e:
        db.session.rollback()
        return False, str(e)


# -------------------- Workflow Manager --------------------
def change_statut_manager(demande_id: int, manager_id: int, decision: str):
    demande = Demande.query.get(demande_id)
    if not demande:
        return None, "Demande introuvable."
    manager = Utilisateur.query.get(manager_id)
    if not manager:
        return None, "Utilisateur non trouvé."

    d = decision.strip().lower()
    if d in ['accepté', 'accepte', 'accepted', 'accept']:
        d = 'accepter'
    if d in ['rejeté', 'rejete', 'reject', 'rejected']:
        d = 'rejeter'
    if d not in ['accepter', 'rejeter']:
        return None, "Manager doit choisir 'accepter' ou 'rejeter'."

    ok, err = _manager_can_act_on(demande, manager)
    if not ok:
        return None, err

    if d == 'accepter':
        demande.statut_phase1 = 'accepté'
        demande.statut = 'en attente super_admin'
    else:
        demande.statut_phase1 = 'rejeté'
        demande.statut = 'rejeté'
    demande.date_modification = datetime.utcnow()

    try:
        db.session.commit()

        _notify_user(
            demande.utilisateur_id,
            "Décision du manager",
            f"Votre demande #{demande_id} a été {demande.statut_phase1} par le manager.",
            type_label="Décision manager",
        )

        if d == 'accepter':
            supers = _get_super_admins()
            if supers:
                employe = Utilisateur.query.get(demande.utilisateur_id)
                titre = "Validation manager - action requise"
                texte = f"La demande #{demande.id} de {_fullname(employe)} est en attente de votre décision."
                _notify_users(supers, titre, texte, type_label="Décision manager")

        return demande, None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


# -------------------- Workflow Super Admin --------------------
def change_statut_superadmin(demande_id: int, admin_id: int, decision: str):
    demande = Demande.query.get(demande_id)
    if not demande:
        return None, "Demande introuvable."
    admin = Utilisateur.query.get(admin_id)
    if not admin:
        return None, "Utilisateur non trouvé."

    d = decision.strip().lower()
    if d in ['accepter', 'accept', 'accepted']:
        d = 'accepté'
    if d in ['rejeter', 'reject', 'rejected']:
        d = 'rejeté'
    if d not in ['accepté', 'rejeté']:
        return None, "Super admin doit choisir 'accepté' ou 'rejeté'."

    if not _superadmin_can_act_on(demande):
        return None, "La demande n'est pas en attente super_admin."

    ancien_statut_final, ancien_statut = demande.statut_final, demande.statut
    demande.statut_final = d
    demande.statut = d
    demande.date_modification = datetime.utcnow()

    if d == 'accepté':
        consommer_solde(demande.utilisateur_id, demande.type_conge_id, demande.date_debut, demande.date_fin)
    elif ancien_statut_final == 'accepté' and d == 'rejeté':
        restituer_solde(demande.utilisateur_id, demande.type_conge_id, demande.date_debut, demande.date_fin)

    try:
        db.session.commit()
        creer_historique(demande, admin_id, ancien_statut, demande.statut)

        _notify_user(
            demande.utilisateur_id,
            "Décision du super administrateur",
            f"Votre demande #{demande_id} a été {d} par le super administrateur.",
            type_label="Décision finale",
        )

        employe = Utilisateur.query.get(demande.utilisateur_id)
        managers = _get_managers_for_user(employe) if employe else []
        if managers:
            titre = "Décision finale du super administrateur"
            texte = f"La demande #{demande.id} de {_fullname(employe)} a été {d}."
            _notify_users(managers, titre, texte, type_label="Décision finale")

        return demande, None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


# -------------------- Récupération --------------------
def get_all_demandes():
    demandes = Demande.query.all()
    result = []
    for d in demandes:
        result.append({
            'id': d.id,
            'utilisateur_id': d.utilisateur_id,
            'utilisateur_nom': f"{d.utilisateur.nom} {d.utilisateur.prenom}" if d.utilisateur else None,
            'type_conge_id': d.type_conge_id,
            'type_conge_nom': d.type_conge.nom if d.type_conge else None,
            'date_debut': d.date_debut.strftime('%Y-%m-%d'),
            'date_fin': d.date_fin.strftime('%Y-%m-%d'),
            'nb_jours': d.nb_jours,
            'statut_phase1': d.statut_phase1,
            'statut_final': d.statut_final,
            'statut': d.statut,
            'motif': d.motif,
            'date_demande': d.date_demande.strftime('%Y-%m-%d %H:%M:%S') if d.date_demande else None,
            'date_modification': d.date_modification.strftime('%Y-%m-%d %H:%M:%S') if d.date_modification else None
        })
    return jsonify(result)


def get_demandes_visibles_service(user_id: int):
    user = Utilisateur.query.get(user_id)
    if not user:
        return None, "Utilisateur introuvable"

    role_name = _get_role_name(user)

    if role_name == "super_admin":
        demandes = Demande.query.all()
    else:
        demandes = (Demande.query
                    .join(Utilisateur, Demande.utilisateur)
                    .join(Grade, Utilisateur.grade_id == Grade.id)
                    .filter(
                        Utilisateur.departement_id == user.departement_id,
                        Grade.pouvoir < user.grade.pouvoir
                    ).all())

    result = []
    for d in demandes:
        result.append({
            'id': d.id,
            'utilisateur_id': d.utilisateur_id,
            'utilisateur_nom': f"{d.utilisateur.nom} {d.utilisateur.prenom}" if d.utilisateur else None,
            'type_conge_id': d.type_conge_id,
            'type_conge_nom': d.type_conge.nom if d.type_conge else None,
            'date_debut': d.date_debut.strftime('%Y-%m-%d'),
            'date_fin': d.date_fin.strftime('%Y-%m-%d'),
            'nb_jours': d.nb_jours,
            'statut_phase1': d.statut_phase1,
            'statut_final': d.statut_final,
            'statut': d.statut,
            'motif': d.motif,
            'date_demande': d.date_demande.strftime('%Y-%m-%d %H:%M:%S') if d.date_demande else None,
            'date_modification': d.date_modification.strftime('%Y-%m-%d %H:%M:%S') if d.date_modification else None
        })
    return result, None


# -------------------- Nettoyage --------------------
def supprimer_demandes_expirees():
    limite = datetime.utcnow() - timedelta(days=30)
    demandes_a_supprimer = Demande.query.filter(
        Demande.statut.in_(['accepté', 'rejeté']),
        Demande.date_modification < limite
    ).all()
    try:
        for d in demandes_a_supprimer:
            db.session.delete(d)
        db.session.commit()
        return len(demandes_a_supprimer), None
    except Exception as e:
        db.session.rollback()
        return 0, str(e)


def get_derniere_demande_utilisateur(user_id: int):
    user = Utilisateur.query.get(user_id)
    if not user:
        return None, "Utilisateur introuvable"

    derniere_demande = (Demande.query
                        .filter_by(utilisateur_id=user_id)
                        .order_by(Demande.date_demande.desc())
                        .first())
    if not derniere_demande:
        return None, "Aucune demande trouvée"

    return {
        'id': derniere_demande.id,
        'utilisateur_id': derniere_demande.utilisateur_id,
        'utilisateur_nom': f"{derniere_demande.utilisateur.nom} {derniere_demande.utilisateur.prenom}" if derniere_demande.utilisateur else None,
        'type_conge_id': derniere_demande.type_conge_id,
        'type_conge_nom': derniere_demande.type_conge.nom if derniere_demande.type_conge else None,
        'date_debut': derniere_demande.date_debut.strftime('%Y-%m-%d'),
        'date_fin': derniere_demande.date_fin.strftime('%Y-%m-%d'),
        'nb_jours': derniere_demande.nb_jours,
        'statut_phase1': derniere_demande.statut_phase1,
        'statut_final': derniere_demande.statut_final,
        'statut': derniere_demande.statut,
        'motif': derniere_demande.motif,
        'date_demande': derniere_demande.date_demande.strftime('%Y-%m-%d %H:%M:%S') if derniere_demande.date_demande else None,
        'date_modification': derniere_demande.date_modification.strftime('%Y-%m-%d %H:%M:%S') if derniere_demande.date_modification else None
    }, None
