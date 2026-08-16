from extension import db
from datetime import datetime

class SoldeConge(db.Model):
    __tablename__ = 'soldes_conge'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    type_conge_id = db.Column(db.Integer, db.ForeignKey('types_conge.id'), nullable=False)
    annee = db.Column(db.Integer, nullable=False)
    solde = db.Column(db.Float, default=0.0)
    last_recharge = db.Column(db.DateTime, default=datetime.utcnow)

    utilisateur = db.relationship('Utilisateur', back_populates='soldes_conge')
    type_conge = db.relationship('TypeConge', back_populates='soldes')