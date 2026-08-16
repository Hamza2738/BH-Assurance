import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-reset-pwd',
  templateUrl: './reset-pwd.component.html',
  styleUrls: ['./reset-pwd.component.scss']
})
export class ResetPwdComponent implements OnInit {
  newPassword: string = '';
  confirmPassword: string = '';
  token: string = '';
  message: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.message = "❌ Les mots de passe ne correspondent pas.";
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    this.http.post('http://localhost:5000/auth/reset-password',
      { new_password: this.newPassword },
      { headers }
    ).subscribe({
      next: (res: any) => {
        this.message = "✅ " + res.message;
      },
      error: (err) => {
        this.message = err.error?.message || "❌ Erreur inconnue.";
      }
    });
  }
}
