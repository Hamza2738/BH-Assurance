// src/app/services/demande.service.ts
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ⇩ Option: centraliser l’URL API via environments
//   - Angular <17: import { environment } from 'src/environments/environment';
//   - Angular 17 standalone build: fournis l’URL via injection token si tu préfères
const API_BASE = (typeof (window as any) !== 'undefined' && (window as any).__API_URL__) || 'http://localhost:5000';

export interface Demande {
  id?: number;
  utilisateur_id: number;
  utilisateur_nom?: string;
  type_conge_id: number;
  type_conge_nom?: string;
  date_debut: string;         // "YYYY-MM-DD"
  date_fin: string;           // "YYYY-MM-DD"
  nb_jours?: number;
  statut_phase1?: 'en attente' | 'accepté' | 'rejeté';
  statut_final?: 'en attente' | 'accepté' | 'rejeté';
  statut?: 'en attente' | 'en attente super_admin' | 'accepté' | 'rejeté';
  motif?: string;
  date_demande?: string;      // ISO
  date_modification?: string; // ISO
  etat?: string;              // champ front optionnel
}

type Id = number;

@Injectable({ providedIn: 'root' })
export class DemandeService {
  // Tes routes: Blueprint prefixé sur /demandes
  private readonly baseUrl = `${API_BASE}/demandes`;

  constructor(private http: HttpClient) {}

  // -------------------- Utils front --------------------
  /** Calcule nb_jours côté front si besoin. Le back recalcule aussi. */
  static calculNbJours(date_debut: string, date_fin: string): number {
    const d1 = new Date(`${date_debut}T00:00:00`);
    const d2 = new Date(`${date_fin}T00:00:00`);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  }

  private handleError(err: any) {
    const msg = err?.error?.error || err?.message || 'Une erreur est survenue';
    return throwError(() => new Error(msg));
  }

  // -------------------- CRUD --------------------
  /** POST /demandes  (le body doit contenir utilisateur_id) */
  createDemande(demande: Demande): Observable<{
    message: string;
    demande: {
      id: number;
      utilisateur_id: number;
      type_conge_id: number;
      date_debut: string;
      date_fin: string;
      nb_jours: number;
      statut_phase1: string;
      statut_final: string;
      statut: string;
      motif?: string;
    };
  }> {
    // sécurité: si nb_jours n’est pas défini, on le calcule côté front (le back recalculera de toute façon)
    const payload = {
      ...demande,
      nb_jours:
        demande.nb_jours ??
        DemandeService.calculNbJours(demande.date_debut, demande.date_fin),
    };
    return this.http.post<any>(`${this.baseUrl}`, payload).pipe(catchError(this.handleError));
  }

  /** PUT /demandes/:id */
  updateDemande(id: Id, demande: Partial<Demande>): Observable<{ message: string; demande_id: number }> {
    const payload = { ...demande };
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(catchError(this.handleError));
  }

  /** DELETE /demandes/:id?utilisateur_id= */
  deleteDemande(id: Id, utilisateur_id: number): Observable<{ message: string }> {
    const params = new HttpParams().set('utilisateur_id', utilisateur_id.toString());
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { params }).pipe(catchError(this.handleError));
  }

  // -------------------- Statuts --------------------
  /**
   * PATCH /demandes/:id/statut/manager
   * Le service backend accepte 'accepter'/'rejeter' ET mappe aussi 'accepté'/'rejeté'.
   */
  changeStatutManager(
    id: Id,
    utilisateur_id: number,
    decision: 'accepter' | 'rejeter' | 'accepté' | 'rejeté'
  ): Observable<{
    message: string;
    demande_id: number;
    statut: string;
    statut_phase1: string;
    statut_final: string;
  }> {
    return this.http
      .patch<any>(`${this.baseUrl}/${id}/statut/manager`, { utilisateur_id, decision })
      .pipe(catchError(this.handleError));
  }

  /**
   * PATCH /demandes/:id/statut/superadmin
   * Le backend attend 'accepté' | 'rejeté'.
   */
  changeStatutSuperAdmin(
    id: Id,
    utilisateur_id: number,
    decision: 'accepté' | 'rejeté'
  ): Observable<{
    message: string;
    demande_id: number;
    statut: string;
    statut_phase1: string;
    statut_final: string;
  }> {
    return this.http
      .patch<any>(`${this.baseUrl}/${id}/statut/superadmin`, { utilisateur_id, decision })
      .pipe(catchError(this.handleError));
  }

  // -------------------- Récupération --------------------
  /** GET /demandes/all */
  getAllDemandes(): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.baseUrl}/all`).pipe(catchError(this.handleError));
  }

  /** GET /demandes/visibles/:user_id */
  getDemandesVisibles(user_id: number): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.baseUrl}/visibles/${user_id}`).pipe(catchError(this.handleError));
  }

  /** GET /demandes/derniere/:user_id */
  getDerniereDemande(user_id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.baseUrl}/derniere/${user_id}`).pipe(catchError(this.handleError));
  }

  // -------------------- Nettoyage --------------------
  /** POST /demandes/nettoyer-expirees */
  nettoyerDemandesExpirees(): Observable<{ message: string }> {
    return this.http.post<any>(`${this.baseUrl}/nettoyer-expirees`, {}).pipe(catchError(this.handleError));
  }
}
