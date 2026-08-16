from flask import jsonify
from extension import db
from models.utilisateur import Utilisateur
from werkzeug.security import generate_password_hash
from services.email_service import send_account_creation_email
import random
import string
from datetime import datetime

def generate_random_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def create_utilisateur_by_superadmin(data):
    try:
        email = data.get('email')
        cin = data.get('cin')

        if Utilisateur.query.filter_by(email=email).first():
            return jsonify({'message': 'Email déjà utilisé'}), 409

        if Utilisateur.query.filter_by(cin=cin).first():
            return jsonify({'message': 'CIN déjà utilisé'}), 409

        password = generate_random_password()
        hashed_password = generate_password_hash(password)

        date_naissance = data.get('date_naissance')
        if date_naissance:
            try:
                date_naissance = datetime.strptime(date_naissance, '%Y-%m-%d').date()
            except Exception:
                return jsonify({'message': 'Format date_naissance invalide, attendu YYYY-MM-DD'}), 400
        else:
            date_naissance = None

        new_utilisateur = Utilisateur(
            nom=data['nom'],
            prenom=data['prenom'],
            email=email,
            password_hash=hashed_password,
            cin=cin,
            num_tel=data.get('num_tel'),
            photo=data.get('photo'),
            date_naissance=date_naissance,
            poste=data.get('poste'),
            role_id=data['role_id'],
            departement_id=data['departement_id'],
            grade_id=data['grade_id'],
            is_active=data.get('is_active', True)
        )

        db.session.add(new_utilisateur)
        db.session.commit()

        send_account_creation_email(to_email=email, user_email=email, password=password)

        return jsonify({
            'message': 'Utilisateur créé avec succès',
            'email': email,
            'mot_de_passe': password
        }), 201

    except KeyError as e:
        return jsonify({'error': f"Clé manquante : {str(e)}"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def get_all_utilisateurs():
    try:
        utilisateurs = Utilisateur.query.all()
        result = [
            {
                'id': u.id,
                'nom': u.nom,
                'prenom': u.prenom,
                'email': u.email,
                'cin': u.cin,
                'poste': u.poste,
                'is_active': u.is_active,
                'role_id': u.role_id,
                'departement_id': u.departement_id,
                'grade_id': u.grade_id
            }
            for u in utilisateurs
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_utilisateur_by_id(utilisateur_id):
    utilisateur = Utilisateur.query.get(utilisateur_id)
    if not utilisateur:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    return jsonify({
        'id': utilisateur.id,
        'nom': utilisateur.nom,
        'prenom': utilisateur.prenom,
        'email': utilisateur.email,
        'cin': utilisateur.cin,
        'poste': utilisateur.poste,
        'is_active': utilisateur.is_active,
        'role_id': utilisateur.role_id,
        'departement_id': utilisateur.departement_id,
        'grade_id': utilisateur.grade_id
    }), 200

def update_utilisateur(utilisateur_id, data):
    utilisateur = Utilisateur.query.get(utilisateur_id)
    if not utilisateur:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    old_email = utilisateur.email

    for key in ['nom', 'prenom', 'email', 'cin', 'num_tel', 'photo', 'poste', 'role_id', 'departement_id', 'grade_id', 'is_active']:
        if key in data:
            setattr(utilisateur, key, data[key])

    if 'date_naissance' in data:
        date_naissance = data['date_naissance']
        if date_naissance:
            try:
                utilisateur.date_naissance = datetime.strptime(date_naissance, '%Y-%m-%d').date()
            except Exception:
                return jsonify({'message': 'Format date_naissance invalide, attendu YYYY-MM-DD'}), 400
        else:
            utilisateur.date_naissance = None

    if utilisateur.email != old_email:
        if Utilisateur.query.filter(Utilisateur.email == utilisateur.email, Utilisateur.id != utilisateur_id).first():
            return jsonify({'message': 'Email déjà utilisé par un autre utilisateur'}), 409
        try:
            send_account_creation_email(utilisateur.email, utilisateur.email, "Mot de passe inconnu")
        except Exception:
            pass

    db.session.commit()
    return jsonify({'message': 'Utilisateur mis à jour avec succès'}), 200

def delete_utilisateur(utilisateur_id):
    utilisateur = Utilisateur.query.get(utilisateur_id)
    if not utilisateur:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    db.session.delete(utilisateur)
    db.session.commit()
    return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200
