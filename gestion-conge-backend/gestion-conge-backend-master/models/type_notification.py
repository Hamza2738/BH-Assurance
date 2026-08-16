# models/type_notification.py
from extension import db

class TypeNotification(db.Model):
    __tablename__ = 'TYPE_NOTIFICATION'

    ID_TYPE_NOTIFICATION = db.Column(db.Integer, primary_key=True)
    LIBELLE = db.Column(db.String(100), nullable=False, unique=True)

    def __repr__(self):
        return f"<TypeNotification {self.LIBELLE}>"
