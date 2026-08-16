import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardsRoutingModule } from './cards-routing.module';
import { DragulaModule } from 'ng2-dragula';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { BasicComponent } from './basic/basic.component';
import { CreativeComponent } from './creative/creative.component';
import { TabbedComponent } from './tabbed/tabbed.component';
import { DraggableComponent } from './draggable/draggable.component';
import { TabsModule } from 'ngx-tabset';

@NgModule({
  declarations: [BasicComponent, CreativeComponent, TabbedComponent, DraggableComponent],
  imports: [
    CommonModule,
    CardsRoutingModule,
    DragulaModule.forRoot(),
    TabsModule.forRoot(),
    NgbModule
  ]
})
export class CardsModule { }
