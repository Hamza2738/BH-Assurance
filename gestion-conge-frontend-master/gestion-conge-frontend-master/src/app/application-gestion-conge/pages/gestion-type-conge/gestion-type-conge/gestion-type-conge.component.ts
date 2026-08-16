import { Component, OnInit } from '@angular/core';
import { TypeConge, Unite, Periode } from '../../../models/type-conge.model';
import { TypeCongeService } from '../../../services/type-conge.service';

@Component({
  selector: 'app-gestion-type-conge',
  templateUrl: './gestion-type-conge.component.html',
  styleUrls: ['./gestion-type-conge.component.scss']
})
export class GestionTypeCongeComponent implements OnInit {

  typesConge: TypeConge[] = [];

  newType: Partial<TypeConge> = {
    nom: '',
    duree: 0,
    unite: Unite.Jours,
    periode: Periode.Annuelle
  };

  editType: Partial<TypeConge> = {
    nom: '',
    duree: 0,
    unite: Unite.Jours,
    periode: Periode.Annuelle
  };
  editId: number | null = null;

  message = '';
  messageError = '';

  unites = Object.values(Unite);
  periodicites = Object.values(Periode);

  constructor(private typeCongeService: TypeCongeService) {}

  ngOnInit(): void {
    this.loadTypesConge();
  }

  loadTypesConge(): void {
    this.typeCongeService.getAllTypesConge().subscribe({
      next: (data) => {
        this.typesConge = data;
        this.messageError = '';
      },
      error: (err) => {
        console.error('Erreur API:', err);
        this.messageError = 'Erreur lors du chargement des types de congé.';
      }
    });
  }

  createTypeConge(): void {
    this.messageError = '';
    this.message = '';

    if (!this.isFormValid(this.newType)) {
      this.messageError = 'Tous les champs sont obligatoires.';
      return;
    }

    this.typeCongeService.createTypeConge(this.newType).subscribe({
      next: (created) => {
        this.message = `Type de congé "${created.nom}" ajouté avec succès.`;
        this.typesConge.push(created);
        this.resetNewType();
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.messageError = 'Erreur lors de la création du type de congé.';
      }
    });
  }

  isFormValid(type: Partial<TypeConge>): boolean {
    return !!type.nom && type.duree! > 0 && !!type.unite && !!type.periode;
  }

  startEdit(type: TypeConge): void {
    this.editId = type.id;
    this.editType = { ...type };
    this.messageError = '';
    this.message = '';
  }

  cancelEdit(): void {
    this.editId = null;
    this.resetEditType();
    this.messageError = '';
    this.message = '';
  }

  updateTypeConge(): void {
    if (this.editId === null) return;

    if (!this.isFormValid(this.editType)) {
      this.messageError = 'Tous les champs sont obligatoires.';
      return;
    }

    this.typeCongeService.updateTypeConge(this.editId, this.editType).subscribe({
      next: (updated) => {
        this.message = `Type de congé "${updated.nom}" modifié avec succès.`;
        const index = this.typesConge.findIndex(t => t.id === updated.id);
        if (index !== -1) this.typesConge[index] = updated;
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.messageError = 'Erreur lors de la modification du type de congé.';
      }
    });
  }

  deleteTypeConge(id: number): void {
    this.messageError = '';
    this.message = '';

    if (!confirm('Confirmez-vous la suppression ?')) return;

    this.typeCongeService.deleteTypeConge(id).subscribe({
      next: () => {
        this.message = 'Type de congé supprimé avec succès.';
        this.typesConge = this.typesConge.filter(t => t.id !== id);
        if (this.editId === id) this.cancelEdit();
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.messageError = 'Erreur lors de la suppression du type de congé.';
      }
    });
  }

  resetNewType(): void {
    this.newType = {
      nom: '',
      duree: 0,
      unite: Unite.Jours,
      periode: Periode.Annuelle
    };
  }

  resetEditType(): void {
    this.editType = {
      nom: '',
      duree: 0,
      unite: Unite.Jours,
      periode: Periode.Annuelle
    };
  }
}
