import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapRoutingModule } from './map-routing.module';
import { GoogleMapComponent } from './google-map/google-map.component';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { HttpClientModule } from "@angular/common/http";
import { GoogleMapsModule } from "@angular/google-maps";

@NgModule({
  declarations: [GoogleMapComponent, LeafletMapComponent],
  imports: [
    CommonModule,
    MapRoutingModule,
    GoogleMapsModule,
    LeafletModule,
    HttpClientModule,
  ]
})
export class MapModule { }
