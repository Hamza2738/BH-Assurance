import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionUtilisateurComponent } from './gestion-utilisateur/gestion-utilisateur.component';

const routes: Routes = [
  {
    path: 'gestion-utilisateur',
    component: GestionUtilisateurComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionUtilisateurRoutingModule { }
