import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Inject,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';

import { NavService, Menu } from '../../services/nav.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../application-gestion-conge/services/auth.service';

import {
  NotificationService,
  NotificationMessage,
} from '../../../application-gestion-conge/services/notification.service';

type UserLike = {
  id: number | string;
  nom?: string;
  prenom?: string;
  departement_id?: number | string;
  role?: { nom?: 'manager' | 'super_admin' | 'admin' | 'user' } | string;
  photoURL?: string;
};

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  public menuItems: Menu[] = [];
  public items: Menu[] = [];
  public searchResult = false;
  public searchResultEmpty = false;
  public openNav = false;
  public right_sidebar = false;
  public text = '';
  public elem: any;
  public isOpenMobile = false;

  // 🔔 Notifications
  public notifications: NotificationMessage[] = [];
  public unreadCount = 0;
  public showNotifications = false;

  private subs: Subscription[] = [];

  @Output() rightSidebarEvent = new EventEmitter<boolean>();

  constructor(
    public navServices: NavService,
    @Inject(DOCUMENT) private document: any,
    public translate: TranslateService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {
    translate.setDefaultLang('en');
  }

  ngOnInit() {
    this.elem = document.documentElement;

    // Menus
    const s1 = this.navServices.items.subscribe((menuItems) => {
      this.items = menuItems;
    });
    this.subs.push(s1);

    // Utilisateur courant
    const user = this.authService.currentUserValue as UserLike | null;
    if (user?.id != null) {
      // ⚡️ Rejoindre la room socket utilisateur
      this.notificationService.joinUserRoom(user.id);

      // (optionnel) rooms de rôle/département
      const roleName =
        typeof user.role === 'string' ? (user.role as any) : (user.role?.nom as any);
      if (roleName) {
        this.notificationService.joinRoles(
          (roleName as any) || 'user',
          user.departement_id,
          user.id
        );
      }

      // Charger les notifications (REST paginé)
      this.loadNotifications();

      // Flux temps réel
      const s3 = this.notificationService.onNewNotification().subscribe((msg: NotificationMessage) => {
        // ajoute en tête
        this.notifications = [msg, ...this.notifications];
        if (!msg.read) this.unreadCount += 1;
      });
      this.subs.push(s3);
    }
  }

  private loadNotifications(): void {
    const user = this.authService.currentUserValue as UserLike | null;
    if (!user?.id) return;

    const s = this.notificationService
      .list({ destIdFk: Number(user.id), page: 1, pageSize: 50 })
      .subscribe({
        next: (res) => {
          this.notifications = res.items;
          this.unreadCount = res.items.filter((n) => !n.read).length;
        },
        error: (err) => console.error('Erreur chargement notifications', err),
      });
    this.subs.push(s);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAllAsRead() {
    if (this.unreadCount === 0) return;

    const user = this.authService.currentUserValue as UserLike | null;
    if (!user?.id) {
      // Fallback local
      this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
      this.unreadCount = 0;
      return;
    }

    const s = this.notificationService
      .markAllRead({ utilisateur_destinataire_id: Number(user.id) })
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
          this.unreadCount = 0;
        },
        error: () => {
          // fallback local si l’API échoue
          this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
          this.unreadCount = 0;
        },
      });
    this.subs.push(s);
  }

  markAsRead(notif: NotificationMessage) {
    if (notif.read) return;

    notif.read = true; // optimiste
    this.unreadCount = Math.max(this.unreadCount - 1, 0);

    const user = this.authService.currentUserValue as UserLike | null;
    if (!user?.id) return;

    const s = this.notificationService
      .markRead(notif.id, { par_utilisateur_dest_id: Number(user.id) })
      .subscribe({
        error: () => {
          // rollback si échec
          notif.read = false;
          this.unreadCount += 1;
        },
      });
    this.subs.push(s);
  }

  right_side_bar() {
    this.right_sidebar = !this.right_sidebar;
    this.rightSidebarEvent.emit(this.right_sidebar);
  }

  collapseSidebar() {
    this.navServices.collapseSidebar = !this.navServices.collapseSidebar;
  }

  openMobileNav() {
    this.openNav = !this.openNav;
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
  }

  searchTerm(term: string) {
    term ? this.addFix() : this.removeFix();
    if (!term) {
      this.menuItems = [];
      return;
    }

    const items: Menu[] = [];
    const lowerTerm = term.toLowerCase();

    this.items.forEach((menuItem) => {
      if (menuItem.title.toLowerCase().includes(lowerTerm) && menuItem.type === 'link')
        items.push(menuItem);

      menuItem.children?.forEach((subItem) => {
        if (subItem.title.toLowerCase().includes(lowerTerm) && subItem.type === 'link') {
          subItem.icon = menuItem.icon;
          items.push(subItem);
        }

        subItem.children?.forEach((subSub) => {
          if (subSub.title.toLowerCase().includes(lowerTerm)) {
            subSub.icon = menuItem.icon;
            items.push(subSub);
          }
        });
      });
    });

    this.searchResultEmpty = items.length === 0;
    this.menuItems = items;
  }

  addFix() {
    this.searchResult = true;
    document.body.classList.add('offcanvas');
  }

  removeFix() {
    this.searchResult = false;
    document.body.classList.remove('offcanvas');
    this.text = '';
  }

  toggleFullScreen() {
    this.navServices.fullScreen = !this.navServices.fullScreen;
    if (this.navServices.fullScreen) {
      if (this.elem.requestFullscreen) this.elem.requestFullscreen();
      else if (this.elem.mozRequestFullScreen) this.elem.mozRequestFullScreen();
      else if (this.elem.webkitRequestFullscreen) this.elem.webkitRequestFullscreen();
      else if (this.elem.msRequestFullscreen) this.elem.msRequestFullscreen();
    } else {
      if (this.document.exitFullscreen) this.document.exitFullscreen();
      else if (this.document.mozCancelFullScreen) this.document.mozCancelFullScreen();
      else if (this.document.webkitExitFullscreen) this.document.webkitExitFullscreen();
      else if (this.document.msExitFullscreen) this.document.msExitFullscreen();
    }
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
    this.removeFix();
  }
}
