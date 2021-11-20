import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
  SessionErrorInterface,
  SessionsInterface,
  MovieDataInterface,
  ImageDataInterface,
} from 'src/app/config/interfaces/sessions-interface';

@Component({
  selector: 'app-movie-card',
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.scss'],
})
export class MovieCardComponent implements OnInit {
  @Input() movieData?: MovieDataInterface | any;
  @Input() sessionData?: SessionsInterface | SessionErrorInterface | any;
  @Input() urlSession: any;

  matchInfoClickData: ImageDataInterface | MovieDataInterface | any;
  showMatchInfo: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  joinPathAndNavigate(destPath: string, endFile: string) {
    const fullPath = /(\\\\|\\|\/)$/.test(destPath)
      ? destPath + endFile
      : destPath + `\\${endFile}`;
    this.router.navigate(['session', this.urlSession, 'video', fullPath]);
    //
  }

  setAndToggleMatchPopOver(
    data?: ImageDataInterface | MovieDataInterface,
    show?: boolean
  ): void {
    this.matchInfoClickData = data;
    this.showMatchInfo = show ? show : !this.showMatchInfo;
  }
}
