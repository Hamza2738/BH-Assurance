import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GestionHistoriqueRoutingModule } from './gestion-historique-routing.module';
import { GestionHistoriqueComponent } from './gestion-historique/gestion-historique.component';


@NgModule({
  declarations: [
    GestionHistoriqueComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    GestionHistoriqueRoutingModule
  ]
})
export class GestionHistoriqueModule { }
