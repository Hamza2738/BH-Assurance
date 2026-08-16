import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Grade {
  id: number;
  titre: string;
  pouvoir: number;
}

@Injectable({ providedIn: 'root' })
export class GradeService {
  private baseUrl = 'http://localhost:5000/grade';  // Mets ici ton URL backend complète

  constructor(private http: HttpClient) {}

  createGrade(data: { titre: string; pouvoir: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

  getAllGrades(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.baseUrl}/all`);
  }

  getGradeById(id: number): Observable<Grade> {
    return this.http.get<Grade>(`${this.baseUrl}/${id}`);
  }

  updateGrade(id: number, data: { titre: string; pouvoir: number }): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, data);
  }

  deleteGrade(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }

  getUsersByGrade(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/${id}`);
  }

  filterUsersByPoste(id: number, poste: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/${id}/filter?poste=${poste}`);
  }
}
