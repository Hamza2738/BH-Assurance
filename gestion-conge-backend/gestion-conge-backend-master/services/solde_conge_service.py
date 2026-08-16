from flask import jsonify
from extension import db
from models.solde_conge import SoldeConge
from models.type_conge import TypeConge
from models.utilisateur import Utilisateur
from datetime import datetime, timedelta

def calcul_prorata(date_entree, periode):
    today = datetime.utcnow().date()
    annee_courante = today.year

    if not date_entree or date_entree.year < annee_courante:
        return 1.0

    mois_entree = date_entree.month
    jour_entree = date_entree.day

    if periode == 'annuelle':
        mois_restants = 12 - mois_entree + 1
        return mois_restants / 12.0

    elif periode == 'mensuelle':
        mois_restants = 12 - mois_entree + 1
        try:
            prochain_mois = mois_entree % 12 + 1
            annee_prochain_mois = annee_courante if prochain_mois > 1 else annee_courante + 1
            dernier_jour_mois = (datetime(annee_prochain_mois, prochain_mois, 1) - timedelta(days=1)).day
        except Exception:
            dernier_jour_mois = 30
        jours_restants_mois = dernier_jour_mois - jour_entree + 1
        prorata_mois = jours_restants_mois / dernier_jour_mois
        return (mois_restants - 1 + prorata_mois) / 12.0

    elif periode == 'hebdomadaire':
        semaine_entree = date_entree.isocalendar()[1]
        semaines_dans_annee = datetime(annee_courante, 12, 28).isocalendar()[1]
        semaines_restantes = semaines_dans_annee - semaine_entree + 1
        return semaines_restantes / semaines_dans_annee

    else:
        # non_rechargeable ou autre périodicité => 1.0 par défaut
        return 1.0

# ----------------------------------------
# Création automatique des soldes pour tous les utilisateurs
# à l'ajout d'un nouveau type de congé
# ----------------------------------------
def creer_soldes_pour_nouveau_type(type_conge):
    try:
        utilisateurs = Utilisateur.query.all()
        annee = datetime.utcnow().year
        periode = type_conge.periode.lower()
        duree = type_conge.duree

        for user in utilisateurs:
            date_entree = getattr(user, 'date_ajout', None)
            prorata = calcul_prorata(date_entree, periode)
            solde_initial = duree * prorata

            solde_exist = SoldeConge.query.filter_by(
                utilisateur_id=user.id,
                type_conge_id=type_conge.id,
                annee=annee
            ).first()

            if not solde_exist:
                solde = SoldeConge(
                    utilisateur_id=user.id,
                    type_conge_id=type_conge.id,
                    annee=annee,
                    solde=solde_initial,
                    last_recharge=datetime.utcnow()
                )
                db.session.add(solde)
        db.session.commit()
        return True, None
    except Exception as e:
        db.session.rollback()
        return False, str(e)

# ----------------------------------------
# Récupérer soldes par utilisateur
# ----------------------------------------
def get_soldes_by_user(user_id):
    soldes = SoldeConge.query.filter_by(utilisateur_id=user_id).order_by(SoldeConge.annee.desc()).all()
    result = []
    for s in soldes:
        result.append({
            'id': s.id,
            'utilisateur_id': s.utilisateur_id,
            'type_conge_id': s.type_conge_id,
            'annee': s.annee,
            'solde': s.solde,
            'last_recharge': s.last_recharge.isoformat() if s.last_recharge else None
        })
    return jsonify(result), 200

# ----------------------------------------
# Consommer des jours (avec déduction prioritaire sur année précédente)
# ----------------------------------------
def consommer_conge(utilisateur_id, type_conge_id, nb_jours):
    today = datetime.utcnow()
    annee = today.year

    solde_courant = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id,
        type_conge_id=type_conge_id,
        annee=annee
    ).first()

    solde_precedent = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id,
        type_conge_id=type_conge_id,
        annee=annee - 1
    ).first()

    if not solde_courant and not solde_precedent:
        return False, "Aucun solde trouvé pour cet utilisateur et type de congé"

    restant_a_deduire = nb_jours

    if solde_precedent and solde_precedent.solde > 0:
        deduction = min(solde_precedent.solde, restant_a_deduire)
        solde_precedent.solde -= deduction
        restant_a_deduire -= deduction

    if solde_courant:
        solde_courant.solde -= restant_a_deduire
    else:
        solde_courant = SoldeConge(
            utilisateur_id=utilisateur_id,
            type_conge_id=type_conge_id,
            annee=annee,
            solde=-restant_a_deduire,
            last_recharge=today
        )
        db.session.add(solde_courant)

    db.session.commit()
    return True, solde_courant.solde

# ----------------------------------------
# Recharge périodique automatique des soldes
# ----------------------------------------
def recharger_soldes():
    today = datetime.utcnow()
    utilisateurs = Utilisateur.query.all()
    types_conge = TypeConge.query.all()

    for user in utilisateurs:
        for type_conge in types_conge:
            annee = today.year
            solde = SoldeConge.query.filter_by(
                utilisateur_id=user.id,
                type_conge_id=type_conge.id,
                annee=annee
            ).first()

            date_entree = getattr(user, 'date_ajout', None)
            periode = type_conge.periode.lower()
            prorata = calcul_prorata(date_entree, periode)
            duree = type_conge.duree

            # Création du solde si inexistant
            if not solde:
                solde_valeur = duree * prorata
                solde = SoldeConge(
                    utilisateur_id=user.id,
                    type_conge_id=type_conge.id,
                    annee=annee,
                    solde=solde_valeur,
                    last_recharge=today
                )
                db.session.add(solde)
                continue

            # Calcul du delta temps depuis dernière recharge
            delta = today - solde.last_recharge if solde.last_recharge else timedelta(days=999)

            if periode == 'mensuelle' and delta.days >= 30:
                solde.solde += duree
                solde.last_recharge = today

            elif periode == 'hebdomadaire' and delta.days >= 7:
                solde.solde += duree
                solde.last_recharge = today

            elif periode == 'annuelle' and today.month == 1 and delta.days >= 365:
                solde.solde += duree
                solde.last_recharge = today

            # 'non_rechargeable' ou autre périodicité => ne rien faire

    db.session.commit()
    return True, "Recharge périodique effectuée"

# ----------------------------------------
# CRUD classiques pour solde_conge
# ----------------------------------------
def create_solde(utilisateur_id, type_conge_id, annee, solde_initial):
    solde_exist = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id,
        type_conge_id=type_conge_id,
        annee=annee
    ).first()
    if solde_exist:
        return False, "Solde déjà existant pour cet utilisateur, type et année"

    solde = SoldeConge(
        utilisateur_id=utilisateur_id,
        type_conge_id=type_conge_id,
        annee=annee,
        solde=solde_initial,
        last_recharge=datetime.utcnow()
    )
    db.session.add(solde)
    db.session.commit()
    return True, solde.id

def update_solde(solde_id, nouvelle_valeur):
    solde = SoldeConge.query.get(solde_id)
    if not solde:
        return False, "Solde non trouvé"
    solde.solde = nouvelle_valeur
    solde.last_recharge = datetime.utcnow()
    db.session.commit()
    return True, "Solde mis à jour"

def delete_solde(solde_id):
    solde = SoldeConge.query.get(solde_id)
    if not solde:
        return False, "Solde non trouvé"
    db.session.delete(solde)
    db.session.commit()
    return True, "Solde supprimé"
