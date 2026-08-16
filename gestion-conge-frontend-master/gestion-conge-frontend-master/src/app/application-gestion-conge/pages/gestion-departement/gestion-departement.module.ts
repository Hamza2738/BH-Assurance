import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionDepartementRoutingModule } from './gestion-departement-routing.module';
import { GestionDepartementComponent } from './gestion-departement/gestion-departement.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    GestionDepartementComponent
  ],
  imports: [
    CommonModule,
    GestionDepartementRoutingModule,
    FormsModule 
  ]
})
export class GestionDepartementModule { }
