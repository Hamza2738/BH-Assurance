import { Component, OnInit, OnDestroy } from '@angular/core';
import { DemandeService, Demande } from '../../../services/demande.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription, forkJoin, firstValueFrom } from 'rxjs';
import { Utilisateur } from '../../../models/utilisateur.model';
import { GradeService, Grade } from '../../../services/grade.service';
import { SoldeCongeService } from '../../../services/solde-conge.service';
import { NotificationService, NotificationMessage } from '../../../services/notification.service';

interface DemandeAvecUser extends Demande {
  utilisateur: Utilisateur;
  etat?: string;
  solde_rest?: number;
}

@Component({
  selector: 'app-gestion-demande',
  templateUrl: './gestion-demande.component.html',
  styleUrls: ['./gestion-demande.component.scss']
})
export class GestionDemandeComponent implements OnInit, OnDestroy {
  demandes: DemandeAvecUser[] = [];
  selectedStatut: string = 'all';

  editDemande: Demande | null = null;
  changeStatutDemande: DemandeAvecUser | null = null;

  currentUser: Utilisateur | null = null;
  grades: Grade[] = [];

  private subs: Subscription[] = [];

  constructor(
    private demandeService: DemandeService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private gradeService: GradeService,
    private soldeCongeService: SoldeCongeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser?.id) return;

    // 🔔 socket: rejoindre la room utilisateur
    this.notificationService.joinUserRoom(this.currentUser.id);

    // 🔔 écouter toutes les notifications -> rafraîchir la liste
    const notifSub = this.notificationService.onNewNotification().subscribe((_notif: NotificationMessage) => {
      // console.log('🔔 Notification reçue:', _notif);
      this.fetchDemandes();
    });
    this.subs.push(notifSub);

    // Charger les grades puis les demandes
    this.loadGradesAndDemandes();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  public isSuperAdmin(): boolean {
    const roleNom = (this.currentUser?.role as any)?.nom?.toLowerCase?.();
    return this.currentUser?.role_id === 1 || roleNom === 'super_admin';
  }

  public loadGradesAndDemandes(): void {
    const s = this.gradeService.getAllGrades().subscribe({
      next: (grades) => {
        this.grades = grades;
        this.fetchDemandes();
      },
      error: (err) => console.error('Erreur chargement grades', err)
    });
    this.subs.push(s);
  }

  public fetchDemandes(): void {
    if (!this.currentUser?.id) return;

    const s = forkJoin({
      demandes: this.demandeService.getDemandesVisibles(this.currentUser.id),
      utilisateurs: this.utilisateurService.getAllUtilisateurs()
    }).subscribe({
      next: async ({ demandes, utilisateurs }) => {
        const demandesAvecUser: DemandeAvecUser[] = await Promise.all(
          demandes.map(async d => {
            const user = utilisateurs.find(u => u.id === d.utilisateur_id)!;

            // État lisible
            let etat = 'En attente';
            if (d.statut_final && d.statut_final.toLowerCase() !== 'en attente') {
              etat = `Final : ${d.statut_final}`;
            } else if (d.statut_phase1 && d.statut_phase1.toLowerCase() !== 'en attente') {
              etat = `Phase 1 : ${d.statut_phase1}`;
            }

            // Solde restant (si API dispo)
            let solde_rest = 0;
            try {
              const soldeRes: any = await firstValueFrom(
                this.soldeCongeService.getSoldePrecise(d.utilisateur_id, d.type_conge_id)
              );
              solde_rest = Array.isArray(soldeRes)
                ? (soldeRes[0]?.solde ?? 0)
                : (soldeRes?.solde ?? 0);
            } catch {
              solde_rest = 0;
            }

            return { ...d, utilisateur: user, etat, solde_rest };
          })
        );

        // Filtre selon sélection
        let filtered = demandesAvecUser;
        const sel = (this.selectedStatut || 'all').toLowerCase();

        if (this.isSuperAdmin()) {
          if (sel === 'en attente') {
            filtered = demandesAvecUser.filter(
              d => d.statut_phase1?.toLowerCase() === 'accepté' &&
                   (!d.statut_final || d.statut_final.toLowerCase() === 'en attente')
            );
          } else if (sel === 'accepté') {
            filtered = demandesAvecUser.filter(d => d.statut_final?.toLowerCase() === 'accepté');
          } else if (sel === 'rejeté') {
            filtered = demandesAvecUser.filter(d => d.statut_final?.toLowerCase() === 'rejeté');
          }
        } else if (sel !== 'all') {
          filtered = demandesAvecUser.filter(d => (d.etat || '').toLowerCase().includes(sel));
        }

        this.demandes = filtered;
      },
      error: (err) => console.error('Erreur chargement demandes/utilisateurs', err)
    });
    this.subs.push(s);
  }

