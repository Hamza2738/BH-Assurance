import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Gallery, GalleryItem, ImageItem, ImageSize, ThumbnailsPosition } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';

@Component({
  selector: 'app-hover-effect',
  templateUrl: './hover-effect.component.html',
  styleUrls: ['./hover-effect.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HoverEffectComponent implements OnInit {

 
  items: GalleryItem[];

  imageData = data;

  constructor(public gallery: Gallery, public lightbox: Lightbox) {
  }

  ngOnInit() {

    /** Basic Gallery Example */

    // Creat gallery items
    this.items = this.imageData.map(item => new ImageItem({ src: item.srcUrl, thumb: item.previewUrl }));


    /** Lightbox Example */

    // Get a lightbox gallery ref
    const lightboxRef = this.gallery.ref('lightbox');

    // Add custom gallery config to the lightbox (optional)
    lightboxRef.setConfig({
      imageSize: ImageSize.Cover,
      thumbPosition: ThumbnailsPosition.Top
    });

    // Load items into the lightbox gallery ref
    lightboxRef.load(this.items);
  }

}

const data = [
  {
    srcUrl: 'assets/images/lightgallry/08.jpg',
    previewUrl: 'assets/images/lightgallry/08.jpg'
  },
  {
    srcUrl: 'assets/images/lightgallry/010.jpg',
    previewUrl: 'assets/images/lightgallry/010.jpg'
  },
  {
    srcUrl: 'assets/images/lightgallry/011.jpg',
    previewUrl: 'assets/images/lightgallry/011.jpg'
  },
  {
    srcUrl: 'assets/images/lightgallry/010.jpg',
    previewUrl: 'assets/images/lightgallry/010.jpg'
  }
]
