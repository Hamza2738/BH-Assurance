import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

// ✅ chemins ajustés (4 niveaux vers /services)
import { DemandeService, Demande } from '../../../services/demande.service';
import { HistoriqueService } from '../../../services/historique.service';
import { AuthService } from '../../../services/auth.service';

interface Activite {
  titre: string;
  texte: string;
  when?: string;
  icon?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  // états UI
  loading = true;
  errorMsg: string | null = null;

  // données
  demandes: Demande[] = [];
  demandesRecentes: Demande[] = [];
  activites: Activite[] = [];

  // KPI
  kpiTotal = 0;
  kpiAcceptees = 0;
  kpiRejetees = 0;
  kpiEnAttente = 0;

  constructor(
    private auth: AuthService,
    private demandesSrv: DemandeService,
    private histoSrv: HistoriqueService
  ) {}

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.loading = false;
      this.errorMsg = 'Utilisateur non authentifié.';
      return;
    }

    forkJoin({
      demandes: this.demandesSrv.getDemandesVisibles(userId),
      histoPage: this.histoSrv.getHistoriqueByUser(userId, 1, 10),
    }).subscribe({
      next: ({ demandes, histoPage }) => {
        this.demandes = demandes ?? [];
        this.computeKpis(this.demandes);
        this.demandesRecentes = this.sortByDate(this.demandes).slice(0, 6);

        const items: any[] = histoPage?.items ?? [];
        this.activites = items.map((h) => {
          const titre = this.pickTitle(h);
          return {
            titre,
            texte: this.pickText(h),
            when: this.formatRelative(this.pickDate(h)),
            icon: this.pickIcon(titre),
          };
        });

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.message || 'Erreur lors du chargement du tableau de bord.';
      },
    });
  }

  // ---------- KPI ----------
  private computeKpis(list: Demande[]) {
    this.kpiTotal = list.length;
    this.kpiAcceptees = list.filter(d => (d.statut_final || d.statut) === 'accepté').length;
    this.kpiRejetees = list.filter(d => (d.statut_final || d.statut) === 'rejeté').length;
    this.kpiEnAttente = list.filter(d =>
      d.statut === 'en attente' ||
      d.statut === 'en attente super_admin' ||
      d.statut_final === 'en attente'
    ).length;
  }

  // ---------- Utils ----------
  private sortByDate(list: Demande[]) {
    return [...list].sort((a, b) => {
      const da = this.safeDate(a.date_modification || a.date_demande || a.date_debut)?.getTime() || 0;
      const db = this.safeDate(b.date_modification || b.date_demande || b.date_debut)?.getTime() || 0;
      return db - da;
    });
  }

  private safeDate(s?: string) {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatRelative(dateIso?: string) {
    const d = this.safeDate(dateIso);
    if (!d) return '';
    const delta = (Date.now() - d.getTime()) / 1000;
    if (delta < 60) return 'à l’instant';
    if (delta < 3600) return `${Math.floor(delta / 60)}m`;
    if (delta < 86400) return `${Math.floor(delta / 3600)}h`;
    return d.toLocaleDateString();
  }

  /** Renvoie la 1ère clé trouvée et non vide parmi une liste */
  private getField<T = any>(obj: unknown, keys: string[]): T | undefined {
    const anyObj = obj as Record<string, any>;
    for (const k of keys) {
      const v = anyObj?.[k];
      if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')) {
        return v as T;
      }
    }
    return undefined;
  }

  private pickTitle(h: any): string {
    return this.getField<string>(h, ['action', 'titre', 'title', 'event', 'operation', 'type']) || 'Action';
  }
  private pickText(h: any): string {
    return this.getField<string>(h, ['description', 'texte', 'message', 'details', 'detail', 'commentaire']) || '';
  }
  private pickDate(h: any): string | undefined {
    return this.getField<string>(h, ['date_action', 'created_at', 'date', 'timestamp', 'date_creation', 'updated_at']);
  }
  private pickIcon(text?: string) {
    const a = (text || '').toLowerCase();
    if (a.includes('accep')) return 'check-circle';
    if (a.includes('rejet')) return 'x-circle';
    if (a.includes('crée') || a.includes('nouvelle')) return 'plus-circle';
    if (a.includes('modif')) return 'edit-2';
    return 'activity';
  }

  // ---------- Template helpers ----------
  /** Calcule les jours (inclusifs) si nb_jours n'est pas fourni par l'API */
  getNbJours(d: Demande): number | null {
    if (d.nb_jours !== undefined && d.nb_jours !== null) return d.nb_jours;
    if (d.date_debut && d.date_fin) {
      const d1 = new Date(`${d.date_debut}T00:00:00`);
      const d2 = new Date(`${d.date_fin}T00:00:00`);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        return Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1; // inclusif
      }
    }
    return null;
  }

  statutBadgeClass(d: Demande) {
    const s = this.statutText(d);
    if (s === 'accepté') return 'badge bg-success';
    if (s === 'rejeté') return 'badge bg-danger';
    return 'badge bg-warning text-dark';
  }

  statutText(d: Demande) {
    return (d.statut_final && d.statut_final !== 'en attente') ? d.statut_final : (d.statut || 'en attente');
  }
}
