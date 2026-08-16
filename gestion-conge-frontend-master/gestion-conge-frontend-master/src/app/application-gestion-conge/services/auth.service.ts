import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:5000/auth';
  public showLoader = false;

  private userSubject: BehaviorSubject<any>;
  public userObservable: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('user');
    this.userSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.userObservable = this.userSubject.asObservable();
  }

  getUserObservable(): Observable<any> {
    return this.userObservable;
  }

  get currentUserValue(): any {
    return this.userSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

   SignIn(email: string, password: string): Observable<any> {
    this.showLoader = true;
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/login`, { email, password }).subscribe({
        next: (res) => {
          this.showLoader = false;
          if (res?.user && res?.token) {
            const user = { ...res.user };

            // Met à jour l'état global
            this.userSubject.next(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', res.token);

            // 👉 Redirection après login : HOME pour tout le monde
            this.router.navigate(['/application-gestion-conge/pages/home/home']);

            observer.next(res);
            observer.complete();
          } else {
            observer.error(new Error('Utilisateur ou token manquant'));
          }
        },
        error: (err) => {
          this.showLoader = false;
          observer.error(err);
        }
      });
    });
  }

  // SignIn(email: string, password: string): Observable<any> {
  //   this.showLoader = true;
  //   return new Observable(observer => {
  //     this.http.post<any>(`${this.apiUrl}/login`, { email, password }).subscribe({
  //       next: (res) => {
  //         this.showLoader = false;
  //         if (res.user && res.token) {
  //           const user = { ...res.user };
  //           this.userSubject.next(user);
  //           localStorage.setItem('user', JSON.stringify(user));
  //           localStorage.setItem('token', res.token);

  //           switch (user.role_id) {
  //             case 1:
  //               this.router.navigate(['/super-admin']);
  //               break;
  //             case 2:
  //               this.router.navigate(['/admin']);
  //               break;
  //             case 3:
  //               this.router.navigate(['/simple-employe']);
  //               break;
  //             default:
  //               this.router.navigate(['/dashboard/default']);
  //           }
  //           observer.next(res);
  //           observer.complete();
  //         } else {
  //           observer.error(new Error('Utilisateur ou token manquant'));
  //         }
  //       },
  //       error: (err) => {
  //         this.showLoader = false;
  //         observer.error(err);
  //       }
  //     });
  //   });
  // }

  SignOut(): void {
    this.userSubject.next(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }

  get isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getUserId(): number | null {
  const user = this.currentUserValue;
  return user ? user.id : null;
}

}
