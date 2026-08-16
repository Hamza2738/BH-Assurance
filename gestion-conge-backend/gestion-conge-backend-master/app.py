# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_session import Session
from extension import db, mail, jwt
from socketio_instance import socketio  # <-- instance unique, init ici

# --- Modèles de base nécessaires AVANT create_all()
from models.departement import Departement
from models.utilisateur import Utilisateur
from models.grade import Grade
from models.role import Role

# --- Modèles référencés par FK (importés AVANT create_all)
from models.notification import Notification
from models.type_notification import TypeNotification
from models.derogation import Derogation
from models.demande import Demande
from models.historique import Historique
from models.solde_conge import SoldeConge
from models.type_conge import TypeConge

# --- Blueprints
from routes.departement_routes import departement_bp
from routes.demande_routes import demande_bp
from routes.historique_routes import historique_bp
from routes.auth_routes import auth_bp
from routes.utilisateur_routes import utilisateur_bp
from routes.grade_routes import grade_bp
from routes.role_routes import role_bp
from routes.solde_conge_route import solde_conge_bp
from routes.type_conge_routes import type_conge_bp
from routes.notification_routes import notification_bp

from flask_socketio import join_room, leave_room, emit


# -------------------- Initialisations par défaut --------------------
def init_default_departement():
    if not Departement.query.get(1):
        dept = Departement(id=1, nom="Département par défaut")
        db.session.add(dept)
        db.session.commit()


def init_default_grade():
    if not Grade.query.get(1):
        grade = Grade(id=1, titre="Grade par défaut", pouvoir=0)
        db.session.add(grade)
        db.session.commit()

def init_type_notifications():
    labels = ["Info", "Demande - création", "Décision manager", "Décision finale"]
    for label in labels:
        if not TypeNotification.query.filter_by(LIBELLE=label).first():
            db.session.add(TypeNotification(LIBELLE=label))
    db.session.commit()

def init_roles():
    roles = ["super_admin", "admin", "user", "manager"]
    for role_name in roles:
        if not Role.query.filter_by(nom=role_name).first():
            db.session.add(Role(nom=role_name))
    db.session.commit()


def init_super_admin():
    role_sa = Role.query.filter_by(nom="super_admin").first()
    grade_default = Grade.query.get(1)
    departement_default = Departement.query.get(1)

    if not Utilisateur.query.filter_by(email="admin@admin.com").first():
        sa = Utilisateur(
            nom="Super",
            prenom="Admin",
            email="admin@admin.com",
            cin="00000000",
            num_tel="SA001",
            grade_id=grade_default.id,
            departement_id=departement_default.id,
            role_id=role_sa.id,
            is_active=True,
        )
        sa.set_password("admin")
        db.session.add(sa)
        db.session.commit()


# -------------------- Création de l'application --------------------
def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    app.config.setdefault('SECRET_KEY', 'votre_cle_secrete')
    app.config.setdefault('SESSION_TYPE', 'filesystem')

    # Extensions
    db.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)
    Session(app)

    # CORS (avec cookies/session si besoin)
    CORS(app, supports_credentials=True)

    # Socket.IO: initialiser l'instance unique importée
    socketio.init_app(app, cors_allowed_origins="*")

    # DB & données par défaut
    with app.app_context():
        # Tous les modèles sont importés plus haut AVANT cet appel
        db.create_all()
        init_type_notifications()
        init_default_departement()
        init_default_grade()
        init_roles()
        init_super_admin()

    # Blueprints
    app.register_blueprint(departement_bp)
    app.register_blueprint(demande_bp)
    app.register_blueprint(historique_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(utilisateur_bp)
    app.register_blueprint(grade_bp)
    app.register_blueprint(role_bp)
    app.register_blueprint(solde_conge_bp)
    app.register_blueprint(type_conge_bp)
    app.register_blueprint(notification_bp)

    # -------------------- Error handlers --------------------
    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({'error': 'Ressource non trouvée'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Erreur interne du serveur'}), 500

    @app.route('/')
    def index():
        return "Bienvenue dans l'application de gestion de congés !"

    # -------------------- Socket.IO Events --------------------
    # NB: l'event 'join' de base est déjà géré dans socketio_instance.py (room = id_utilisateur)
    @socketio.on('join_roles')
    def on_join_roles(data):
        if not isinstance(data, dict):
            return

        user_id = str(data.get("id_utilisateur")).strip() if data.get("id_utilisateur") is not None else None
        role = (data.get("role") or "").strip()
        departement_id = data.get("departement_id")

        if user_id:
            join_room(user_id)

        role_to_room = {
            "manager": "manager",
            "super_admin": "super_admin",
            "admin": "admin",
            "user": "user",
        }
        room = role_to_room.get(role, "user")
        join_room(room)

        if role == "manager" and departement_id is not None:
            join_room(f"manager_dept_{departement_id}")

        print(
            f"[Socket.IO] User={user_id} joined role room(s): {room}"
            f"{' + manager_dept_' + str(departement_id) if role == 'manager' and departement_id is not None else ''}"
        )

    @socketio.on('leave')
    def on_leave(data):
        if not isinstance(data, dict):
            return
        room = data.get("room")
        if room:
            leave_room(str(room))
            print(f"[Socket.IO] User left room {room}")

    @socketio.on('send_notification')
    def handle_send_notification(data):
        if not isinstance(data, dict):
            return
        channel = str(data.get("channel") or "notification")
        message = str(data.get("message") or "")
        emit(channel, {"message": message}, broadcast=True)
        print(f"[Socket.IO] Broadcast on '{channel}': {message}")

    return app


# -------------------- Runner --------------------
if __name__ == '__main__':
    app = create_app()
    # debug=True à adapter en prod (False + serveur adapté)
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
