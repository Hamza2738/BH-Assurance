import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionTypeCongeRoutingModule } from './gestion-type-conge-routing.module';
import { GestionTypeCongeComponent } from './gestion-type-conge/gestion-type-conge.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    GestionTypeCongeComponent
  ],
  imports: [
    CommonModule,
    GestionTypeCongeRoutingModule,
    HttpClientModule,
    FormsModule
  ]
})
export class GestionTypeCongeModule { }
