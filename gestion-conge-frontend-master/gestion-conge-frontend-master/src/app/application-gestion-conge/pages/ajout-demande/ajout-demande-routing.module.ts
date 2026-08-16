import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AjoutDemandeComponent } from './ajout-demande/ajout-demande.component';


const routes: Routes = [
  {
        path: 'ajout-demande',
        component: AjoutDemandeComponent,
      }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AjoutDemandeRoutingModule { }
