# routes/notification_routes.py
from __future__ import annotations

from typing import Optional
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest

from models.notification import Notification
from services.notification_service import (
    creer_et_notifier_user,
    creer_notification_db,
    get_notifications_for_user,
    marquer_lu,
    marquer_tout_lu,
)

notification_bp = Blueprint("notification_bp", __name__, url_prefix="/api/notifications")


# -------------------- Helpers --------------------

def _parse_bool(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    v = value.strip().lower()
    if v in ("1", "true", "t", "yes", "y", "on"):
        return True
    if v in ("0", "false", "f", "no", "n", "off"):
        return False
    raise BadRequest("Paramètre booléen invalide (utiliser true/false).")


def _notif_to_dict(n: Notification) -> dict:
    # Utilise ton to_dict() si tu veux une structure custom.
    # Ici on renvoie un payload homogène compatible avec le front et Socket.IO.
    return {
        "ID_NOTIFICATION": n.ID_NOTIFICATION,
        "TITRE": n.TITRE,
        "TEXTE": n.TEXTE,
        "EST_LU": bool(n.EST_LU),
        "DATE_ENVOI": n.DATE_ENVOI.isoformat() if n.DATE_ENVOI else None,
        "ID_UTILISATEUR_EXPEDITEUR": n.ID_UTILISATEUR_EXPEDITEUR,
        "ID_UTILISATEUR_DESTINATAIRE": n.ID_UTILISATEUR_DESTINATAIRE,
        "USERNAME_EXPEDITEUR": n.USERNAME_EXPEDITEUR,
        "USERNAME_DESTINATAIRE": n.USERNAME_DESTINATAIRE,
        "UTILISATEUR_EXPEDITEUR_ID": n.UTILISATEUR_EXPEDITEUR_ID,
        "UTILISATEUR_DESTINATAIRE_ID": n.UTILISATEUR_DESTINATAIRE_ID,
        "ID_TYPE_NOTIFICATION": n.ID_TYPE_NOTIFICATION,
        "ID_DEROGATION": n.ID_DEROGATION,
    }


# -------------------- Routes --------------------

@notification_bp.get("")
def list_notifications():
    """
    GET /api/notifications?dest_id_fk=123&dest_id_legacy=abc&est_lu=false&page=1&page_size=20
    - On accepte soit l'ID FK int (dest_id_fk) soit l'ID legacy string (dest_id_legacy), ou les deux.
    - est_lu: true/false (optionnel)
    """
    try:
        dest_id_fk = request.args.get("dest_id_fk", type=int)
        dest_id_legacy = request.args.get("dest_id_legacy")
        est_lu = _parse_bool(request.args.get("est_lu"))
        page = request.args.get("page", default=1, type=int)
        page_size = request.args.get("page_size", default=20, type=int)

        items, total = get_notifications_for_user(
            utilisateur_destinataire_id=dest_id_fk,
            id_utilisateur_destinataire=dest_id_legacy,
            est_lu=est_lu,
            page=page,
            page_size=page_size,
        )
        data = [_notif_to_dict(n) for n in items]
        return jsonify({
            "items": data,
            "total": total,
            "page": page,
            "page_size": page_size
        }), 200
    except BadRequest as br:
        return jsonify({"error": str(br)}), 400
    except Exception as exc:
        return jsonify({"error": f"Erreur lors de la récupération des notifications: {exc}"}), 500


@notification_bp.get("/unread_count")
def unread_count():
    """
    GET /api/notifications/unread_count?dest_id_fk=123&dest_id_legacy=abc
    Retourne { count: <int> } du nombre de notifications non lues.
    """
    try:
        dest_id_fk = request.args.get("dest_id_fk", type=int)
        dest_id_legacy = request.args.get("dest_id_legacy")

        items, total = get_notifications_for_user(
            utilisateur_destinataire_id=dest_id_fk,
            id_utilisateur_destinataire=dest_id_legacy,
            est_lu=False,
            page=1,
            page_size=1_000_000,  # valeur large pour compter (simple)
        )
        return jsonify({"count": total}), 200
    except BadRequest as br:
        return jsonify({"error": str(br)}), 400
    except Exception as exc:
        return jsonify({"error": f"Erreur lors du comptage des non lus: {exc}"}), 500


@notification_bp.post("")
def create_notification():
    """
    POST /api/notifications
    Body JSON attendu (tous les champs legacy requis car ton modèle les rend NOT NULL) :
    {
      "titre": "...",
      "texte": "...",
      "id_utilisateur_expediteur": "42",   // legacy string
      "id_utilisateur_destinataire": "17", // legacy string
      "username_expediteur": "john.doe",
      "username_destinataire": "manager.ouest",
      "id_type_notification": 1,
      "id_derogation": null,               // optionnel
      "utilisateur_expediteur_id": 42,     // FK int optionnel
      "utilisateur_destinataire_id": 17    // FK int optionnel
    }

    Comportement: crée en DB puis push temps réel (Socket.IO) vers l'utilisateur destinataire.
    """
    try:
        payload = request.get_json(force=True) or {}
        required = [
            "titre", "texte",
            "id_utilisateur_expediteur", "id_utilisateur_destinataire",
            "username_expediteur", "username_destinataire",
            "id_type_notification",
        ]
        missing = [k for k in required if payload.get(k) in (None, "")]
        if missing:
            return jsonify({"error": f"Champs requis manquants: {', '.join(missing)}"}), 400

        notif = creer_et_notifier_user(
            titre=payload["titre"],
            texte=payload["texte"],
            id_utilisateur_expediteur=str(payload["id_utilisateur_expediteur"]),
            id_utilisateur_destinataire=str(payload["id_utilisateur_destinataire"]),
            username_expediteur=payload["username_expediteur"],
            username_destinataire=payload["username_destinataire"],
            id_type_notification=int(payload["id_type_notification"]),
            id_derogation=payload.get("id_derogation"),
            utilisateur_expediteur_id=payload.get("utilisateur_expediteur_id"),
            utilisateur_destinataire_id=payload.get("utilisateur_destinataire_id"),
        )
        return jsonify({"notification": _notif_to_dict(notif)}), 201
    except BadRequest as br:
        return jsonify({"error": str(br)}), 400
    except Exception as exc:
        return jsonify({"error": f"Erreur lors de la création de la notification: {exc}"}), 500


@notification_bp.patch("/<int:notification_id>/read")
def mark_read(notification_id: int):
    """
    PATCH /api/notifications/<id>/read
    Body JSON optionnel : { "par_utilisateur_dest_id": 17, "par_id_legacy": "17" }
    Permet de vérifier que celui qui demande est bien destinataire.
    """
    try:
        payload = request.get_json(silent=True) or {}
        par_fk = payload.get("par_utilisateur_dest_id")
        par_legacy = payload.get("par_id_legacy")

        notif = marquer_lu(notification_id, par_utilisateur_dest_id=par_fk, par_id_legacy=par_legacy)
        return jsonify({"notification": _notif_to_dict(notif)}), 200
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as exc:
        return jsonify({"error": f"Erreur lors du marquage 'lu': {exc}"}), 500


@notification_bp.post("/mark_all_read")
def mark_all_read():
    """
    POST /api/notifications/mark_all_read
    Body JSON:
    { "utilisateur_destinataire_id": 17 }  // FK int
    OU
    { "id_utilisateur_destinataire": "17" } // Legacy string

    Retourne { "updated": <int> }
    """
    try:
        payload = request.get_json(force=True) or {}
        fk_id = payload.get("utilisateur_destinataire_id")
        legacy_id = payload.get("id_utilisateur_destinataire")
        if fk_id is None and legacy_id is None:
            return jsonify({"error": "Fournir 'utilisateur_destinataire_id' (FK int) ou 'id_utilisateur_destinataire' (legacy str)."}), 400

        updated = marquer_tout_lu(
            utilisateur_destinataire_id=fk_id,
            id_utilisateur_destinataire=legacy_id,
        )
        return jsonify({"updated": updated}), 200
    except BadRequest as br:
        return jsonify({"error": str(br)}), 400
    except Exception as exc:
        return jsonify({"error": f"Erreur lors du marquage global 'lu': {exc}"}), 500
