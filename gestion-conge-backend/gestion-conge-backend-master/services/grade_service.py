from extension import db
from models.grade import Grade
from models.utilisateur import Utilisateur
from flask import jsonify

def create_grade(data):
    try:
        titre = data.get('titre')
        pouvoir = data.get('pouvoir', 0)
        if not titre:
            return jsonify({'error': 'Le titre est obligatoire'}), 400

        existing = Grade.query.filter_by(titre=titre).first()
        if existing:
            return jsonify({'error': 'Ce titre de grade existe déjà'}), 409

        grade = Grade(titre=titre, pouvoir=pouvoir)
        db.session.add(grade)
        db.session.commit()

        return jsonify({
            'message': 'Grade créé avec succès',
            'grade': {'id': grade.id, 'titre': grade.titre, 'pouvoir': grade.pouvoir}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la création : {str(e)}'}), 500


def get_all_grades():
    try:
        grades = Grade.query.all()
        result = [{'id': g.id, 'titre': g.titre, 'pouvoir': g.pouvoir} for g in grades]
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération : {str(e)}'}), 500


def get_grade_by_id(grade_id):
    try:
        grade = Grade.query.get(grade_id)
        if not grade:
            return jsonify({'error': 'Grade non trouvé'}), 404

        return jsonify({'id': grade.id, 'titre': grade.titre, 'pouvoir': grade.pouvoir}), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération : {str(e)}'}), 500


def update_grade(grade_id, data):
    try:
        grade = Grade.query.get(grade_id)
        if not grade:
            return jsonify({'error': 'Grade non trouvé'}), 404

        titre = data.get('titre')
        pouvoir = data.get('pouvoir')
        if titre:
            existing = Grade.query.filter(Grade.titre == titre, Grade.id != grade_id).first()
            if existing:
                return jsonify({'error': 'Ce titre de grade existe déjà'}), 409
            grade.titre = titre
        if pouvoir is not None:
            grade.pouvoir = pouvoir

        db.session.commit()
        return jsonify({
            'message': 'Grade mis à jour avec succès',
            'grade': {'id': grade.id, 'titre': grade.titre, 'pouvoir': grade.pouvoir}
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la mise à jour : {str(e)}'}), 500


def delete_grade(grade_id):
    try:
        grade = Grade.query.get(grade_id)
        if not grade:
            return jsonify({'error': 'Grade non trouvé'}), 404

        db.session.delete(grade)
        db.session.commit()
        return jsonify({'message': 'Grade supprimé avec succès'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la suppression : {str(e)}'}), 500


def get_users_by_grade(grade_id):
    try:
        grade = Grade.query.get(grade_id)
        if not grade:
            return jsonify({'error': 'Grade non trouvé'}), 404

        users = grade.utilisateurs  # Assure-toi que la relation existe dans ton modèle Grade
        result = [{
            'id': user.id,
            'nom': user.nom,
            'prenom': user.prenom,
            'email': user.email,
            'poste': user.poste,
            'is_active': user.is_active,
        } for user in users]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des utilisateurs : {str(e)}'}), 500


def filter_users_by_grade_and_poste(grade_id, poste):
    try:
        grade = Grade.query.get(grade_id)
        if not grade:
            return jsonify({'error': 'Grade non trouvé'}), 404

        users = Utilisateur.query.filter_by(grade_id=grade_id, poste=poste).all()
        result = [{
            'id': u.id,
            'nom': u.nom,
            'prenom': u.prenom,
            'email': u.email,
            'poste': u.poste,
            'is_active': u.is_active,
        } for u in users]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors du filtrage : {str(e)}'}), 500
