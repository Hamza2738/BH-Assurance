from flask import Blueprint, request, jsonify
from services.grade_service import (
    create_grade,
    get_all_grades,
    get_grade_by_id,
    update_grade,
    delete_grade,
    get_users_by_grade,
    filter_users_by_grade_and_poste,
)

grade_bp = Blueprint('grade_bp', __name__, url_prefix='/grade')

@grade_bp.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    return create_grade(data)

@grade_bp.route('/all', methods=['GET'])
def all_grades():
    return get_all_grades()

@grade_bp.route('/<int:grade_id>', methods=['GET'])
def grade_by_id(grade_id):
    return get_grade_by_id(grade_id)

@grade_bp.route('/update/<int:grade_id>', methods=['PUT'])
def update(grade_id):
    data = request.get_json()
    return update_grade(grade_id, data)

@grade_bp.route('/delete/<int:grade_id>', methods=['DELETE'])
def delete(grade_id):
    return delete_grade(grade_id)

@grade_bp.route('/users/<int:grade_id>', methods=['GET'])
def users_by_grade(grade_id):
    return get_users_by_grade(grade_id)

@grade_bp.route('/users/<int:grade_id>/filter', methods=['GET'])
def filter_users(grade_id):
    poste = request.args.get('poste')
    if not poste:
        return jsonify({'error': 'Le paramètre "poste" est requis'}), 400
    return filter_users_by_grade_and_poste(grade_id, poste)
