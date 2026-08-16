import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SoldeConge } from '../models/solde-conge.model';

@Injectable({
  providedIn: 'root'
})
export class SoldeCongeService {
  private apiUrl = 'http://localhost:5000/soldes';

  constructor(private http: HttpClient) {}

  // 1️⃣ Création manuelle d'un solde
  createSolde(data: {
    utilisateur_id: number;
    type_conge_id: number;
    solde: number;
    annee?: number;
  }): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(`${this.apiUrl}/`, data);
  }

  // 2️⃣ Récupérer tous les soldes d’un utilisateur (tous types, années)
  getSoldesByUtilisateur(utilisateur_id: number): Observable<SoldeConge[]> {
    return this.http.get<SoldeConge[]>(`${this.apiUrl}/utilisateur/${utilisateur_id}`);
  }

  // 3️⃣ Récupérer un solde précis par utilisateur/type/année
  getSoldePrecise(utilisateur_id: number, type_conge_id: number, annee?: number): Observable<SoldeConge> {
    let params = annee ? new HttpParams().set('annee', annee.toString()) : new HttpParams();
    return this.http.get<SoldeConge>(`${this.apiUrl}/${utilisateur_id}/${type_conge_id}`, { params });
  }

  // 4️⃣ Mise à jour manuelle du solde
  updateSolde(solde_id: number, nouvelle_valeur: number): Observable<{ message: string; solde: number }> {
    return this.http.put<{ message: string; solde: number }>(`${this.apiUrl}/${solde_id}`, { solde: nouvelle_valeur });
  }

  // 5️⃣ Suppression d'un solde
  deleteSolde(solde_id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${solde_id}`);
  }

  // 6️⃣ Consommer (déduire) des jours après demande acceptée
  consommerConge(data: { utilisateur_id: number; type_conge_id: number; jours_pris: number }): Observable<{ message: string; solde_restant: number }> {
    return this.http.post<{ message: string; solde_restant: number }>(`${this.apiUrl}/consommer`, data);
  }

  // 7️⃣ Recharge périodique automatique (appel manuel ou tâche planifiée)
  rechargerSoldes(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/recharger`, {});
  }

  // 8️⃣ Création automatique des soldes lors de l’ajout d’un nouveau type de congé
  creerSoldesNouveauType(type_conge_id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/creer_soldes_nouveau_type/${type_conge_id}`, {});
  }
}
