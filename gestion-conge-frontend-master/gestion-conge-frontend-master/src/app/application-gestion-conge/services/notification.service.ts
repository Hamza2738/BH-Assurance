// src/app/services/notification.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

/** DTO REST (renvoyé par les routes Flask) – UPPERCASE */
export interface NotificationDTORest {
  ID_NOTIFICATION: number;
  TITRE: string;
  TEXTE: string;
  EST_LU: boolean;
  DATE_ENVOI: string | null;

  ID_UTILISATEUR_EXPEDITEUR: string;
  ID_UTILISATEUR_DESTINATAIRE: string;
  USERNAME_EXPEDITEUR: string;
  USERNAME_DESTINATAIRE: string;

  UTILISATEUR_EXPEDITEUR_ID?: number | null;
  UTILISATEUR_DESTINATAIRE_ID?: number | null;

  ID_TYPE_NOTIFICATION: number;
  ID_DEROGATION?: number | null;
}

/** DTO Socket (émis par push realtime) – lowercase */
export interface NotificationDTOSocket {
  id: number;
  titre: string;
  texte: string;
  est_lu: boolean;
  date_envoi: string | null;

  id_utilisateur_expediteur: string;
  id_utilisateur_destinataire: string;
  username_expediteur: string;
  username_destinataire: string;

  utilisateur_expediteur_id?: number | null;
  utilisateur_destinataire_id?: number | null;

  id_type_notification: number;
  id_derogation?: number | null;
}

/** Modèle front “friendly” (normalisé) */
export interface NotificationMessage {
  id: number;
  title: string;
  text: string;
  read: boolean;
  sentAt: string | null;

  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;

  typeId: number;
  derogationId?: number | null;

  raw?: unknown; // payload brut (REST ou Socket)
}

// ---- Config API/socket (adapte si tu as un environments.ts) ----
const API_BASE =
  (typeof (window as any) !== 'undefined' && (window as any).__API_URL__) ||
  'http://localhost:5000';
