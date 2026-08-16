import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionRoleRoutingModule } from './gestion-role-routing.module';
import { GestionRoleComponent } from './gestion-role/gestion-role.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    GestionRoleComponent
  ],
  imports: [
    CommonModule,
    GestionRoleRoutingModule,
    FormsModule,
    HttpClientModule
  ]
})
export class GestionRoleModule { }
