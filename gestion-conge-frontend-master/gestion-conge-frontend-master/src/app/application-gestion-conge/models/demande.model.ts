export interface Demande {
  id?: number;
  utilisateur_id: number;
  utilisateur_nom?: string;          // "Nom Prénom" concaténé côté backend
  type_conge_id: number;
  type_conge_nom?: string;
  date_debut: string;                // format ISO yyyy-mm-dd
  date_fin: string;                  // format ISO yyyy-mm-dd
  nb_jours?: number;
  
  // Statuts pour double validation
  statut_phase1?: string;            // Phase 1: validation par supérieurs hiérarchiques
  statut_final?: string;             // Phase finale: validation par super admin
  statut?: string;                   // Vue d'ensemble / affichage global
  
  motif?: string;
  phase?: number;
  date_demande?: string;             // format ISO yyyy-mm-dd HH:mm:ss
  date_modification?: string;        // format ISO yyyy-mm-dd HH:mm:ss
}
