from extension import db

class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), unique=True, nullable=False)

    utilisateurs = db.relationship('Utilisateur', back_populates='role', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role {self.nom}>"