import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionRoleComponent } from './gestion-role/gestion-role.component';

const routes: Routes = [
  {
    path: 'gestion-role',
    component: GestionRoleComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionRoleRoutingModule { }
