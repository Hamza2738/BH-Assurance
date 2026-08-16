import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Departement {
  id: number;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class DepartementService {
  private apiUrl = 'http://localhost:5000/departement';

  constructor(private http: HttpClient) {}

  getDepartements(): Observable<Departement[]> {
  return this.http.get<Departement[]>(`${this.apiUrl}/all`);
}

addDepartement(nom: string): Observable<Departement> {
  return this.http.post<Departement>(`${this.apiUrl}/create`, { nom });
}

updateDepartement(id: number, nom: string): Observable<Departement> {
  return this.http.put<Departement>(`${this.apiUrl}/${id}/update`, { nom });
}



deleteDepartement(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}/delete`);
}

getEmployesByDepartement(deptId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${deptId}/employes`);
}

}