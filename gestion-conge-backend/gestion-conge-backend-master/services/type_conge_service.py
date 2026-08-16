from flask import jsonify
from models.type_conge import TypeConge
from extension import db
from services.solde_conge_service import creer_soldes_pour_nouveau_type


VALID_PERIODES = {'annuelle', 'mensuelle', 'hebdomadaire', 'non_rechargeable'}


def create_type_conge_service(data):
    # Validation des champs obligatoires
    if not all(k in data for k in ('nom', 'unite', 'periode', 'duree')):
        return jsonify({"error": "Nom, unité, période et durée sont obligatoires"}), 400

    nom = data['nom'].strip()
    unite = data['unite'].strip()
    periode = data['periode'].lower().strip()

    if periode not in VALID_PERIODES:
        return jsonify({"error": f"Période invalide. Valeurs possibles : {', '.join(VALID_PERIODES)}"}), 400

    try:
        duree = float(data['duree'])
    except ValueError:
        return jsonify({"error": "Durée doit être un nombre valide"}), 400

    # Vérifier doublon par nom
    if TypeConge.query.filter_by(nom=nom).first():
        return jsonify({"error": "Type de congé déjà existant"}), 409

    try:
        # Création du type de congé
        type_conge = TypeConge(
            nom=nom,
            unite=unite,
            periode=periode,
            duree=duree
        )
        db.session.add(type_conge)
        db.session.commit()

        # Création automatique des soldes pour tous les utilisateurs
        success, error = creer_soldes_pour_nouveau_type(type_conge)
        if not success:
            return jsonify({"error": "Type créé mais erreur lors de la création des soldes : " + error}), 500

        return jsonify(type_conge.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def get_all_types_conge_service():
    types = TypeConge.query.all()
    return jsonify([t.to_dict() for t in types]), 200


def get_type_conge_by_id_service(type_id):
    t = TypeConge.query.get(type_id)
    if not t:
        return jsonify({"error": "Type de congé introuvable"}), 404
    return jsonify(t.to_dict()), 200


def update_type_conge_service(type_id, data):
    t = TypeConge.query.get(type_id)
    if not t:
        return jsonify({"error": "Type de congé introuvable"}), 404

    try:
        new_nom = data.get('nom', t.nom).strip()
        # Vérifier doublon si nom changé
        if new_nom != t.nom and TypeConge.query.filter(TypeConge.nom == new_nom, TypeConge.id != t.id).first():
            return jsonify({"error": "Un autre type de congé a déjà ce nom"}), 409
        t.nom = new_nom

        t.unite = data.get('unite', t.unite).strip()

        periode = data.get('periode', t.periode).lower().strip()
        if periode not in VALID_PERIODES:
            return jsonify({"error": f"Période invalide. Valeurs possibles : {', '.join(VALID_PERIODES)}"}), 400
        t.periode = periode

        try:
            t.duree = float(data.get('duree', t.duree))
        except ValueError:
            return jsonify({"error": "Durée invalide"}), 400

        db.session.commit()
        return jsonify(t.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def delete_type_conge_service(type_id):
    t = TypeConge.query.get(type_id)
    if not t:
        return jsonify({"error": "Type de congé introuvable"}), 404

    # Vérifier s'il y a des demandes ou soldes liés
    from models.demande import Demande
    from models.solde_conge import SoldeConge

    demandes_existantes = Demande.query.filter_by(type_conge_id=type_id).first()
    soldes_existants = SoldeConge.query.filter_by(type_conge_id=type_id).first()

    if demandes_existantes or soldes_existants:
        return jsonify({"error": "Impossible de supprimer ce type : des demandes ou soldes y sont associés"}), 400

    try:
        db.session.delete(t)
        db.session.commit()
        return jsonify({"message": "Type de congé supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
