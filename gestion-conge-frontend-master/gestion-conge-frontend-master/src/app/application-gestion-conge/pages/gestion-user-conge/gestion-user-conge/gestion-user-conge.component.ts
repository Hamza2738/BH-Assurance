import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { SoldeCongeService } from '../../../services/solde-conge.service';
import { TypeCongeService } from '../../../services/type-conge.service';
import { SoldeConge } from '../../../models/solde-conge.model';

@Component({
  selector: 'app-gestion-user-conge',
  templateUrl: './gestion-user-conge.component.html',
  styleUrls: ['./gestion-user-conge.component.scss']
})
export class GestionUserCongeComponent implements OnInit {
  soldes: SoldeConge[] = [];
  typesCongeMap = new Map<number, string>();
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private soldeCongeService: SoldeCongeService,
    private typeCongeService: TypeCongeService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId?.();
    if (!userId) {
      this.errorMessage = 'Utilisateur non connecté.';
      return;
    }
    this.loadSoldesComplets(userId);
  }

  loadSoldesComplets(userId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.typeCongeService.getAllTypesConge().subscribe({
      next: (types) => {
        this.typesCongeMap.clear();
        (types || []).forEach((t: any) => this.typesCongeMap.set(Number(t.id), String(t.nom)));

        this.soldeCongeService.getSoldesByUtilisateur(userId).subscribe({
          next: (soldesUtilisateur: SoldeConge[]) => {
            const list = Array.isArray(soldesUtilisateur) ? soldesUtilisateur : [];

            // Pour chaque type, vérifier s'il existe dans soldesUtilisateur; sinon créer un solde=0
            this.soldes = (types || []).map((type: any) => {
              const typeId = Number(type.id);
              const soldeExist = list.find((s) => Number(s.type_conge_id) === typeId);
              if (soldeExist) {
                // Assurer les types numériques
                return {
                  ...soldeExist,
                  type_conge_id: typeId,
                  solde: Number((soldeExist as any).solde) || 0
                } as SoldeConge;
              }
              return {
                utilisateur_id: userId,
                type_conge_id: typeId,
                solde: 0,
                annee: undefined
              } as SoldeConge;
            });

            this.isLoading = false;
          },
          error: () => {
            this.errorMessage = 'Erreur lors du chargement des soldes utilisateur.';
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des types de congé.';
        this.isLoading = false;
      }
    });
  }

  get totalSolde(): number {
    const list = Array.isArray(this.soldes) ? this.soldes : [];
    let acc = 0;
    for (let i = 0; i < list.length; i++) {
      const val = Number((list[i] as any).solde) || 0;
      acc += val;
    }
    return acc;
  }

  getTypeNom(type_conge_id: number): string {
    return this.typesCongeMap.get(Number(type_conge_id)) || '—';
  }

  trackByType = (_: number, s: SoldeConge) => Number(s.type_conge_id);
}
