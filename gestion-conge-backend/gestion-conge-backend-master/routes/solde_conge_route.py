from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from services.solde_conge_service import (
    calcul_prorata,
    creer_soldes_pour_nouveau_type,
    get_soldes_by_user,
    consommer_conge,
    recharger_soldes,
    create_solde,
    update_solde,
    delete_solde,
)
from models.solde_conge import SoldeConge
from extension import db

solde_conge_bp = Blueprint("solde_conge", __name__, url_prefix="/soldes")

# 1️⃣ Création manuelle d'un solde
@solde_conge_bp.route("/", methods=["POST"])
def create_solde_route():
    data = request.get_json()
    utilisateur_id = data.get("utilisateur_id")
    type_conge_id = data.get("type_conge_id")
    solde_initial = data.get("solde")
    annee = data.get("annee", datetime.utcnow().year)

    if not utilisateur_id or not type_conge_id or solde_initial is None:
        return jsonify({"error": "Champs manquants"}), 400

    success, result = create_solde(utilisateur_id, type_conge_id, annee, solde_initial)
    if not success:
        return jsonify({"error": result}), 409
    return jsonify({"message": "Solde créé avec succès", "id": result}), 201

# 2️⃣ Récupérer tous les soldes d’un utilisateur (tous types, années)
@solde_conge_bp.route("/utilisateur/<int:utilisateur_id>", methods=["GET"])
def get_soldes_utilisateur_route(utilisateur_id):
    return get_soldes_by_user(utilisateur_id)

# 3️⃣ Récupérer un solde précis par utilisateur/type/année
@solde_conge_bp.route("/<int:utilisateur_id>/<int:type_conge_id>", methods=["GET"])
def get_solde_precis_route(utilisateur_id, type_conge_id):
    annee = request.args.get("annee", datetime.utcnow().year, type=int)
    solde = SoldeConge.query.filter_by(
        utilisateur_id=utilisateur_id,
        type_conge_id=type_conge_id,
        annee=annee
    ).first()

    if not solde:
        return jsonify({"error": "Aucun solde trouvé"}), 404

    return jsonify({
        "utilisateur_id": utilisateur_id,
        "type_conge_id": type_conge_id,
        "annee": annee,
        "solde": solde.solde,
        "last_recharge": solde.last_recharge.isoformat() if solde.last_recharge else None
    }), 200

# 4️⃣ Mise à jour manuelle du solde
@solde_conge_bp.route("/<int:solde_id>", methods=["PUT"])
def update_solde_route(solde_id):
    data = request.get_json()
    nouvelle_valeur = data.get("solde")

    if nouvelle_valeur is None:
        return jsonify({"error": "Valeur solde manquante"}), 400

    success, result = update_solde(solde_id, nouvelle_valeur)
    if not success:
        return jsonify({"error": result}), 404

    return jsonify({"message": result, "solde": nouvelle_valeur}), 200

# 5️⃣ Suppression d'un solde
@solde_conge_bp.route("/<int:solde_id>", methods=["DELETE"])
def delete_solde_route(solde_id):
    success, result = delete_solde(solde_id)
    if not success:
        return jsonify({"error": result}), 404
    return jsonify({"message": result}), 200

# 6️⃣ Consommer (déduire) des jours après demande acceptée
@solde_conge_bp.route("/consommer", methods=["POST"])
def consommer_solde_route():
    data = request.get_json()
    utilisateur_id = data.get("utilisateur_id")
    type_conge_id = data.get("type_conge_id")
    jours_pris = data.get("jours_pris")

    if not utilisateur_id or not type_conge_id or jours_pris is None:
        return jsonify({"error": "Champs manquants"}), 400

    success, result = consommer_conge(utilisateur_id, type_conge_id, jours_pris)
    if not success:
        return jsonify({"error": result}), 404

    return jsonify({
        "message": "Solde déduit avec succès",
        "solde_restant": result
    }), 200

# 7️⃣ Recharge périodique automatique (à lancer via tâche planifiée par ex.)
@solde_conge_bp.route("/recharger", methods=["POST"])
def recharger_soldes_route():
    success, message = recharger_soldes()
    if not success:
        return jsonify({"error": message}), 500
    return jsonify({"message": message}), 200

# 8️⃣ Création automatique des soldes lors de l’ajout d’un nouveau type de congé
@solde_conge_bp.route("/creer_soldes_nouveau_type/<int:type_conge_id>", methods=["POST"])
def creer_soldes_nouveau_type_route(type_conge_id):
    from models.type_conge import TypeConge

    type_conge = TypeConge.query.get(type_conge_id)
    if not type_conge:
        return jsonify({"error": "Type de congé non trouvé"}), 404

    success, message = creer_soldes_pour_nouveau_type(type_conge)
    if not success:
        return jsonify({"error": message}), 500
    return jsonify({"message": "Soldes créés pour le nouveau type de congé"}), 201
