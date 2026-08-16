from datetime import datetime
from extension import db
from werkzeug.security import generate_password_hash, check_password_hash

class Utilisateur(db.Model):
    __tablename__ = 'utilisateurs'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)

    cin = db.Column(db.String(20), unique=True, nullable=False)
    num_tel = db.Column(db.String(20))
    photo = db.Column(db.Text)
    date_naissance = db.Column(db.Date)
    poste = db.Column(db.String(100))
    date_ajout = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    departement_id = db.Column(db.Integer, db.ForeignKey('departements.id'), nullable=False)
    grade_id = db.Column(db.Integer, db.ForeignKey('grades.id'), nullable=False)

    role = db.relationship('Role', back_populates='utilisateurs')
    departement = db.relationship('Departement', back_populates='utilisateurs')
    grade = db.relationship('Grade', back_populates='utilisateurs')

    demandes = db.relationship('Demande', back_populates='utilisateur', cascade="all, delete-orphan")
    historiques = db.relationship('Historique', back_populates='utilisateur', cascade="all, delete-orphan")
    soldes_conge = db.relationship('SoldeConge', back_populates='utilisateur', cascade="all, delete-orphan")

    # ✅ Relations explicites pour éviter l'ambiguïté avec Notification
    notifications_envoyees = db.relationship(
        'Notification',
        foreign_keys='Notification.UTILISATEUR_EXPEDITEUR_ID',
        back_populates='expediteur',
        lazy='dynamic'
    )
    notifications_recues = db.relationship(
        'Notification',
        foreign_keys='Notification.UTILISATEUR_DESTINATAIRE_ID',
        back_populates='destinataire',
        lazy='dynamic'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<Utilisateur {self.nom} {self.prenom}>"
