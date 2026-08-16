import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Timeline1Component } from './timeline1/timeline1.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'timeline1',
        component: Timeline1Component,
        data: {
          title: "Timeline1",
          breadcrumb: "Timeline1"
        }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimelineRoutingModule { }
