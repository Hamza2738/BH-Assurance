import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { Utilisateur } from '../../../models/utilisateur.model';

@Component({
  selector: 'app-gestion-utilisateur',
  templateUrl: './gestion-utilisateur.component.html',
  styleUrls: ['./gestion-utilisateur.component.scss']
})
export class GestionUtilisateurComponent implements OnInit {
  employes: Utilisateur[] = [];
  selectedRoleId: number | 'all' = 'all'; // id role ou 'all' pour tous
  editEmploye: Utilisateur | null = null;

  roles: any[] = [];
  departements: any[] = [];
  grades: any[] = [];

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit(): void {
    // Charger roles, departements, grades
    this.utilisateurService.getRoles().subscribe(data => this.roles = data);
    this.utilisateurService.getDepartements().subscribe(data => this.departements = data);
    this.utilisateurService.getGrades().subscribe(data => this.grades = data);

    this.fetchEmployes();
  }

  fetchEmployes(): void {
    this.utilisateurService.getAllUtilisateurs().subscribe((data) => {
      if (this.selectedRoleId === 'all') {
        this.employes = data;
      } else {
        this.employes = data.filter(e => e.role_id === this.selectedRoleId);
      }
    });
  }

  onEdit(emp: Utilisateur): void {
    this.editEmploye = { ...emp };
  }

  cancelEdit(): void {
    this.editEmploye = null;
  }

  updateEmploye(): void {
    if (this.editEmploye) {
      this.utilisateurService.updateUtilisateur(this.editEmploye.id!, this.editEmploye).subscribe(() => {
        this.fetchEmployes();
        this.editEmploye = null;
      });
    }
  }

  onDelete(emp: Utilisateur): void {
    if (confirm(`Supprimer ${emp.nom} ${emp.prenom} ?`)) {
      this.utilisateurService.deleteUtilisateur(emp.id!).subscribe(() => {
        this.fetchEmployes();
      });
    }
  }

  toggleActivation(emp: Utilisateur): void {
    const updatedEmp = { ...emp, is_active: !emp.is_active };
    this.utilisateurService.updateUtilisateur(emp.id!, updatedEmp).subscribe(() => {
      this.fetchEmployes();
    });
  }

  getDepartementNom(departement_id: number): string {
    const dep = this.departements.find(d => d.id === departement_id);
    return dep ? dep.nom : '—';
  }

  getGradeTitre(grade_id: number): string {
    const grade = this.grades.find(g => g.id === grade_id);
    return grade ? grade.titre : '—';
  }

  getRoleNom(role_id: number): string {
    const role = this.roles.find(r => r.id === role_id);
    return role ? role.nom : '—';
  }
}
