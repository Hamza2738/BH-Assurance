import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Historique } from '../models/historique.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {
  private apiUrl = 'http://localhost:5000/historiques';

  constructor(private http: HttpClient) {}

  getHistoriqueByUser(utilisateurId: number, page: number = 1, perPage: number = 10): Observable<{
    items: Historique[];
    page: number;
    per_page: number;
    total: number;
    pages: number;
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    return this.http.get<{
      items: Historique[];
      page: number;
      per_page: number;
      total: number;
      pages: number;
    }>(`${this.apiUrl}/user/${utilisateurId}`, { params });
  }
}