  // ✏️ Édition demande
  public onEdit(demande: Demande): void {
    this.editDemande = { ...demande };
  }

  public updateDemande(): void {
    if (!this.editDemande?.id || !this.currentUser?.id) return;

    const payload: Partial<Demande> = { ...this.editDemande, utilisateur_id: this.currentUser.id };
    const s = this.demandeService.updateDemande(this.editDemande.id, payload).subscribe({
      next: () => { this.fetchDemandes(); this.editDemande = null; },
      error: (err) => console.error('Erreur mise à jour demande', err)
    });
    this.subs.push(s);
  }

  public cancelEdit(): void { this.editDemande = null; }

  // 🗑️ Suppression
  public onDelete(demande: Demande): void {
    if (!demande.id || !this.currentUser?.id) return;
    if (!confirm('Voulez-vous vraiment supprimer cette demande ?')) return;

    const s = this.demandeService.deleteDemande(demande.id, this.currentUser.id).subscribe({
      next: () => this.fetchDemandes(),
      error: (err) => console.error('Erreur suppression demande', err)
    });
    this.subs.push(s);
  }

  // 🔄 Changement de statut
  public openChangeStatut(demande: DemandeAvecUser): void {
    this.changeStatutDemande = { ...demande };
  }

  public saveNewStatutManager(decision: 'accepté' | 'rejeté'): void {
    if (!this.changeStatutDemande?.id || !this.currentUser?.id) return;

    const s = this.demandeService.changeStatutManager(
      this.changeStatutDemande.id,
      this.currentUser.id,
      decision
    ).subscribe({
      next: () => {
        // ✅ Le backend envoie:
        // - notif à l'utilisateur
        // - si accepté, notif aux super_admins
        this.fetchDemandes();
        this.changeStatutDemande = null;
      },
      error: (err) => console.error('Erreur changement statut (manager)', err)
    });
    this.subs.push(s);
  }

  public saveNewStatutSuperAdmin(decision: 'accepté' | 'rejeté'): void {
    if (!this.changeStatutDemande?.id || !this.currentUser?.id) return;

    const s = this.demandeService.changeStatutSuperAdmin(
      this.changeStatutDemande.id,
      this.currentUser.id,
      decision
    ).subscribe({
      next: () => {
        // ✅ Le backend envoie:
        // - notif à l'utilisateur
        // - notif aux managers concernés
        this.fetchDemandes();
        this.changeStatutDemande = null;
      },
      error: (err) => console.error('Erreur changement statut (superadmin)', err)
    });
    this.subs.push(s);
  }

  public cancelChangeStatut(): void { this.changeStatutDemande = null; }

  // 🧹 Nettoyer expirées
  public nettoyerExpirees(): void {
    if (!confirm('Confirmer suppression des demandes expirées ?')) return;
    const s = this.demandeService.nettoyerDemandesExpirees().subscribe({
      next: () => this.fetchDemandes(),
      error: (err) => console.error('Erreur nettoyage demandes expirées', err)
    });
    this.subs.push(s);
  }
}
