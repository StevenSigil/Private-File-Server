import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovieDataInterface } from 'src/app/config/interfaces/sessions-interface';
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
  sessionName!: string;
  vPath!: string;

  movieData: MovieDataInterface | any;

  videoReady: boolean = false;
  videoSrcPath: typeof videoFilePath = videoFilePath;

  constructor(
    private pathFinderService: PathfinderService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.videoReady = false;
    this.getURLParams();
    this.getVideoStream();
    this.getMovieDetails();
  }

  back() {
    this.location.back();
  }

  getURLParams() {
    return this.route.params
      .subscribe((params) => {
        this.sessionName = params.session;
        this.vPath = params.videoPath;

        this.videoSrcPath =
          videoFilePath + '/' + this.vPath.replace(/(\/|\\+)/g, String('%5C'));
      })
      .unsubscribe();
  }

  getMovieDetails() {
    console.log(this.vPath, this.sessionName);

    // get vFile name from url path
    let fileName: any = this.vPath.match(/(\\+|\/+)[^\\+|\/+]*$/g);

    if (fileName.length === 1) {
      fileName = fileName[0].replace(/(\\+|\/+)/g, '');
      console.log(fileName);

      // Subscribe to "getMovieData" to get the current viewing video details
      this.pathFinderService.getMovieData(fileName).subscribe(
        (res) => {
          console.log(res);

          this.movieData = Array.isArray(res) ? res[0] : null;
        },
        (err) => err(err),
        () => console.log('Subscribed to GetMovieData!')
      );
    }
  }

  getVideoStream() {
    this.pathFinderService.getVideoFile(this.vPath).subscribe(
      (res) => {
        this.videoReady = true;
      },
      (err) => {
        console.warn(err);
      },
      () => {
        console.log('HTTP request completed.');
      }
    );
  }
}
