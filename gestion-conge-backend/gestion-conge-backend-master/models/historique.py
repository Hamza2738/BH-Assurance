from extension import db
from datetime import datetime

class Historique(db.Model):
    __tablename__ = 'historiques'

    id = db.Column(db.Integer, primary_key=True)
    demande_id = db.Column(db.Integer, db.ForeignKey('demandes.id'), nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    ancien_statut = db.Column(db.String(50), nullable=False)
    nouveau_statut = db.Column(db.String(50), nullable=False)
    date_changement = db.Column(db.DateTime, default=datetime.utcnow)

    utilisateur = db.relationship('Utilisateur', back_populates='historiques')
    demande = db.relationship('Demande', back_populates='historiques')