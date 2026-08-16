// Définition des unités possibles pour les types de congé
export enum Unite {
  Jours = 'jours',
  Heures = 'heures'
}

// Définition des périodicités possibles pour les types de congé
export enum Periode {
  Annuelle = 'annuelle',
  Mensuelle = 'mensuelle'
}

// Interface représentant un type de congé
export interface TypeConge {
  id: number;          // Identifiant unique
  nom: string;         // Nom du type de congé (ex: "Congé payé")
  duree: number;       // Durée en unité spécifiée
  unite: Unite;        // Unité (jours ou heures)
  periode: Periode;    // Périodicité (annuelle ou mensuelle)
}
