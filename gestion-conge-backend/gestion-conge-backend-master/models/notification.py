# models/notification.py
from datetime import datetime
from extension import db

class Notification(db.Model):
    __tablename__ = 'NOTIFICATION'
    __table_args__ = (
        db.Index('ix_notification_dest_lu', 'ID_UTILISATEUR_DESTINATAIRE', 'EST_LU'),
        db.Index('ix_notification_sender', 'ID_UTILISATEUR_EXPEDITEUR'),
        db.Index('ix_notification_date', 'DATE_ENVOI'),
    )

    ID_NOTIFICATION = db.Column(db.Integer, primary_key=True)
    TITRE = db.Column(db.String(200), nullable=False)
    TEXTE = db.Column(db.String(500), nullable=False)
    EST_LU = db.Column(db.Boolean, default=False, nullable=False)
    DATE_ENVOI = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Champs legacy (string)
    ID_UTILISATEUR_EXPEDITEUR = db.Column(db.String(255), nullable=False)
    ID_UTILISATEUR_DESTINATAIRE = db.Column(db.String(255), nullable=False)
    USERNAME_EXPEDITEUR = db.Column(db.String(255), nullable=False)
    USERNAME_DESTINATAIRE = db.Column(db.String(255), nullable=False)

    # Nouvelles FKs vers utilisateurs.id
    UTILISATEUR_EXPEDITEUR_ID = db.Column(
        db.Integer,
        db.ForeignKey('utilisateurs.id'),
        nullable=True,
        index=True
    )
    UTILISATEUR_DESTINATAIRE_ID = db.Column(
        db.Integer,
        db.ForeignKey('utilisateurs.id'),
        nullable=True,
        index=True
    )

    # ⚠️ Utiliser UNIQUEMENT back_populates ici (pas de backref)
    expediteur = db.relationship(
        'Utilisateur',
        foreign_keys=[UTILISATEUR_EXPEDITEUR_ID],
        back_populates='notifications_envoyees',
    )
    destinataire = db.relationship(
        'Utilisateur',
        foreign_keys=[UTILISATEUR_DESTINATAIRE_ID],
        back_populates='notifications_recues',
    )

    # FKs vers TYPE_NOTIFICATION et DEROGATION
    ID_TYPE_NOTIFICATION = db.Column(
        db.Integer,
        db.ForeignKey('TYPE_NOTIFICATION.ID_TYPE_NOTIFICATION'),
        nullable=False
    )
    ID_DEROGATION = db.Column(
        db.Integer,
        db.ForeignKey('DEROGATION.ID_DEROGATION'),
        nullable=True
    )

    # Ici tu peux garder un backref générique (pas en conflit avec Utilisateur)
    type_notification = db.relationship('TypeNotification', backref=db.backref('notifications', lazy=True))
    derogation = db.relationship('Derogation', backref=db.backref('notifications', lazy=True))

    def to_dict(self):
        return {
            'ID_NOTIFICATION': self.ID_NOTIFICATION,
            'TITRE': self.TITRE,
            'TEXTE': self.TEXTE,
            'EST_LU': self.EST_LU,
            'DATE_ENVOI': self.DATE_ENVOI.isoformat() if self.DATE_ENVOI else None,

            'ID_UTILISATEUR_EXPEDITEUR': self.ID_UTILISATEUR_EXPEDITEUR,
            'ID_UTILISATEUR_DESTINATAIRE': self.ID_UTILISATEUR_DESTINATAIRE,
            'USERNAME_EXPEDITEUR': self.USERNAME_EXPEDITEUR,
            'USERNAME_DESTINATAIRE': self.USERNAME_DESTINATAIRE,

            'UTILISATEUR_EXPEDITEUR_ID': self.UTILISATEUR_EXPEDITEUR_ID,
            'UTILISATEUR_DESTINATAIRE_ID': self.UTILISATEUR_DESTINATAIRE_ID,

            'ID_TYPE_NOTIFICATION': self.ID_TYPE_NOTIFICATION,
            'ID_DEROGATION': self.ID_DEROGATION,
        }
