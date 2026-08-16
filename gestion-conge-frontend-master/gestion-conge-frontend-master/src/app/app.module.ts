import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from "./shared/shared.module";
import { AppRoutingModule } from './app-routing.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { ToastrModule } from 'ngx-toastr';
import { DecimalPipe } from '@angular/common';

import { AuthService } from './shared/services/firebase/auth.service';
import { AdminGuard } from './shared/guard/admin.guard';
import { SecureInnerPagesGuard } from './shared/guard/SecureInnerPagesGuard.guard';
import { CookieService } from 'ngx-cookie-service';
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";

import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AuthComponent } from './application-gestion-conge/auth/auth.component';
import { ResetPwdComponent } from './application-gestion-conge/reset-pwd/reset-pwd.component';

// ⚡️ Import de ton interceptor
import { AuthInterceptor } from './application-gestion-conge/services/auth.interceptor';
import { HomeComponent } from './application-gestion-conge/pages/home/home/home.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AuthComponent,
    ResetPwdComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    SharedModule,
    AppRoutingModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
    }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule
  ],
  providers: [
    AuthService,
    AdminGuard,
    SecureInnerPagesGuard,
    CookieService,
    DecimalPipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // ✅ ici
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
