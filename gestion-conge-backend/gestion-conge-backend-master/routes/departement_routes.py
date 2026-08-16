from flask import Blueprint, request, jsonify
from services.departement_service import (
    create_departement, get_all_departements, get_departement_by_id,
    update_departement, delete_departement, get_employes_by_departement
)

departement_bp = Blueprint('departement_bp', __name__, url_prefix='/departement')

@departement_bp.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    nom = data.get('nom')
    departement, error = create_departement(nom)
    if error:
        return jsonify({"error": error}), 409
    return jsonify(departement.to_dict()), 201

@departement_bp.route('/all', methods=['GET'])
def list_all():
    departements = get_all_departements()
    return jsonify([d.to_dict() for d in departements]), 200

@departement_bp.route('/<int:departement_id>', methods=['GET'])
def get_by_id(departement_id):
    departement = get_departement_by_id(departement_id)
    if not departement:
        return jsonify({"error": "Département non trouvé."}), 404
    return jsonify(departement.to_dict()), 200

@departement_bp.route('/<int:departement_id>/update', methods=['PUT'])
def update(departement_id):
    data = request.get_json()
    nouveau_nom = data.get('nom')
    departement, error = update_departement(departement_id, nouveau_nom)
    if error:
        return jsonify({"error": error}), 409
    return jsonify(departement.to_dict()), 200

@departement_bp.route('/<int:departement_id>/delete', methods=['DELETE'])
def delete(departement_id):
    error = delete_departement(departement_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify({"message": "Département supprimé."}), 200

@departement_bp.route('/<int:departement_id>/employes', methods=['GET'])
def get_employes(departement_id):
    employes, error = get_employes_by_departement(departement_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(employes), 200  # 🔴 pas de [e.to_dict()], car `employes` est déjà une liste de dict
