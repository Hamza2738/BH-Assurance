// gestion-historique.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { HistoriqueService } from '../../../services/historique.service';
import { DemandeService, Demande } from '../../../services/demande.service';
import { Historique } from '../../../models/historique.model';
import { catchError, of } from 'rxjs';

type StepState = 'done' | 'active' | 'todo' | 'rejected';

interface TimelineStep {
  index: number;
  label: string;
  state: StepState;
  circleText: string;
  hint?: string; // info-bulle (dates/explications)
}

@Component({
  selector: 'app-gestion-historique',
  templateUrl: './gestion-historique.component.html',
  styleUrls: ['./gestion-historique.component.scss']
})
export class GestionHistoriqueComponent implements OnInit {

  historiques: Historique[] = [];
  timelineSteps: TimelineStep[] = [];
  derniereDemande: Demande | null = null;

  page = 1;
  perPage = 10;
  totalPages = 1;
  totalItems = 0;

  loading = false;
  loadingDemande = false;

  constructor(
    private authService: AuthService,
    private historiqueService: HistoriqueService,
    private demandeService: DemandeService
  ) {}

  ngOnInit(): void {
    this.fetchHistorique();
    this.fetchDerniereDemande();
  }

  // ───────────── HISTORIQUE ─────────────
  fetchHistorique(): void {
    const userId = this.authService.getUserId?.();
    if (!userId) return;

    this.loading = true;
    this.historiqueService.getHistoriqueByUser(userId, this.page, this.perPage).subscribe({
      next: (res) => {
        this.historiques = res.items.map(h => ({
          ...h,
          statutClass: this.getBadgeClass(h.statut)
        }));
        this.totalPages = res.pages;
        this.totalItems = res.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur récupération historique', err);
        this.loading = false;
      }
    });
  }

  // ───────────── DERNIERE DEMANDE ─────────────
  fetchDerniereDemande(): void {
    const userId = this.authService.getUserId?.();
    if (!userId) return;

    this.loadingDemande = true;
    this.demandeService.getDerniereDemande(userId)
      .pipe(catchError(() => of(null)))
      .subscribe((demande: Demande | null) => {
        this.derniereDemande = demande;
        this.timelineSteps = this.buildTimeline(demande ?? undefined);
        this.loadingDemande = false;
      });
  }

  // ───────────── NORMALISATION & HELPERS ─────────────
  /** Retire les accents pour matcher "rejeté" / "rejete" / "refuse"... */
  private stripAccents(input: string): string {
    return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Normalise un statut arbitraire vers: 'en attente' | 'accepté' | 'rejeté'
   * Laisse undefined si on ne sait pas trancher.
   */
  private normalizeStatus(s?: string | null): 'en attente' | 'accepté' | 'rejeté' | undefined {
    if (!s) return undefined;
    const base = this.stripAccents(s.toLowerCase());
    if (base.includes('attente')) return 'en attente';
    if (base.includes('accepte')) return 'accepté';
    if (base.includes('rejete') || base.includes('refuse')) return 'rejeté';
    return undefined;
  }

  /**
   * Vrai si le statut global indique explicitement "en attente super_admin".
   */
  private isWaitingSuperAdmin(globalStatut?: string | null): boolean {
    if (!globalStatut) return false;
    const g = this.stripAccents(globalStatut.toLowerCase());
    return g.includes('super') && g.includes('attente');
  }

  private dateHint(label: string, iso?: string | null): string | undefined {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return undefined;
    return `${label}: ${d.toLocaleString()}`;
  }

  // ───────────── TIMELINE (CHEMIN) ─────────────
  /**
   * Ordre voulu:
   * 1. Aucune demande
   * 2. Phase 1 (Manager)
   * 3. En attente Super Admin
   * 4. Décision finale
   *
   * Règles:
   * - Manager rejette => on va directement à Décision finale (rejeté), sans étape SA.
   * - Manager accepte & attente SA => étape 3 active.
   * - Décision finale connue => étape 4 "done" (ou "rejected").
   * - Aucun statut => étape 2 active.
   */
  buildTimeline(demande?: Demande): TimelineStep[] {
    const labels = [
      'Aucune demande',
      'Phase 1 (Manager)',
      'En attente Super Admin',
      'Décision finale'
    ];

    // Cas 0 : aucune demande encore
    if (!demande) {
      return [1, 2, 3, 4].map(i => ({
        index: i,
        label: labels[i - 1],
        state: i === 1 ? 'active' : 'todo',
        circleText: String(i)
      }));
    }

    const phase1 = this.normalizeStatus(demande.statut_phase1);
    const final  = this.normalizeStatus(demande.statut_final);
    const waitSA = this.isWaitingSuperAdmin(demande.statut);

    const hintsByIndex: Record<number, string | undefined> = {
      1: this.dateHint('Soumise', demande.date_demande),
      4: this.dateHint('Dernière mise à jour', demande.date_modification)
    };

    // États par défaut
    // Dès qu'il existe une demande, "Aucune demande" passe à done.
    let s1: StepState = 'done';
    let s2: StepState = 'todo';
    let s3: StepState = 'todo';
    let s4: StepState = 'todo';

    // 1) Manager REJETÉ ⇒ direct Décision finale (rejet)
    if (phase1 === 'rejeté') {
      s2 = 'rejected'; // phase manager a rejeté
      s3 = 'todo';     // pas d'attente SA
      s4 = 'rejected'; // décision finale = rejet
    }
    // 2) Décision finale déjà connue
    else if (final === 'accepté' || final === 'rejeté') {
      s2 = 'done';
      s3 = 'done';
      s4 = (final === 'rejeté') ? 'rejected' : 'done';
    }
    // 3) Manager ACCEPTÉ et on attend SA
    else if (phase1 === 'accepté' && (waitSA || !final || final === 'en attente')) {
      s2 = 'done';
      s3 = 'active';
    }
    // 4) Par défaut : manager en attente
    else {
      s2 = 'active';
    }

    return [1, 2, 3, 4].map(i => ({
      index: i,
      label: labels[i - 1],
      state: [s1, s2, s3, s4][i - 1],
      circleText: String(i),
      hint: hintsByIndex[i]
    }));
  }

  // ───────────── UI HELPERS ─────────────
  getBadgeClass(status: string | null | undefined): string {
    const s = this.normalizeStatus(status ?? undefined);
    if (s === 'accepté') return 'success';
    if (s === 'rejeté')  return 'danger';
    if (s === 'en attente') return 'warning';
    if (this.isWaitingSuperAdmin(status ?? undefined)) return 'info'; // statut global
    return 'secondary';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
      this.fetchHistorique();
    }
  }

  // Pour *ngFor trackBy (meilleure perf et corrige le mauvais usage précédent)
  trackById(_index: number, item: { id?: number | string }) {
    return item?.id ?? _index;
  }
}
