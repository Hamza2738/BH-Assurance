import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TablesRoutingModule } from './tables-routing.module';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
// import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { BasicComponent } from './bootstrap-tables/basic/basic.component'
import { BorderComponent } from './bootstrap-tables/border/border.component'
import { SizingComponent } from './bootstrap-tables/sizing/sizing.component'
import { StylingComponent } from './bootstrap-tables/styling/styling.component'
import { BasicNgxDatatableComponent } from './ngx-datatables/basic/basic.component';

@NgModule({
  declarations: [BasicComponent, BorderComponent, SizingComponent, StylingComponent, BasicNgxDatatableComponent],
  imports: [
    CommonModule,
    TablesRoutingModule,
    NgbModule
    // NgxDatatableModule,
  ]
})
export class TablesModule { }
