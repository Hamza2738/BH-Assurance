import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionGradeRoutingModule } from './gestion-grade-routing.module';
import { GestionGradeComponent } from './gestion-grade/gestion-grade.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    GestionGradeComponent
  ],
  imports: [
    CommonModule,
    GestionGradeRoutingModule,
    FormsModule 
  ]
})
export class GestionGradeModule { }
