from flask import Blueprint, jsonify, request
from services.historique_service import (
    create_historique,
    get_historiques_by_user,
    get_historique_by_id,
    update_historique,
    delete_historique
)

historique_bp = Blueprint('historique_bp', __name__, url_prefix='/historiques')

# GET liste paginée historique utilisateur avec détails complets
@historique_bp.route('/user/<int:utilisateur_id>', methods=['GET'])
def historiques_par_utilisateur(utilisateur_id):
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)
    pagination = get_historiques_by_user(utilisateur_id, page, per_page)

    data = []
    for h in pagination.items:
        demande = h.demande
        type_conge = demande.type_conge if demande else None
        utilisateur_modif = h.utilisateur

        data.append({
            'id': demande.id if demande else None,
            'date_demande': demande.date_demande.isoformat() if demande and demande.date_demande else None,
            'type_conge': type_conge.nom if type_conge else None,
            'date_debut': demande.date_debut.isoformat() if demande and demande.date_debut else None,
            'date_fin': demande.date_fin.isoformat() if demande and demande.date_fin else None,
            'nombre_jours': demande.nb_jours if demande else None,
            'statut': h.nouveau_statut if h.nouveau_statut else h.ancien_statut,
            'date_reponse': h.date_changement.isoformat() if h.date_changement else None,
            'modifie_par': f"{utilisateur_modif.prenom} {utilisateur_modif.nom}" if utilisateur_modif else None
        })

    return jsonify({
        'items': data,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'pages': pagination.pages
    }), 200


# GET historique par ID simple
@historique_bp.route('/<int:historique_id>', methods=['GET'])
def get_historique(historique_id):
    historique = get_historique_by_id(historique_id)
    if not historique:
        return jsonify({'error': 'Historique non trouvé'}), 404
    return jsonify({
        'id': historique.id,
        'demande_id': historique.demande_id,
        'utilisateur_id': historique.utilisateur_id,
        'ancien_statut': historique.ancien_statut,
        'nouveau_statut': historique.nouveau_statut,
        'date_changement': historique.date_changement.isoformat()
    })


# PUT mise à jour d'un historique
@historique_bp.route('/<int:historique_id>', methods=['PUT'])
def update(historique_id):
    data = request.get_json()
    ancien_statut = data.get('ancien_statut')
    nouveau_statut = data.get('nouveau_statut')
    historique, error = update_historique(historique_id, ancien_statut, nouveau_statut)
    if error:
        return jsonify({'error': error}), 400
    return jsonify({'message': 'Historique mis à jour', 'id': historique.id})


# DELETE suppression d'un historique
@historique_bp.route('/<int:historique_id>', methods=['DELETE'])
def delete(historique_id):
    error = delete_historique(historique_id)
    if error:
        return jsonify({'error': error}), 404
    return jsonify({'message': 'Historique supprimé'}), 200
