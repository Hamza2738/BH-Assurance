from flask import jsonify
from extension import db
from models.role import Role
from models.utilisateur import Utilisateur

# --- Créer un rôle ---
def create_role(data):
    try:
        nom = data.get('nom')
        if not nom:
            return jsonify({'error': 'Le nom du rôle est requis'}), 400

        if Role.query.filter_by(nom=nom).first():
            return jsonify({'error': 'Ce rôle existe déjà'}), 409

        nouveau_role = Role(nom=nom)
        db.session.add(nouveau_role)
        db.session.commit()

        return jsonify({
            'message': 'Rôle créé avec succès',
            'role': {'id': nouveau_role.id, 'nom': nouveau_role.nom}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- Récupérer tous les rôles ---
def get_all_roles():
    try:
        roles = Role.query.all()
        result = [{'id': r.id, 'nom': r.nom} for r in roles]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Récupérer un rôle par ID ---
def get_role_by_id(role_id):
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Rôle non trouvé'}), 404
        return jsonify({'id': role.id, 'nom': role.nom}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Mettre à jour un rôle ---
def update_role(role_id, data):
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Rôle non trouvé'}), 404

        nouveau_nom = data.get('nom', role.nom)
        if nouveau_nom != role.nom and Role.query.filter_by(nom=nouveau_nom).first():
            return jsonify({'error': 'Ce nom de rôle existe déjà'}), 409

        role.nom = nouveau_nom
        db.session.commit()

        return jsonify({
            'message': 'Rôle mis à jour avec succès',
            'role': {'id': role.id, 'nom': role.nom}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- Supprimer un rôle ---
def delete_role(role_id):
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Rôle non trouvé'}), 404

        if role.utilisateurs and len(role.utilisateurs) > 0:
            return jsonify({'error': 'Impossible de supprimer un rôle assigné à des utilisateurs'}), 400

        db.session.delete(role)
        db.session.commit()
        return jsonify({'message': 'Rôle supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- Récupérer les utilisateurs d’un rôle ---
def get_users_by_role(role_id):
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Rôle non trouvé'}), 404

        utilisateurs = role.utilisateurs
        data = []
        for u in utilisateurs:
            data.append({
                'id': u.id,
                'nom': u.nom,
                'prenom': u.prenom,
                'email': u.email,
                'poste': u.poste,
                'is_active': u.is_active
            })

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
