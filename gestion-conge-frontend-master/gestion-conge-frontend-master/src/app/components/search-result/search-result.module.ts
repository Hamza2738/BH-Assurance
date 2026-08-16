import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'hammerjs';
import 'mousetrap';

import { SearchResultRoutingModule } from './search-result-routing.module';
import { SearchResultComponent } from './search-result.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { TabsModule } from 'ngx-tabset';
import { LightboxModule } from 'ng-gallery/lightbox';
import { GalleryModule } from 'ng-gallery';

@NgModule({
  declarations: [SearchResultComponent, ImageGalleryComponent],
  imports: [
    CommonModule,
    SearchResultRoutingModule,
    NgbModule,
    GalleryModule,
    LightboxModule,
    TabsModule.forRoot()
  ]
})
export class SearchResultModule { }
