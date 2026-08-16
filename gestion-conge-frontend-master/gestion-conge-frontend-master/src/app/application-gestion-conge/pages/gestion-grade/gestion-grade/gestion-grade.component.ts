import { Component, OnInit } from '@angular/core';
import { GradeService, Grade } from '../../../services/grade.service';

@Component({
  selector: 'app-gestion-grade',
  templateUrl: './gestion-grade.component.html',
  styleUrls: ['./gestion-grade.component.scss']
})
export class GestionGradeComponent implements OnInit {
  grades: Grade[] = [];

  editId: number | null = null;
  editTitre: string = '';
  editPouvoir: number | null = null;

  addTitre: string = '';
  addPouvoir: number | null = null;

  selectedUsers: any[] = [];
  selectedGradeTitre: string = '';
  filterPoste: string = '';

  constructor(private gradeService: GradeService) {}

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades() {
    this.gradeService.getAllGrades().subscribe({
      next: (data) => {
        this.grades = data;
      },
      error: (err) => console.error('Erreur chargement grades', err)
    });
  }

  onAdd() {
    if (!this.addTitre.trim() || this.addPouvoir == null) return;
    this.gradeService.createGrade({ titre: this.addTitre, pouvoir: this.addPouvoir }).subscribe({
      next: () => {
        this.loadGrades();
        this.addTitre = '';
        this.addPouvoir = null;
      },
      error: (err) => {
        if (err.status === 409) alert('Ce grade existe déjà.');
        else console.error('Erreur ajout', err);
      }
    });
  }

  onDelete(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce grade ?")) return;
    this.gradeService.deleteGrade(id).subscribe({
      next: () => this.loadGrades(),
      error: (err) => console.error('Erreur suppression', err)
    });
  }

  onEdit(grade: Grade) {
    this.editId = grade.id;
    this.editTitre = grade.titre;
    this.editPouvoir = grade.pouvoir;
  }

  onCancelEdit() {
    this.editId = null;
    this.editTitre = '';
    this.editPouvoir = null;
  }

  onUpdate(id: number) {
    if (!this.editTitre.trim() || this.editPouvoir == null) return;
    this.gradeService.updateGrade(id, { titre: this.editTitre, pouvoir: this.editPouvoir }).subscribe({
      next: () => {
        const g = this.grades.find(gr => gr.id === id);
        if (g) {
          g.titre = this.editTitre;
          g.pouvoir = this.editPouvoir!;
        }
        this.onCancelEdit();
        this.loadGrades();
      },
      error: (err) => {
        if (err.status === 409) alert('Ce titre de grade existe déjà.');
        else console.error('Erreur modification', err);
      }
    });
  }

  onViewUsers(gradeId: number) {
    const g = this.grades.find(gr => gr.id === gradeId);
    this.selectedGradeTitre = g ? g.titre : '';
    this.selectedUsers = [];

    this.gradeService.getUsersByGrade(gradeId).subscribe({
      next: (data) => this.selectedUsers = data,
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.selectedUsers = [];
      }
    });
  }

  onFilterUsers(gradeId: number, poste: string) {
    if (!poste.trim()) return;
    const g = this.grades.find(gr => gr.id === gradeId);
    this.selectedGradeTitre = g ? g.titre : '';
    this.selectedUsers = [];
    this.gradeService.filterUsersByPoste(gradeId, poste).subscribe({
      next: (data) => this.selectedUsers = data,
      error: (err) => {
        console.error('Erreur filtrage utilisateurs', err);
        this.selectedUsers = [];
      }
    });
  }
}
