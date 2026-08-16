from models.historique import Historique
from models.demande import Demande
from models.utilisateur import Utilisateur
from extension import db
from datetime import datetime
from sqlalchemy.orm import joinedload

def create_historique(demande_id, utilisateur_id, ancien_statut, nouveau_statut):
    demande = Demande.query.get(demande_id)
    if not demande:
        return None, "Demande introuvable."

    utilisateur = Utilisateur.query.get(utilisateur_id)
    if not utilisateur:
        return None, "Utilisateur introuvable."

    historique = Historique(
        demande_id=demande_id,
        utilisateur_id=utilisateur_id,
        ancien_statut=ancien_statut,
        nouveau_statut=nouveau_statut,
        date_changement=datetime.utcnow()
    )

    db.session.add(historique)
    db.session.commit()
    return historique, None


def get_historiques_by_user(utilisateur_id, page=1, per_page=10):
    query = Historique.query.options(
        joinedload(Historique.demande).joinedload(Demande.type_conge),
        joinedload(Historique.utilisateur)
    ).join(Demande).filter(Demande.utilisateur_id == utilisateur_id).order_by(Historique.date_changement.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return pagination



def get_historique_by_id(historique_id):
    return Historique.query.get(historique_id)


def update_historique(historique_id, ancien_statut=None, nouveau_statut=None):
    historique = Historique.query.get(historique_id)
    if not historique:
        return None, "Historique introuvable."

    if ancien_statut is not None:
        historique.ancien_statut = ancien_statut
    if nouveau_statut is not None:
        historique.nouveau_statut = nouveau_statut

    historique.date_changement = datetime.utcnow()
    db.session.commit()

    return historique, None


def delete_historique(historique_id):
    historique = Historique.query.get(historique_id)
    if not historique:
        return "Historique introuvable."

    db.session.delete(historique)
    db.session.commit()
    return None
