import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionUserCongeComponent } from './gestion-user-conge/gestion-user-conge.component';

const routes: Routes = [
  {
    path: 'gestion-user-conge',
    component: GestionUserCongeComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionUserCongeRoutingModule { }
