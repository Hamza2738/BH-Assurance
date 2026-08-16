from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.type_conge_service import (
    create_type_conge_service,
    get_all_types_conge_service,
    get_type_conge_by_id_service,
    update_type_conge_service,
    delete_type_conge_service
)

type_conge_bp = Blueprint('type_conge_bp', __name__, url_prefix='/api/types-conge')

@type_conge_bp.route('/', methods=['GET'])
def get_all_type_conges():
    # Récupère tous les types de congé
    return get_all_types_conge_service()

@type_conge_bp.route('/<int:type_id>', methods=['GET'])
def get_type_conge(type_id):
    # Récupère un type de congé par son id
    return get_type_conge_by_id_service(type_id)

@type_conge_bp.route('/', methods=['POST'])
def create_type_conge():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Données JSON requises"}), 400
    return create_type_conge_service(data)

@type_conge_bp.route('/<int:type_id>', methods=['PUT'])
def update_type_conge(type_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Données JSON requises"}), 400
    return update_type_conge_service(type_id, data)

@type_conge_bp.route('/<int:type_id>', methods=['DELETE'])
def delete_type_conge(type_id):
    return delete_type_conge_service(type_id)
