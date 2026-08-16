import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AjoutDemandeRoutingModule } from './ajout-demande-routing.module';
import { AjoutDemandeComponent } from './ajout-demande/ajout-demande.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AjoutDemandeComponent
  ],
  imports: [
    CommonModule,
    FormsModule, 
    AjoutDemandeRoutingModule
  ]
})
export class AjoutDemandeModule { }
