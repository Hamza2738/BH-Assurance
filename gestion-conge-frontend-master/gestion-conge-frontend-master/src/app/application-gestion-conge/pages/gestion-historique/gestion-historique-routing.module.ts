import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionHistoriqueComponent } from './gestion-historique/gestion-historique.component';

const routes: Routes = [
  {
    path: 'gestion-historique',
    component: GestionHistoriqueComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionHistoriqueRoutingModule { }
