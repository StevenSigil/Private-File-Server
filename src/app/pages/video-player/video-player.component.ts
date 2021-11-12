import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  PathfinderService,
  videoFilePath,
} from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit {
  videoReady: boolean = false;
  videoFilePath: typeof videoFilePath = videoFilePath;
  vPath: string = '';

  constructor(
    private pathFinderService: PathfinderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.videoReady = false;
    this.sessionFromURL();
    this.getVideoStream();
  }

  sessionFromURL() {
    return this.route.params
      .subscribe((params) => {
        this.vPath = params.videoPath;
        this.videoFilePath =
          videoFilePath +
          '/' +
          this.vPath.replace(/(\/|\\\\|\\)/g, String('%5C'));
      })
      .unsubscribe();
  }

  getVideoStream() {
    const x = this.pathFinderService.getVideoFile(this.vPath).subscribe(
      (res) => {
        this.videoReady = true;
        console.log(res);
      },
      (err) => {
        console.warn(err);
        // this.videoReady = true;
      },
      () => {
        console.log('HTTP request completed.');
      }
    );
  }
}
