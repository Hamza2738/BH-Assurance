import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AjoutUtilisateurRoutingModule } from './ajout-utilisateur-routing.module';
import { AjoutUtilisateurComponent } from './ajout-utilisateur/ajout-utilisateur.component';
import { FormsModule } from '@angular/forms';
import { AjoutUtilisateutComponent } from './ajout-utilisateut/ajout-utilisateut.component';


@NgModule({
  declarations: [
    AjoutUtilisateurComponent,
    AjoutUtilisateutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AjoutUtilisateurRoutingModule
  ]
})
export class AjoutUtilisateurModule { }
