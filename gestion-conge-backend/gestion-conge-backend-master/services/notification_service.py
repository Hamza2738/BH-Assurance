# services/notification_service.py
from __future__ import annotations

from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

from extension import db
from models.notification import Notification
from socketio_instance import (
    emit_notification_to_user,
    emit_notification_to_role,
    emit_notification_to_manager_dept,
)

# ----------------- Utilitaires internes -----------------

def _notif_payload(notif: Notification) -> Dict[str, Any]:
    """Construit un payload homogène pour le front Socket.IO."""
    return {
        "id": notif.ID_NOTIFICATION,
        "titre": notif.TITRE,
        "texte": notif.TEXTE,
        "est_lu": bool(notif.EST_LU),
        "date_envoi": notif.DATE_ENVOI.isoformat() if notif.DATE_ENVOI else None,
        # Legacy + FKs pour compatibilité totale
        "id_utilisateur_expediteur": notif.ID_UTILISATEUR_EXPEDITEUR,
        "id_utilisateur_destinataire": notif.ID_UTILISATEUR_DESTINATAIRE,
        "username_expediteur": notif.USERNAME_EXPEDITEUR,
        "username_destinataire": notif.USERNAME_DESTINATAIRE,
        "utilisateur_expediteur_id": notif.UTILISATEUR_EXPEDITEUR_ID,
        "utilisateur_destinataire_id": notif.UTILISATEUR_DESTINATAIRE_ID,
        "id_type_notification": notif.ID_TYPE_NOTIFICATION,
        "id_derogation": notif.ID_DEROGATION,
    }

def _commit_or_raise():
    try:
        db.session.commit()
    except SQLAlchemyError as exc:
        db.session.rollback()
        raise RuntimeError(f"Erreur base de données: {exc}")

# ----------------- CRUD principal -----------------

def creer_notification_db(
    titre: str,
    texte: str,
    *,
    # Legacy string ids (obligatoires selon ton modèle)
    id_utilisateur_expediteur: str,
    id_utilisateur_destinataire: str,
    username_expediteur: str,
    username_destinataire: str,
    # Nouveaux IDs FKs optionnels (migration)
    utilisateur_expediteur_id: Optional[int] = None,
    utilisateur_destinataire_id: Optional[int] = None,
    id_type_notification: int,
    id_derogation: Optional[int] = None,
) -> Notification:
    """
    Crée et persiste une Notification en respectant TES models inchangés.
    """
    notif = Notification(
        TITRE=titre,
        TEXTE=texte,
        EST_LU=False,
        DATE_ENVOI=datetime.utcnow(),
        ID_UTILISATEUR_EXPEDITEUR=id_utilisateur_expediteur,
        ID_UTILISATEUR_DESTINATAIRE=id_utilisateur_destinataire,
        USERNAME_EXPEDITEUR=username_expediteur,
        USERNAME_DESTINATAIRE=username_destinataire,
        UTILISATEUR_EXPEDITEUR_ID=utilisateur_expediteur_id,
        UTILISATEUR_DESTINATAIRE_ID=utilisateur_destinataire_id,
        ID_TYPE_NOTIFICATION=id_type_notification,
        ID_DEROGATION=id_derogation,
    )
    db.session.add(notif)
    _commit_or_raise()
    return notif

