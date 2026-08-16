# routes/demande_routes.py
from __future__ import annotations

from flask import Blueprint, request, jsonify
from typing import Any, Dict, Optional

# ⬇️ bon module (plural)
from services.demande_service import (
    create_demande,
    get_derniere_demande_utilisateur,
    update_demande,
    delete_demande,
    change_statut_manager,
    change_statut_superadmin,
    get_all_demandes,
    get_demandes_visibles_service,
    supprimer_demandes_expirees,
)

demande_bp = Blueprint("demande_bp", __name__, url_prefix="/demandes")


# -------------------- Création --------------------
@demande_bp.route("", methods=["POST"])
def ajouter_demande():
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    current_user_id: Optional[int] = data.get("utilisateur_id")
    if not current_user_id:
        return jsonify({"error": "utilisateur_id manquant"}), 400

    demande, err = create_demande(data, current_user_id)
    if err:
        return jsonify({"error": err}), 400

    # ⚠️ Pas d’appel direct à create_notification ici.
    # Les notifications managers sont déjà envoyées dans services.demandes_service.create_demande()

    return (
        jsonify(
            {
                "message": "Demande créée",
                "demande": {
                    "id": demande.id,
                    "utilisateur_id": demande.utilisateur_id,
                    "type_conge_id": demande.type_conge_id,
                    "date_debut": demande.date_debut.strftime("%Y-%m-%d"),
                    "date_fin": demande.date_fin.strftime("%Y-%m-%d"),
                    "nb_jours": demande.nb_jours,
                    "statut_phase1": demande.statut_phase1,
                    "statut_final": demande.statut_final,
                    "statut": demande.statut,
                    "motif": demande.motif,
                },
            }
        ),
        201,
    )


# -------------------- Modification --------------------
@demande_bp.route("/<int:id>", methods=["PUT"])
def modifier_demande(id: int):
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    current_user_id: Optional[int] = data.get("utilisateur_id")
    if not current_user_id:
        return jsonify({"error": "utilisateur_id manquant"}), 400

    demande, err = update_demande(id, data, current_user_id)
    if err:
        return jsonify({"error": err}), 400

    # ⚠️ Pas de notif ici : le service envoie déjà la notif à l’utilisateur
    return jsonify({"message": "Demande modifiée", "demande_id": id}), 200


# -------------------- Suppression --------------------
@demande_bp.route("/<int:id>", methods=["DELETE"])
def supprimer_demande(id: int):
    utilisateur_id: Optional[int] = request.args.get("utilisateur_id", type=int)
    if not utilisateur_id:
        return jsonify({"error": "utilisateur_id manquant"}), 400

    success, err = delete_demande(id, utilisateur_id)
    if not success:
        return jsonify({"error": err}), 400

    # ⚠️ Pas de notif ici : le service envoie déjà la notif à l’utilisateur
    return jsonify({"message": "Demande supprimée"}), 200


# -------------------- Changement de statut (manager) --------------------
@demande_bp.route("/<int:id>/statut/manager", methods=["PATCH"])
def statut_manager(id: int):
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    decision: Optional[str] = data.get("decision")
    manager_id: Optional[int] = data.get("utilisateur_id")

    if not decision or not manager_id:
        return jsonify({"error": "decision et utilisateur_id requis"}), 400

    demande, err = change_statut_manager(id, manager_id, decision)
    if err:
        return jsonify({"error": err}), 400

    # ⚠️ Pas de notif ici :
    # - Le service notifie automatiquement l’utilisateur
    # - et si accepté par le manager, notifie les super_admins
    return (
        jsonify(
            {
                "message": "Statut modifié (manager)",
                "demande_id": id,
                "statut": demande.statut,
                "statut_phase1": demande.statut_phase1,
                "statut_final": demande.statut_final,
            }
        ),
        200,
    )


# -------------------- Changement de statut (super admin) --------------------
@demande_bp.route("/<int:id>/statut/superadmin", methods=["PATCH"])
def statut_superadmin(id: int):
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    decision: Optional[str] = data.get("decision")
    admin_id: Optional[int] = data.get("utilisateur_id")

    if not decision or not admin_id:
        return jsonify({"error": "decision et utilisateur_id requis"}), 400

    demande, err = change_statut_superadmin(id, admin_id, decision)
    if err:
        return jsonify({"error": err}), 400

    # ⚠️ Pas de notif ici :
    # - Le service notifie l’utilisateur et tous les managers concernés
    return (
        jsonify(
            {
                "message": "Statut modifié (super_admin)",
                "demande_id": id,
                "statut": demande.statut,
                "statut_phase1": demande.statut_phase1,
                "statut_final": demande.statut_final,
            }
        ),
        200,
    )


# -------------------- Récupération --------------------
@demande_bp.route("/all", methods=["GET"])
def toutes_les_demandes():
    return get_all_demandes()


@demande_bp.route("/visibles/<int:user_id>", methods=["GET"])
def demandes_visibles(user_id: int):
    result, err = get_demandes_visibles_service(user_id)
    if err:
        return jsonify({"error": err}), 400
    return jsonify(result), 200


@demande_bp.route("/derniere/<int:user_id>", methods=["GET"])
def derniere_demande(user_id: int):
    result, err = get_derniere_demande_utilisateur(user_id)
    if err:
        return jsonify({"error": err}), 404
    return jsonify(result), 200


# -------------------- Nettoyage --------------------
@demande_bp.route("/nettoyer-expirees", methods=["POST"])
def nettoyage_demandes():
    nb, err = supprimer_demandes_expirees()
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"message": f"{nb} demandes expirées supprimées"}), 200
