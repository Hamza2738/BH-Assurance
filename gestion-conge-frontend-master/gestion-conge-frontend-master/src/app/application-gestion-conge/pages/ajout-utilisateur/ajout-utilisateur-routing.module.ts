import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AjoutUtilisateurComponent } from './ajout-utilisateur/ajout-utilisateur.component';

const routes: Routes = [
  {
      path: 'ajout-utilisateur',
      component: AjoutUtilisateurComponent,
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AjoutUtilisateurRoutingModule { }
