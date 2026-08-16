import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from "../../shared/shared.module";

import { SocialAppRoutingModule } from './social-app-routing.module';
import { SocialAppComponent } from './social-app.component';
import 'hammerjs';
import 'mousetrap';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { TabsModule } from 'ngx-tabset';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';


@NgModule({
  declarations: [SocialAppComponent, ImageGalleryComponent],
  imports: [
    CommonModule,
    SocialAppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SharedModule,
    GalleryModule,
    LightboxModule,
    TabsModule.forRoot()
  ]
})
export class SocialAppModule {
}
