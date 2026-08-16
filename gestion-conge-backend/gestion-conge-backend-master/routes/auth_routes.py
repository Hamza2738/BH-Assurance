from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import (
    create_access_token, get_jwt_identity, jwt_required
)
from services.auth_service import change_password_service
from models.utilisateur import Utilisateur
from extension import db
from flask_cors import cross_origin

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email et mot de passe requis"}), 400

    user = Utilisateur.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"message": "Identifiants invalides"}), 401

    if not user.is_active:
        return jsonify({"message": "Compte désactivé"}), 403

    session['user_id'] = user.id
    token = create_access_token(identity=user.email)

    return jsonify({
        "message": "Connexion réussie",
        "user": {
            "id": user.id,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "role_id": user.role_id,
            "departement_id": user.departement_id,
            "grade_id": user.grade_id,
            "is_active": user.is_active
        },
        "token": token
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@cross_origin()
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Déconnexion réussie"}), 200

@auth_bp.route('/reset-password', methods=['POST'])
@cross_origin()
@jwt_required()
def reset_password():
    data = request.get_json()
    new_password = data.get('new_password')

    if not new_password or len(new_password) < 6:
        return jsonify({"message": "Mot de passe invalide"}), 400

    email = get_jwt_identity()
    user = Utilisateur.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Mot de passe réinitialisé avec succès"}), 200