const NOTIF_BASE = `${API_BASE}/api/notifications`;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private socket: Socket;
  private notificationsSubject = new Subject<NotificationMessage>();

  constructor(private http: HttpClient) {
    this.socket = io(API_BASE, {
      transports: ['websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () =>
      console.log('[SOCKET] connecté', this.socket.id)
    );
    this.socket.on('disconnect', () => console.log('[SOCKET] déconnecté'));

    // ✅ l’event émis côté serveur est "notification:new"
    this.socket.on('notification:new', (data: NotificationDTOSocket) => {
      this.notificationsSubject.next(this.mapAnyToMessage(data));
    });
  }

  // ------------- normalisation payloads -------------
  /** Accepte un payload REST (UPPERCASE) ou Socket (lowercase) et normalise */
  private mapAnyToMessage(dto: NotificationDTORest | NotificationDTOSocket): NotificationMessage {
    // Si c'est le format REST (UPPERCASE)
    if ((dto as NotificationDTORest).ID_NOTIFICATION !== undefined) {
      const d = dto as NotificationDTORest;
      return {
        id: d.ID_NOTIFICATION,
        title: d.TITRE,
        text: d.TEXTE,
        read: d.EST_LU,
        sentAt: d.DATE_ENVOI ?? null,

        senderId: d.ID_UTILISATEUR_EXPEDITEUR,
        senderName: d.USERNAME_EXPEDITEUR,
        recipientId: d.ID_UTILISATEUR_DESTINATAIRE,
        recipientName: d.USERNAME_DESTINATAIRE,

        typeId: d.ID_TYPE_NOTIFICATION,
        derogationId: d.ID_DEROGATION ?? null,

        raw: dto,
      };
    }

    // Sinon on suppose le format Socket (lowercase)
    const s = dto as NotificationDTOSocket;
    return {
      id: s.id,
      title: s.titre,
      text: s.texte,
      read: s.est_lu,
      sentAt: s.date_envoi ?? null,

      senderId: s.id_utilisateur_expediteur,
      senderName: s.username_expediteur,
      recipientId: s.id_utilisateur_destinataire,
      recipientName: s.username_destinataire,

      typeId: s.id_type_notification,
      derogationId: s.id_derogation ?? null,

      raw: dto,
    };
  }

  // ---------------- SOCKET ----------------

  /** Rejoindre la room utilisateur (serveur attend { id_utilisateur }) */
  joinUserRoom(userId: number | string): void {
    const id = String(userId);
    this.socket.emit('join', { id_utilisateur: id });
  }

  /** Optionnel: rejoindre rooms de rôle/département si tu utilises on('join_roles') côté serveur */
  joinRoles(
    role: 'manager' | 'super_admin' | 'admin' | 'user',
    departementId?: number | string,
    idUtilisateur?: number | string
  ): void {
    this.socket.emit('join_roles', {
      role,
      departement_id: departementId ?? null,
      id_utilisateur: idUtilisateur ?? null,
    });
  }

  /** Flux temps réel des notifications */
  onNewNotification(): Observable<NotificationMessage> {
    return this.notificationsSubject.asObservable();
  }

  /** Quitter explicitement une room si besoin */
  leaveRoom(room: string): void {
    this.socket.emit('leave', { room });
  }

  // ---------------- HTTP (REST) ----------------

  /**
   * Liste paginée
   * GET /api/notifications?dest_id_fk=&dest_id_legacy=&est_lu=&page=&page_size=
   */
  list(options: {
    destIdFk?: number;
    destIdLegacy?: string | number;
    estLu?: boolean;
    page?: number;
    pageSize?: number;
  }): Observable<{ items: NotificationMessage[]; total: number; page: number; page_size: number }> {
    let params = new HttpParams();
    if (options.destIdFk != null) params = params.set('dest_id_fk', String(options.destIdFk));
    if (options.destIdLegacy != null) params = params.set('dest_id_legacy', String(options.destIdLegacy));
    if (options.estLu != null) params = params.set('est_lu', String(options.estLu));
    if (options.page != null) params = params.set('page', String(options.page));
    if (options.pageSize != null) params = params.set('page_size', String(options.pageSize));

    return new Observable((subscriber) => {
      this.http.get<any>(`${NOTIF_BASE}`, { params }).subscribe({
        next: (res) => {
          const items = Array.isArray(res?.items) ? res.items.map((d: any) => this.mapAnyToMessage(d)) : [];
          subscriber.next({
            items,
            total: res?.total ?? 0,
            page: res?.page ?? 1,
            page_size: res?.page_size ?? items.length,
          });
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  /**
   * Compte des non-lues
   * GET /api/notifications/unread_count?dest_id_fk=&dest_id_legacy=
   */
  unreadCount(opts: { destIdFk?: number; destIdLegacy?: string | number }): Observable<{ count: number }> {
    let params = new HttpParams();
    if (opts.destIdFk != null) params = params.set('dest_id_fk', String(opts.destIdFk));
    if (opts.destIdLegacy != null) params = params.set('dest_id_legacy', String(opts.destIdLegacy));
    return this.http.get<{ count: number }>(`${NOTIF_BASE}/unread_count`, { params });
  }

  /**
   * Création + push
   * POST /api/notifications
   * Body requis (legacy obligatoires) :
   *  - titre, texte, id_utilisateur_expediteur, id_utilisateur_destinataire,
   *    username_expediteur, username_destinataire, id_type_notification
   *  - (optionnels) id_derogation, utilisateur_expediteur_id, utilisateur_destinataire_id
   */
  create(body: {
    titre: string;
    texte: string;
    id_utilisateur_expediteur: string | number;
    id_utilisateur_destinataire: string | number;
    username_expediteur: string;
    username_destinataire: string;
    id_type_notification: number;
    id_derogation?: number | null;
    utilisateur_expediteur_id?: number | null;
    utilisateur_destinataire_id?: number | null;
  }): Observable<{ notification: NotificationDTORest }> {
    return this.http.post<{ notification: NotificationDTORest }>(`${NOTIF_BASE}`, {
      ...body,
      id_utilisateur_expediteur: String(body.id_utilisateur_expediteur),
      id_utilisateur_destinataire: String(body.id_utilisateur_destinataire),
    });
  }

  /**
   * Marquer UNE notification comme lue
   * PATCH /api/notifications/:id/read
   * Body optionnel:
   *   { par_utilisateur_dest_id?: number, par_id_legacy?: string }
   */
  markRead(
    notificationId: number,
    opts?: { par_utilisateur_dest_id?: number; par_id_legacy?: string | number }
  ): Observable<{ notification: NotificationDTORest }> {
    const body: any = {};
    if (opts?.par_utilisateur_dest_id != null) body.par_utilisateur_dest_id = opts.par_utilisateur_dest_id;
    if (opts?.par_id_legacy != null) body.par_id_legacy = String(opts.par_id_legacy);
    return this.http.patch<{ notification: NotificationDTORest }>(`${NOTIF_BASE}/${notificationId}/read`, body);
  }

  /**
   * Marquer TOUTES les notifications d’un destinataire comme lues
   * POST /api/notifications/mark_all_read
   * Body:
   *   { utilisateur_destinataire_id?: number }  OU  { id_utilisateur_destinataire?: string }
   */
  markAllRead(opts: { utilisateur_destinataire_id?: number; id_utilisateur_destinataire?: string | number }): Observable<{ updated: number }> {
    const body: any = {};
    if (opts.utilisateur_destinataire_id != null) body.utilisateur_destinataire_id = opts.utilisateur_destinataire_id;
    if (opts.id_utilisateur_destinataire != null) body.id_utilisateur_destinataire = String(opts.id_utilisateur_destinataire);
    return this.http.post<{ updated: number }>(`${NOTIF_BASE}/mark_all_read`, body);
  }

  ngOnDestroy(): void {
    try {
      this.socket.removeAllListeners('notification:new');
      this.socket.disconnect();
    } catch {
      /* ignore */
    }
  }
}
