import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionUserCongeRoutingModule } from './gestion-user-conge-routing.module';
import { GestionUserCongeComponent } from './gestion-user-conge/gestion-user-conge.component';


@NgModule({
  declarations: [
    GestionUserCongeComponent
  ],
  imports: [
    CommonModule,
    GestionUserCongeRoutingModule
  ]
})
export class GestionUserCongeModule { }
