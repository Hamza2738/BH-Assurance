import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionDemandeComponent } from './gestion-demande/gestion-demande.component';

const routes: Routes = [
  {
    path: 'gestion-demande',
    component: GestionDemandeComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionDemandeRoutingModule { }
