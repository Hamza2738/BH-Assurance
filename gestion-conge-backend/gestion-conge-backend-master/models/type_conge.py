# models/type_conge.py
from extension import db

class TypeConge(db.Model):
    __tablename__ = 'types_conge'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), unique=True, nullable=False)
    unite = db.Column(db.String(10), nullable=False)  # jours, heures...
    periode = db.Column(db.String(50), nullable=False)  # mensuel, annuel...
    duree = db.Column(db.Float, nullable=False, default=0.0)

    soldes = db.relationship('SoldeConge', back_populates='type_conge', cascade="all, delete-orphan")
    demandes = db.relationship('Demande', back_populates='type_conge', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "unite": self.unite,
            "periode": self.periode,
            "duree": self.duree
        }
