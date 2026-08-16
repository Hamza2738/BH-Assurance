import { Component, OnInit, OnDestroy } from '@angular/core';
import { DemandeService, Demande } from '../../../services/demande.service';
import { AuthService } from '../../../services/auth.service';
import { TypeCongeService } from '../../../services/type-conge.service';
import { SoldeCongeService } from '../../../services/solde-conge.service';
import { NotificationService } from '../../../services/notification.service';
import { TypeConge } from '../../../models/type-conge.model';
import { SoldeConge } from '../../../models/solde-conge.model';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ajout-demande',
  templateUrl: './ajout-demande.component.html',
  styleUrls: ['./ajout-demande.component.scss']
})
export class AjoutDemandeComponent implements OnInit, OnDestroy {

  demande: Demande = {
    utilisateur_id: 0,
    type_conge_id: 0,
    date_debut: '',
    date_fin: '',
    motif: '',
    statut_phase1: 'en attente',
    statut_final: 'en attente',
    nb_jours: 0
  };

  typesConge: TypeConge[] = [];
  soldeDisponible: number | null = null;

  messageSuccess = '';
  messageError = '';
  submitting = false;

  private destroyed$ = new Subject<void>();

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private typeCongeService: TypeCongeService,
    private soldeCongeService: SoldeCongeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.id) {
      this.demande.utilisateur_id = currentUser.id;

      // rejoindre la room socket (si le service expose cette méthode)
      if (typeof this.notificationService.joinUserRoom === 'function') {
        this.notificationService.joinUserRoom(currentUser.id);
      }
    }
    this.loadTypesConge();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /** Charger tous les types de congés */
  loadTypesConge(): void {
    this.typeCongeService.getAllTypesConge()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (data: any) => {
          // Accepte soit un tableau direct, soit un objet { types: [...] }
          this.typesConge = Array.isArray(data) ? data : (data?.types ?? []);
        },
        error: (err) => {
          console.error('Erreur chargement types de congé:', err);
          this.messageError = '⚠️ Erreur lors du chargement des types de congé.';
        }
      });
  }

  /** Lors du changement de type de congé → récupérer le solde disponible */
  onTypeCongeChange(): void {
    this.soldeDisponible = null;
    this.messageError = '';

    if (this.demande.type_conge_id && this.demande.utilisateur_id) {
      this.soldeCongeService.getSoldePrecise(this.demande.utilisateur_id, this.demande.type_conge_id)
        .pipe(takeUntil(this.destroyed$))
        .subscribe({
          next: (res: SoldeConge) => {
            this.soldeDisponible = res?.solde ?? 0;
          },
          error: (err) => {
            if (err?.status === 404) {
              this.soldeDisponible = 0;
            } else {
              console.error('Erreur solde:', err);
              this.messageError = 'Erreur lors de la récupération du solde.';
            }
          }
        });
    }
  }

  /** Calcul J+1 fiable (évite bugs de fuseau en fixant l’heure à 12:00) */
  get nbJoursCalcules(): number {
    const { date_debut, date_fin } = this.demande;
    if (!date_debut || !date_fin) return 0;

    // set to noon local time to avoid DST/timezone rounding issues
    const start = new Date(date_debut);
    start.setHours(12, 0, 0, 0);
    const end = new Date(date_fin);
    end.setHours(12, 0, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  /** Vérifie si la date de fin est avant la date de début */
  get dateFinAvantDateDebut(): boolean {
    if (!this.demande.date_debut || !this.demande.date_fin) return false;
    const start = new Date(this.demande.date_debut);
    const end = new Date(this.demande.date_fin);
    return end < start;
  }

  /** Soumission du formulaire */
  onSubmit(): void {
    if (this.submitting) return; // anti double-clic

    this.messageError = '';
    this.messageSuccess = '';
    this.submitting = true;

    if (!this.demande.utilisateur_id) {
      this.messageError = 'Utilisateur non authentifié.';
      this.submitting = false;
      return;
    }

    if (!this.demande.type_conge_id || !this.demande.date_debut || !this.demande.date_fin) {
      this.messageError = 'Veuillez remplir tous les champs obligatoires.';
      this.submitting = false;
      return;
    }

    if (this.dateFinAvantDateDebut) {
      this.messageError = 'La date de fin doit être postérieure ou égale à la date de début.';
      this.submitting = false;
      return;
    }

    // On laisse le back recalculer aussi nb_jours pour cohérence
    const demandeToSend: Demande = {
      ...this.demande,
      nb_jours: this.nbJoursCalcules
    };

    this.demandeService.createDemande(demandeToSend)
      .pipe(
        takeUntil(this.destroyed$),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        next: () => {
          this.messageSuccess = 'Demande envoyée avec succès ✅';
          this.resetForm(this.demande.utilisateur_id);
          // remettre le solde à jour si besoin (optionnel)
          if (this.demande.type_conge_id) this.onTypeCongeChange();
        },
        error: (err) => {
          console.error('Erreur création demande:', err);
          this.messageError = err?.message || 'Erreur lors de l’envoi de la demande.';
        }
      });
  }

  /** Réinitialiser le formulaire */
  resetForm(utilisateur_id: number): void {
    this.demande = {
      utilisateur_id,
      type_conge_id: 0,
      date_debut: '',
      date_fin: '',
      motif: '',
      statut_phase1: 'en attente',
      statut_final: 'en attente',
      nb_jours: 0
    };
    this.soldeDisponible = null;
  }
}
