import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GestionDemandeRoutingModule } from './gestion-demande-routing.module';
import { GestionDemandeComponent } from './gestion-demande/gestion-demande.component';


@NgModule({
  declarations: [
    GestionDemandeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    GestionDemandeRoutingModule
  ]
})
export class GestionDemandeModule { }
