// 📁 gestion-departement.component.ts
import { Component, OnInit } from '@angular/core';
import { DepartementService, Departement } from '../../../services/departement.service';

@Component({
  selector: 'app-gestion-departement',
  templateUrl: './gestion-departement.component.html',
  styleUrls: ['./gestion-departement.component.scss']
})
export class GestionDepartementComponent implements OnInit {
  departements: Departement[] = [];

  editId: number | null = null;
  editNom: string = '';

  selectedEmployes: any[] = [];
  selectedDepartementNom: string = '';

  constructor(private departementService: DepartementService) {}

  ngOnInit(): void {
    this.loadDepartements();
  }

  loadDepartements() {
    this.departementService.getDepartements().subscribe({
      next: (data) => this.departements = data,
      error: (err) => console.error('Erreur chargement départements', err)
    });
  }

  onAdd(nom: string) {
    if (!nom.trim()) return;
    this.departementService.addDepartement(nom).subscribe({
      next: () => this.loadDepartements(),
      error: (err) => {
        if (err.status === 409) {
          alert('Ce département existe déjà.');
        } else {
          console.error('Erreur ajout', err);
        }
      }
    });
  }

  onDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) return;
    this.departementService.deleteDepartement(id).subscribe({
      next: () => this.loadDepartements(),
      error: (err) => console.error('Erreur suppression', err)
    });
  }

  onEdit(dept: Departement) {
    this.editId = dept.id;
    this.editNom = dept.nom;
  }

  onCancelEdit() {
    this.editId = null;
    this.editNom = '';
  }

  onUpdate(id: number) {
    console.log('Nom envoyé au backend:', this.editNom); // Ajout pour debug
    this.departementService.updateDepartement(id, this.editNom).subscribe({
      next: () => {
        // Mise à jour locale du nom avant rechargement
        const dept = this.departements.find(d => d.id === id);
        if (dept) {
          dept.nom = this.editNom;
        }
        this.onCancelEdit();
        this.loadDepartements();
      },
      error: (err) => {
        if (err.status === 409) {
          alert('Ce nom de département existe déjà.');
        } else {
          console.error('Erreur modification', err);
        }
      }
    });
  }

  onViewEmployes(deptId: number) {
  const dept = this.departements.find(d => d.id === deptId);
  this.selectedDepartementNom = dept ? dept.nom : '';
  this.selectedEmployes = []; // Réinitialiser d'abord

  this.departementService.getEmployesByDepartement(deptId).subscribe({
    next: (data) => {
      this.selectedEmployes = data;
    },
    error: (err) => {
      console.error('Erreur chargement employés', err);
      this.selectedEmployes = [];  // vide si erreur
    }
  });
}

}
