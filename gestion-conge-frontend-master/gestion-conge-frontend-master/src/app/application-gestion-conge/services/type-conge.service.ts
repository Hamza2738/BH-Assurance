import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeConge } from '../models/type-conge.model';

@Injectable({
  providedIn: 'root'
})
export class TypeCongeService {
  private apiUrl = 'http://localhost:5000/api/types-conge/';

  constructor(private http: HttpClient) {}

  getAllTypesConge(): Observable<TypeConge[]> {
    return this.http.get<TypeConge[]>(this.apiUrl);
  }

  getTypeCongeById(id: number): Observable<TypeConge> {
    return this.http.get<TypeConge>(`${this.apiUrl}/${id}`);
  }

  createTypeConge(data: Partial<TypeConge>): Observable<TypeConge> {
    return this.http.post<TypeConge>(this.apiUrl, data);
  }

  updateTypeConge(id: number, data: Partial<TypeConge>): Observable<TypeConge> {
    return this.http.put<TypeConge>(`${this.apiUrl}/${id}`, data);
  }

  deleteTypeConge(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
