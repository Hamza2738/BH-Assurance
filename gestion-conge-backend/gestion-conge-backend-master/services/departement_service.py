from models.departement import Departement
from models.utilisateur import Utilisateur
from extension import db

def create_departement(nom):
    if Departement.query.filter_by(nom=nom).first():
        return None, "Département existe."
    nouveau_departement = Departement(nom=nom)
    db.session.add(nouveau_departement)
    db.session.commit()
    return nouveau_departement, None

def get_all_departements():
    return Departement.query.all()

def get_departement_by_id(departement_id):
    return Departement.query.get(departement_id)

def update_departement(departement_id, nouveau_nom):
    departement = Departement.query.get(departement_id)
    if not departement:
        return None, "Département introuvable."
    if Departement.query.filter(Departement.nom == nouveau_nom, Departement.id != departement_id).first():
        return None, "Nom déjà utilisé."
    departement.nom = nouveau_nom
    db.session.commit()
    return departement, None

def delete_departement(departement_id):
    departement = Departement.query.get(departement_id)
    if not departement:
        return "Département introuvable."
    db.session.delete(departement)
    db.session.commit()
    return None

def get_employes_by_departement(departement_id):
    departement = Departement.query.get(departement_id)
    if not departement:
        return None, "Département introuvable."

    utilisateurs = departement.utilisateurs  # lazy='joined' -> liste directe
    employes_dicts = [
        {
            "id": u.id,
            "nom": u.nom,
            "prenom": u.prenom,
            "email": u.email,
            "poste": u.poste
        } for u in utilisateurs
    ]
    return employes_dicts, None