def get_notifications_for_user(
    *,
    # on accepte soit l'ID FK int, soit l'ID legacy string
    utilisateur_destinataire_id: Optional[int] = None,
    id_utilisateur_destinataire: Optional[str] = None,
    est_lu: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
    order_desc: bool = True,
) -> Tuple[List[Notification], int]:
    """
    Récupère les notifications d'un utilisateur (pagination).
    Retourne (items, total_count).
    """
    if utilisateur_destinataire_id is None and id_utilisateur_destinataire is None:
        raise ValueError("Fournir utilisateur_destinataire_id (FK int) ou id_utilisateur_destinataire (legacy str).")

    query = Notification.query

    # Filtre destinataire (supporter FK OU legacy)
    if utilisateur_destinataire_id is not None and id_utilisateur_destinataire is not None:
        query = query.filter(
            or_(
                Notification.UTILISATEUR_DESTINATAIRE_ID == utilisateur_destinataire_id,
                Notification.ID_UTILISATEUR_DESTINATAIRE == str(id_utilisateur_destinataire),
            )
        )
    elif utilisateur_destinataire_id is not None:
        query = query.filter(Notification.UTILISATEUR_DESTINATAIRE_ID == utilisateur_destinataire_id)
    else:
        query = query.filter(Notification.ID_UTILISATEUR_DESTINATAIRE == str(id_utilisateur_destinataire))

    if est_lu is not None:
        query = query.filter(Notification.EST_LU.is_(bool(est_lu)))

    query = query.order_by(Notification.DATE_ENVOI.desc() if order_desc else Notification.DATE_ENVOI.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total

def marquer_lu(notification_id: int, *, par_utilisateur_dest_id: Optional[int] = None, par_id_legacy: Optional[str] = None) -> Notification:
    """
    Marque une notification comme lue. Optionnellement vérifie que le demandeur est bien le destinataire.
    """
    notif = Notification.query.get(notification_id)
    if not notif:
        raise ValueError("Notification introuvable.")

    # Vérification d'appartenance si demandé
    if par_utilisateur_dest_id is not None and notif.UTILISATEUR_DESTINATAIRE_ID is not None:
        if notif.UTILISATEUR_DESTINATAIRE_ID != par_utilisateur_dest_id:
            raise PermissionError("Vous n'êtes pas le destinataire de cette notification.")
    if par_id_legacy is not None and notif.ID_UTILISATEUR_DESTINATAIRE is not None:
        if str(notif.ID_UTILISATEUR_DESTINATAIRE) != str(par_id_legacy):
            raise PermissionError("Vous n'êtes pas le destinataire de cette notification.")

    notif.EST_LU = True
    _commit_or_raise()
    return notif

def marquer_tout_lu(
    *,
    utilisateur_destinataire_id: Optional[int] = None,
    id_utilisateur_destinataire: Optional[str] = None,
) -> int:
    """
    Marque TOUTES les notifications du destinataire comme lues.
    Retourne le nombre de lignes affectées.
    """
    if utilisateur_destinataire_id is None and id_utilisateur_destinataire is None:
        raise ValueError("Fournir utilisateur_destinataire_id (FK int) ou id_utilisateur_destinataire (legacy str).")

    query = Notification.query.filter(Notification.EST_LU.is_(False))

    if utilisateur_destinataire_id is not None and id_utilisateur_destinataire is not None:
        query = query.filter(
            or_(
                Notification.UTILISATEUR_DESTINATAIRE_ID == utilisateur_destinataire_id,
                Notification.ID_UTILISATEUR_DESTINATAIRE == str(id_utilisateur_destinataire),
            )
        )
    elif utilisateur_destinataire_id is not None:
        query = query.filter(Notification.UTILISATEUR_DESTINATAIRE_ID == utilisateur_destinataire_id)
    else:
        query = query.filter(Notification.ID_UTILISATEUR_DESTINATAIRE == str(id_utilisateur_destinataire))

    updated = 0
    for n in query.all():
        n.EST_LU = True
        updated += 1
    _commit_or_raise()
    return updated

# ----------------- Envoi temps réel (Socket.IO) -----------------

def push_notification_to_user(notif: Notification):
    """
    Envoie l'événement 'notification:new' à la room de l'utilisateur destinataire.
    On privilégie l'ID FK si présent, sinon on utilise l'ID legacy string.
    """
    payload = _notif_payload(notif)
    user_room = notif.UTILISATEUR_DESTINATAIRE_ID if notif.UTILISATEUR_DESTINATAIRE_ID is not None else notif.ID_UTILISATEUR_DESTINATAIRE
    emit_notification_to_user(user_room, payload)

def push_notification_to_role(role: str, notif: Notification):
    """Envoie l'événement 'notification:new' à une room de rôle."""
    emit_notification_to_role(role, _notif_payload(notif))

def push_notification_to_manager_dept(dept_id: int | str, notif: Notification):
    """Envoie l'événement 'notification:new' à la room 'manager_dept_<dept_id>'."""
    emit_notification_to_manager_dept(dept_id, _notif_payload(notif))

# ----------------- Helpers combinés -----------------

def creer_et_notifier_user(
    *,
    titre: str,
    texte: str,
    id_utilisateur_expediteur: str,
    id_utilisateur_destinataire: str,
    username_expediteur: str,
    username_destinataire: str,
    id_type_notification: int,
    id_derogation: Optional[int] = None,
    utilisateur_expediteur_id: Optional[int] = None,
    utilisateur_destinataire_id: Optional[int] = None,
) -> Notification:
    """
    Crée la notification en base, puis push temps réel au destinataire.
    """
    notif = creer_notification_db(
        titre=titre,
        texte=texte,
        id_utilisateur_expediteur=id_utilisateur_expediteur,
        id_utilisateur_destinataire=id_utilisateur_destinataire,
        username_expediteur=username_expediteur,
        username_destinataire=username_destinataire,
        id_type_notification=id_type_notification,
        id_derogation=id_derogation,
        utilisateur_expediteur_id=utilisateur_expediteur_id,
        utilisateur_destinataire_id=utilisateur_destinataire_id,
    )
    push_notification_to_user(notif)
    return notif
