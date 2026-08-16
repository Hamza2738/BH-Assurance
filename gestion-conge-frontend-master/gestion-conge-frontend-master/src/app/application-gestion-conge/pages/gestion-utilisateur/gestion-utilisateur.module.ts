import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionUtilisateurRoutingModule } from './gestion-utilisateur-routing.module';
import { GestionUtilisateurComponent } from './gestion-utilisateur/gestion-utilisateur.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    GestionUtilisateurComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    GestionUtilisateurRoutingModule
  ]
})
export class GestionUtilisateurModule { }
