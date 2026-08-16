import { Component, ViewEncapsulation } from '@angular/core';
import * as chartData from '../../../shared/data/chart/chartjs';

@Component({
  selector: 'app-chartjs',
  templateUrl: './chartjs.component.html',
  styleUrls: ['./chartjs.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ChartjsComponent {

  constructor() { }

  // barChart
  public barChartOptions = chartData.barChartOptions;
  public barChartLabels = chartData.barChartLabels;
  public barChartType = chartData.barChartType;
  public barChartLegend = chartData.barChartLegend;
  public barChartData = chartData.barChartData;
  public barChartColors = chartData.barChartColors;

  // lineGraph Chart
  public lineGraphOptions = chartData.lineGraphOptions;
  public lineGraphLabels = chartData.lineGraphLabels;
  public lineGraphType = chartData.lineGraphType;
  public lineGraphLegend = chartData.lineGraphLegend;
  public lineGraphData = chartData.lineGraphData;
  public lineGraphColors = chartData.lineGraphColors;

  // radarGraph Chart
  public radarGraphOptions = chartData.radarGraphOptions;
  public radarGraphLabels = chartData.radarGraphLabels;
  public radarGraphType = chartData.radarGraphType;
  public radarGraphLegend = chartData.radarGraphLegend;
  public radarGraphData = chartData.radarGraphData;
  public radarGraphColors = chartData.radarGraphColors;

  // lineChart
  public lineChartData = chartData.lineChartData;
  public lineChartLabels = chartData.lineChartLabels;
  public lineChartOptions = chartData.lineChartOptions;
  public lineChartColors = chartData.lineChartColors;
  public lineChartLegend = chartData.lineChartLegend;
  public lineChartType = chartData.lineChartType;

  // events
  public chartClicked(e:any):void {  }
 
  public chartHovered(e:any):void { }


}
