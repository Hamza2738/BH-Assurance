import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionGradeComponent } from './gestion-grade/gestion-grade.component';

const routes: Routes = [
  {
    path: 'gestion-grade',
    component: GestionGradeComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionGradeRoutingModule { }
