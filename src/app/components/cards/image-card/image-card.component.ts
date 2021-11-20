import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
  SessionErrorInterface,
  SessionsInterface,
  MovieDataInterface,
  ImageDataInterface,
} from 'src/app/config/interfaces/sessions-interface';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss'],
})
export class ImageCardComponent implements OnInit {
  @Input() imageData?: ImageDataInterface | any;
  @Input() sessionData?: SessionsInterface | SessionErrorInterface | any;
  @Input() urlSession: any;

  matchInfoClickData: ImageDataInterface | MovieDataInterface | any;
  showMatchInfo: boolean = false;

  imageViewerData: ImageDataInterface | undefined;
  showImgViewer: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  joinPathAndNavigate(destPath: string, endFile: string) {
    const fullPath = /(\\\\|\\|\/)$/.test(destPath)
      ? destPath + endFile
      : destPath + `\\${endFile}`;
    this.router.navigate(['session', this.urlSession, 'video', fullPath]);
  }

  setAndToggleMatchPopOver(
    data?: ImageDataInterface | MovieDataInterface,
    show?: boolean
  ): void {
    this.matchInfoClickData = data;
    this.showMatchInfo = show ? show : !this.showMatchInfo;
  }

  toggleImageViewer = (
    viewerData?: ImageDataInterface | undefined,
    show?: boolean
  ): void => {
    this.imageViewerData = viewerData ? viewerData : undefined;
    this.showImgViewer = show ? show : !this.showImgViewer;

    console.log(show, this.showImgViewer);
  };
}
