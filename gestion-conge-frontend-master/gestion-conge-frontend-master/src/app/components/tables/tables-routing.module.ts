import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BasicComponent } from './bootstrap-tables/basic/basic.component'
import { BorderComponent } from './bootstrap-tables/border/border.component'
import { SizingComponent } from './bootstrap-tables/sizing/sizing.component'
import { StylingComponent } from './bootstrap-tables/styling/styling.component'
import { BasicNgxDatatableComponent } from './ngx-datatables/basic/basic.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'basic',
        component: BasicComponent,
        data: {
          title: "Basic",
          breadcrumb: "Basic"
        }
      },
      {
        path: 'sizing',
        component: SizingComponent,
        data: {
          title: "Sizing",
          breadcrumb: "Sizing"
        }
      },
      {
        path: 'border',
        component: BorderComponent,
        data: {
          title: "Border",
          breadcrumb: "Border"
        }
      },
      {
        path: 'styling',
        component: StylingComponent,
        data: {
          title: "Styling",
          breadcrumb: "Styling"
        }
      },
      {
        path: 'ngx-datatables/basic',
        component: BasicNgxDatatableComponent,
        data: {
          title: "Basic",
          breadcrumb: "Ngx-Datatables / Basic"
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TablesRoutingModule { }
