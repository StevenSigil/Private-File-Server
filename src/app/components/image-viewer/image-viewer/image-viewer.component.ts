import { Component, OnInit, Input } from '@angular/core';
import { ImageDataInterface } from 'src/app/config/interfaces/sessions-interface';

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss'],
})
export class ImageViewerComponent implements OnInit {
  @Input() imageData: ImageDataInterface | undefined;
  @Input() show: boolean = false;
  @Input() toggleImageViewer!: (viewerData?: any, show?: any) => void;

  constructor() {}

  ngOnInit(): void {}
}
