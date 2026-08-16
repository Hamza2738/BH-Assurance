import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from "../../shared/shared.module";

import { TimelineRoutingModule } from './timeline-routing.module';
import { Timeline1Component } from './timeline1/timeline1.component';

@NgModule({
  declarations: [Timeline1Component],
  imports: [
    CommonModule,
    TimelineRoutingModule,
    SharedModule
  ]
})
export class TimelineModule { }
