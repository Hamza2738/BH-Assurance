import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountToModule } from 'angular-count-to';
import { FormsModule } from '@angular/forms';
import { SupportTicketRoutingModule } from './support-ticket-routing.module';
import { SupportTicketComponent } from './support-ticket.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [SupportTicketComponent],
  imports: [
    CommonModule,
    SupportTicketRoutingModule,
    CountToModule,
    FormsModule,
    SharedModule,
    NgbModule
   ],
   schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class SupportTicketModule { }
