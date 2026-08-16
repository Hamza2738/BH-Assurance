import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionTypeCongeComponent } from './gestion-type-conge/gestion-type-conge.component';

const routes: Routes = [
  {
    path: 'gestion-type-conge',
    component: GestionTypeCongeComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionTypeCongeRoutingModule { }
