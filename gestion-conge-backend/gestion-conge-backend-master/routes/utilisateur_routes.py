from flask import Blueprint, request
from services.utilisateur_service import (
    create_utilisateur_by_superadmin,
    get_all_utilisateurs,
    get_utilisateur_by_id,
    update_utilisateur,
    delete_utilisateur
)

utilisateur_bp = Blueprint('utilisateur_bp', __name__, url_prefix='/utilisateurs')


# CREATE - Créer un utilisateur (POST /utilisateurs)
@utilisateur_bp.route('/', methods=['POST'])
def create_utilisateur():
    data = request.get_json()
    if not data:
        return {'message': 'Données manquantes'}, 400
    return create_utilisateur_by_superadmin(data)


# READ ALL - Lister tous les utilisateurs (GET /utilisateurs)
@utilisateur_bp.route('/', methods=['GET'])
def list_utilisateurs():
    return get_all_utilisateurs()


# READ ONE - Obtenir un utilisateur par ID (GET /utilisateurs/<id>)
@utilisateur_bp.route('/<int:utilisateur_id>', methods=['GET'])
def get_utilisateur(utilisateur_id):
    return get_utilisateur_by_id(utilisateur_id)


# UPDATE - Modifier un utilisateur par ID (PUT /utilisateurs/<id>)
@utilisateur_bp.route('/<int:utilisateur_id>', methods=['PUT'])
def update_utilisateur_route(utilisateur_id):
    data = request.get_json()
    if not data:
        return {'message': 'Données manquantes'}, 400
    return update_utilisateur(utilisateur_id, data)


# DELETE - Supprimer un utilisateur par ID (DELETE /utilisateurs/<id>)
@utilisateur_bp.route('/<int:utilisateur_id>', methods=['DELETE'])
def delete_utilisateur_route(utilisateur_id):
    return delete_utilisateur(utilisateur_id)
