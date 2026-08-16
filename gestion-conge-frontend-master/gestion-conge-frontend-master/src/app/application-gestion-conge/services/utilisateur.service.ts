import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Utilisateur } from '../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private utilisateurUrl = 'http://localhost:5000/utilisateurs/';
  private departementUrl = 'http://localhost:5000/departement/';
  private gradeUrl = 'http://localhost:5000/grade/';
  private roleUrl = 'http://localhost:5000/roles/';

  constructor(private http: HttpClient) {}

  createUtilisateur(user: Utilisateur): Observable<any> {
    return this.http.post(`${this.utilisateurUrl}`, user);
  }

  getAllUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.utilisateurUrl}`);
  }

  getUtilisateurById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.utilisateurUrl}${id}`);
  }

  updateUtilisateur(id: number, user: Utilisateur): Observable<any> {
    return this.http.put(`${this.utilisateurUrl}${id}`, user);
  }

  deleteUtilisateur(id: number): Observable<any> {
    return this.http.delete(`${this.utilisateurUrl}${id}`);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.roleUrl}`);
  }

  getDepartements(): Observable<any> {
    return this.http.get(`${this.departementUrl}all`);
  }

  getGrades(): Observable<any> {
    return this.http.get(`${this.gradeUrl}all`);
  }
}
