import { Component, AfterViewChecked, ViewChildren, QueryList } from '@angular/core';
import * as chartData from './../../../shared/data/dashboard/server';
import { SERVERDB, serverDB } from '../../../shared/data/tables/server';
import { TableService } from 'src/app/shared/services/table.service';
import { NgbdSortableHeader, SortEvent } from 'src/app/shared/directives/NgbdSortableHeader';
import 'chartjs-plugin-streaming';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss']
})
export class ServerComponent implements AfterViewChecked {
  public explorer = [];
  public selected = [];

  public tableItem$: Observable<serverDB[]>;
  public searchText;
  total$: Observable<number>;

  constructor(public service: TableService) {
    this.tableItem$ = service.tableItem$;
    this.total$ = service.total$;
    this.service.setUserData(SERVERDB)
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

  

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', 'assets/data/tables/explorer.json');
    req.onload = () => {
      cb(JSON.parse(req.response));
    };
    req.send();
  }

  public settings = {
    columns: {
      name: {
        title: 'Name'
      },
      user: {
        title: 'User Name',
        type: 'html',
      },
      IO: {
        title: 'IO'
      },
      cpu: {
        title: 'CPU'
      },
      mem: {
        title: 'MEM'
      }
    }
  }; 

  ngAfterViewChecked() {}

  public latencyChartType = chartData.cpuChartType;
  public latencyChartLabels = chartData.latencyChartLabels;
  public latencyChartData = chartData.latencyChartData;
  public latencyChartOptions = chartData.latencyChartOptions;
  public latencyChartColors = chartData.latencyChartColors;
  public latencyChartLegend = chartData.latencyChartLegend;

  public memoryChartType = chartData.memoryChartType;
  public memoryChartLabels = chartData.memoryChartLabels;
  public memoryChartData = chartData.memoryChartData;
  public memoryChartOptions = chartData.memoryChartOptions;
  public memoryChartColors = chartData.memoryChartColors;
  public memoryChartLegend = chartData.memoryChartLegend;

  public cpuChartType = chartData.cpuChartType;
  public cpuChartLabels = chartData.cpuChartLabels;
  public cpuChartData = chartData.cpuChartData;
  public cpuChartOptions = chartData.cpuChartOptions;
  public cpuChartColors = chartData.cpuChartColors;
  public cpuChartLegend = chartData.cpuChartLegend;
}
