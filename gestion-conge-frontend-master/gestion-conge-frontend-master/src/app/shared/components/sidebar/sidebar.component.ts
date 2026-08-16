import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NavService, Menu } from '../../services/nav.service';
import { AuthService } from '../../../application-gestion-conge/services/auth.service'; // <-- chemin adapté
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit, OnDestroy {

  public menuItems: Menu[];
  public url: any;
  public fileurl: any;

  public user: any = null;
  public userName: string = '';
  public userRole: string = '';
  private userSubscription: Subscription;

  constructor(
    private router: Router, 
    public navServices: NavService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.navServices.items.subscribe(menuItems => {
      this.menuItems = menuItems;
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.menuItems.forEach(item => {
            this.checkActiveRecursively(item, event.urlAfterRedirects);
          });
        }
      });
    });

    this.userSubscription = this.authService.getUserObservable().subscribe(user => {
      this.user = user;
      if (user) {
        this.userName = `${user.nom} ${user.prenom}`;
        this.userRole = this.mapRoleToLabel(user.type);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private checkActiveRecursively(item: Menu, currentUrl: string): boolean {
    if (item.path === currentUrl) {
      this.setNavActive(item);
      return true;
    }
    if (item.children) {
      for (const child of item.children) {
        if (this.checkActiveRecursively(child, currentUrl)) {
          this.setNavActive(item);
          return true;
        }
      }
    }
    return false;
  }

  setNavActive(item: Menu): void {
    this.menuItems.forEach(menuItem => {
      if (menuItem !== item) menuItem.active = false;

      if (menuItem.children && menuItem.children.includes(item)) {
        menuItem.active = true;
      }

      if (menuItem.children) {
        menuItem.children.forEach(submenuItem => {
          if (submenuItem.children && submenuItem.children.includes(item)) {
            menuItem.active = true;
            submenuItem.active = true;
          }
        });
      }
    });
  }

  toggletNavActive(item: Menu): void {
    if (!item.active) {
      this.menuItems.forEach(a => {
        if (this.menuItems.includes(item)) a.active = false;

        if (!a.children) return;
        a.children.forEach(b => {
          if (a.children.includes(item)) b.active = false;
        });
      });
    }
    item.active = !item.active;
  }

  readUrl(event: any): void {
    if (event.target.files.length === 0) return;

    const mimeType = event.target.files[0].type;
    if (!mimeType.match(/image\/*/)) return;

    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      this.url = reader.result;
    };
  }

  mapRoleToLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'super_admin': return 'Super Administrateur';
      case 'simple_employe': return 'Employé';
      default: return 'Utilisateur';
    }
  }
}
