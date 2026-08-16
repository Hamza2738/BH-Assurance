export interface Utilisateur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  cin: string;
  num_tel?: string;
  photo?: string;
  date_naissance?: string;
  poste?: string;
  role: string;           // utilisé pour le filtrage
  role_id: number;
  departement_id: number;
  grade_id: number;
  is_active?: boolean;
}
