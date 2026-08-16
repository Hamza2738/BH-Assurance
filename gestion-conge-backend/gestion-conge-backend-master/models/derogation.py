# models/derogation.py
from extension import db
from datetime import datetime

class Derogation(db.Model):
    __tablename__ = 'DEROGATION'

    ID_DEROGATION = db.Column(db.Integer, primary_key=True)
    MOTIF = db.Column(db.String(255), nullable=True)
    DATE_CREATION = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Derogation {self.ID_DEROGATION}>"
