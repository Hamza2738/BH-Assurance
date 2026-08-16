export interface Historique {
  id: number; // ID de la demande
  date_demande: string | null;
  type_conge: string | null;
  date_debut: string | null;
  date_fin: string | null;
  nombre_jours: number | null;
  statut: string | null;
  date_reponse: string | null;
  modifie_par: string | null;
}
