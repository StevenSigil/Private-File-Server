import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
  SessionErrorInterface,
  SessionsInterface,
} from 'src/app/config/interfaces/sessions-interface';
import { PathfinderService } from 'src/app/services/pathfinder.service';
import { normalizeFromCamel } from 'src/app/util/text';

// page loads => use url session name to get session data (api) =>
//  found => check type of session =>
//    "movies" => filter files by file extension to get video files => ...

//    Attempt to match with movies in data/movie_data.json =>                           <-- YOU ARE HERE!!!

//      Matches => render || NO_MATCH => attempt to retrieve from api>externalQuery(ie: wiki) =>
//        SUCCESS => Update data/movie_data.json with new data => next... =>
//          ALL COMPLETED => Re-render video file data

//VIDEO FILE EXTENSIONS: WEBM, .MPG, .MP2, .MPEG, .MPE, .MPV, .OGG, .MP4, .M4P, .M4V, .AVI, .WMV, .MOV, .QT, .FLV, .SWF, AVCHD

@Component({
  selector: 'app-session-browser',
  templateUrl: './session-browser.component.html',
  styleUrls: ['./session-browser.component.scss'],
})
export class SessionBrowserComponent implements OnInit {
  urlSession: any | undefined;
  sessionData: SessionsInterface | SessionErrorInterface | any;
  showSessionsData: boolean = false;

  normalizeFromCamel = normalizeFromCamel;
  objectKeys = Object.keys;

  constructor(
    private route: ActivatedRoute,
    private pathFinderService: PathfinderService
  ) {}

  ngOnInit(): void {
    this.sessionFromURL();
  }

  sessionFromURL() {
    return this.route.params
      .subscribe((params) => {
        this.urlSession = params.session;
        this.getSession();
      })
      .unsubscribe();
  }

  getSession() {
    if (this.urlSession !== undefined) {
      return this.pathFinderService.getSessionData(this.urlSession).subscribe(
        (res: SessionsInterface) => {
          console.log(res);
          this.sessionData = res;

          // If session.type is "movies" -> Get movie data
          if (/movie/gi.test(this.sessionData.type)) {
            this.getVideoFileDetails(this.sessionData.directoryContent.files);
          }
        },
        (err: SessionErrorInterface) => {
          this.sessionData = err;
        },
        () => {
          console.log('HTTP request complete\n');
        }
      );
    }
    return console.error('"urlSession" is undefined!');
  }

  toggleSessionsData() {
    return (this.showSessionsData = !this.showSessionsData);
  }

  checkForVideoFiles(files: string[]) {
    const videoFormats = [
      'WEBM',
      '.MPG',
      '.MP2',
      '.MPEG',
      '.MPE',
      '.MPV',
      '.OGG',
      '.MP4',
      '.M4P',
      '.M4V',
      '.AVI',
      '.WMV',
      '.MOV',
      '.QT',
      '.FLV',
      '.SWF',
      'AVCHD',
    ];

    const videoFiles: string[] = [];
    files.forEach((file) => {
      // Get file extension
      let ext = '';
      const m = file.match(/\.(\w|\d)+$/gi);
      if (m) {
        // match extension to list of video formats & if matched, return filename
        ext = m[0];
        if (videoFormats.some((f) => f.toUpperCase() == ext.toUpperCase())) {
          videoFiles.push(file);
          return;
        }
      } else return;
    });

    return videoFiles;
  }

  getVideoFileDetails(files: string[]) {
    // Get videoFiles from directory
    const videoFiles = this.checkForVideoFiles(files);
    // make api request to retrieve movie info from local doc - movie_data.json
    this.pathFinderService.getMovieData(videoFiles).subscribe(
      (res) => console.log('getVideoFileDetails RESPONSE:\n\t', res),
      (err) => console.warn('getVideoFileDetails ERROR:\n', err),
      () => console.log('getVideoFileDetails FINAL:\tHTTP Request Complete')
    );
  }
}

// USE https://api.tvmaze.com/ FOR TV SHOW QUERY'S
// USE https://itunes.apple.com/search? FOR ALMOST ANYTHING! (restricted to 20 calls/minute)
//    - DOCS: https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/
// WIKIPEDIA TOO: https://en.wikipedia.org/wiki/Special:ApiSandbox
