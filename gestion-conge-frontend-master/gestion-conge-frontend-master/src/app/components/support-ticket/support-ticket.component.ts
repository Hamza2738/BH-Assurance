import { Component, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { NgbdSortableHeader, SortEvent } from 'src/app/shared/directives/NgbdSortableHeader';
import { TableService } from 'src/app/shared/services/table.service';
import { supportDB,SUPPORTDB } from 'src/app/shared/data/tables/support-ticket';


@Component({
  selector: 'app-support-ticket',
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SupportTicketComponent implements OnInit {

  public selected = [];

  public tableItem$: Observable<supportDB[]>;
  public searchText;
  total$: Observable<number>;

  constructor(public service: TableService) {

    this.tableItem$ = service.tableItem$;
    this.total$ = service.total$;
    this.service.setUserData(SUPPORTDB)

  }



  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    this.service.sortColumn = column;
    this.service.sortDirection = direction;

  }

  public onSelect(selected) {
    this.service.deleteSingleData(selected);
}


  ngOnInit() {
    console.log("selected", this.tableItem$);
  }

}
