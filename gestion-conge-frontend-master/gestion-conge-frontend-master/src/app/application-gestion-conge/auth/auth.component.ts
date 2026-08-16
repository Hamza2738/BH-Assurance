import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  public loginForm: FormGroup;
  public errorMessage: string = '';
  public isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.SignIn(email, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Redirection selon rôle effectuée dans AuthService
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Échec de la connexion : ' + (err.error?.message || 'Erreur inconnue');
      }
    });
  }

  loginFacebook(): void {
    // Implémentation si besoin
  }

  loginTwitter(): void {
    // Implémentation si besoin
  }

  loginGoogle(): void {
    // Implémentation si besoin
  }
}
