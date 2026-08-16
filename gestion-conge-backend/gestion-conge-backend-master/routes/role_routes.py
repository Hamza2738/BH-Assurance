from flask import Blueprint, request, jsonify
from services.role_service import (
    create_role,
    get_all_roles,
    get_role_by_id,
    update_role,
    delete_role,
    get_users_by_role
)

role_bp = Blueprint('role_bp', __name__, url_prefix='/roles')

@role_bp.route('/create', methods=['POST'])
def create():
    data = request.form or request.json
    return create_role(data)

@role_bp.route('/', methods=['GET'])
def list_roles():
    return get_all_roles()

@role_bp.route('/<int:role_id>', methods=['GET'])
def detail(role_id):
    return get_role_by_id(role_id)

@role_bp.route('/update/<int:role_id>', methods=['POST'])
def update(role_id):
    data = request.form or request.json
    return update_role(role_id, data)

@role_bp.route('/delete/<int:role_id>', methods=['POST'])
def delete(role_id):
    return delete_role(role_id)

@role_bp.route('/<int:role_id>/users', methods=['GET'])
def users_by_role(role_id):
    return get_users_by_role(role_id)
