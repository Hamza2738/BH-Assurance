from models.utilisateur import Utilisateur
from extension import db

def change_password_service(user_id, current_password, new_password):
    user = Utilisateur.query.get(user_id)
    if not user:
        return False, "Utilisateur non trouvé"

    if not user.check_password(current_password):
        return False, "Mot de passe actuel incorrect"

    if len(new_password) < 6:
        return False, "Le nouveau mot de passe doit contenir au moins 6 caractères"

    user.set_password(new_password)
    db.session.commit()
    return True, "Mot de passe modifié avec succès"
