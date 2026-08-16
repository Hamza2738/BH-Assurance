from datetime import datetime
from extension import db
from sqlalchemy import event

class Demande(db.Model):
    __tablename__ = 'demandes'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    type_conge_id = db.Column(db.Integer, db.ForeignKey('types_conge.id'), nullable=False)

    date_debut = db.Column(db.Date, nullable=False)
    date_fin = db.Column(db.Date, nullable=False)
    nb_jours = db.Column(db.Float, nullable=False)

    # Étape 1 : validation par responsables du même département (grade supérieur)
    statut_phase1 = db.Column(db.String(50), default='en attente')

    # Étape 2 : validation finale par super admin
    statut_final = db.Column(db.String(50), default='en attente')

    # Vue d’ensemble (utile pour affichage global)
    statut = db.Column(db.String(50), default='en attente')

    date_demande = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime)
    motif = db.Column(db.String(255))

    utilisateur = db.relationship('Utilisateur', back_populates='demandes')
    type_conge = db.relationship('TypeConge', back_populates='demandes')
    historiques = db.relationship('Historique', back_populates='demande', cascade='all, delete-orphan')

    _old_statut = None
    _old_statut_phase1 = None
    _old_statut_final = None


# Stocker anciens statuts lors du chargement
@event.listens_for(Demande, 'load')
def store_old_statuts(demande, _):
    demande._old_statut = demande.statut
    demande._old_statut_phase1 = demande.statut_phase1
    demande._old_statut_final = demande.statut_final


# Historiser les changements de statuts
#@event.listens_for(Demande, 'after_update')
#def create_historique(mapper, connection, demande):
#    now = datetime.utcnow()

#    # Changement global
#    if demande._old_statut and demande._old_statut != demande.statut:
#        stmt = insert(Historique).values(
#            demande_id=demande.id,
#            utilisateur_id=demande.utilisateur_id,
#            ancien_statut=demande._old_statut,
#            nouveau_statut=demande.statut,
#            date_changement=now
#        )
#        connection.execute(stmt)
#        demande._old_statut = demande.statut

    # Changement phase 1
#    if demande._old_statut_phase1 and demande._old_statut_phase1 != demande.statut_phase1:
#        stmt = insert(Historique).values(
#            demande_id=demande.id,
#            utilisateur_id=demande.utilisateur_id,
#            ancien_statut=demande._old_statut_phase1,
#            nouveau_statut=demande.statut_phase1,
#            date_changement=now
#        )
#        connection.execute(stmt)
#        demande._old_statut_phase1 = demande.statut_phase1

    # Changement phase finale
#    if demande._old_statut_final and demande._old_statut_final != demande.statut_final:
#        stmt = insert(Historique).values(
#            demande_id=demande.id,
#            utilisateur_id=demande.utilisateur_id,
#            ancien_statut=demande._old_statut_final,
#            nouveau_statut=demande.statut_final,
#            date_changement=now
#        )
#        connection.execute(stmt)
#        demande._old_statut_final = demande.statut_final


# Conversion en dict (pour API/JSON)
def to_dict(self):
    return {
        'id': self.id,
        'utilisateur_id': self.utilisateur_id,
        'type_conge_id': self.type_conge_id,
        'date_debut': self.date_debut.isoformat() if self.date_debut else None,
        'date_fin': self.date_fin.isoformat() if self.date_fin else None,
        'nb_jours': self.nb_jours,
        'statut_phase1': self.statut_phase1,
        'statut_final': self.statut_final,
        'statut': self.statut,
        'motif': self.motif,
        'date_demande': self.date_demande.isoformat() if self.date_demande else None,
        'date_modification': self.date_modification.isoformat() if self.date_modification else None,
        'utilisateur_nom': self.utilisateur.nom if self.utilisateur else None,
        'type_conge_nom': self.type_conge.nom if self.type_conge else None,
    }
