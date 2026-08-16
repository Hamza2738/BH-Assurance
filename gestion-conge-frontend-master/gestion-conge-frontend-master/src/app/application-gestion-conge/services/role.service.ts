import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class RoleService {
  private baseUrl = 'http://localhost:5000/roles';

  constructor(private http: HttpClient) {}

  createRole(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, data);  // data = { nom: string }
  }

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateRole(id: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/update/${id}`, data);  // data = { nom: string }
  }

  deleteRole(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/delete/${id}`, {});
  }

  getUsersByRole(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/users`);
  }
}
