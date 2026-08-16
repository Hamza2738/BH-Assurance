from extension import db

class Grade(db.Model):
    __tablename__ = 'grades'

    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(100), unique=True, nullable=False)
    pouvoir = db.Column(db.Integer, nullable=False, default=0)  

    utilisateurs = db.relationship('Utilisateur', back_populates='grade', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Grade {self.titre} - Pouvoir {self.pouvoir}>"
