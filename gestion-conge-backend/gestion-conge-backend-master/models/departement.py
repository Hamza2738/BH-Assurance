from extension import db

class Departement(db.Model):
    __tablename__ = 'departements'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False, unique=True)

    utilisateurs = db.relationship('Utilisateur', back_populates='departement', cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "nom": self.nom}