import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import {
  ImageDataInterface,
  MovieDataInterface,
  SessionErrorInterface,
  SessionsInterface,
} from 'src/app/config/interfaces/sessions-interface';
import {
  imageFilePath,
  PathfinderService,
} from 'src/app/services/pathfinder.service';
import { normalizeFileName, normalizeFromCamel } from 'src/app/util/text';

export interface transformedMovieInterface {
  name: string;
  value: any;
}

@Component({
  selector: 'app-session-browser',
  templateUrl: './session-browser.component.html',
  styleUrls: ['./session-browser.component.scss'],
})
export class SessionBrowserComponent implements OnInit {
  urlSession: any | undefined;
  sessionData: SessionsInterface | SessionErrorInterface | any;
  showSessionsData: boolean = false;

  matchInfoClickData: ImageDataInterface | MovieDataInterface | any;
  showMatchInfo: boolean = false;

  imageViewerData: ImageDataInterface | undefined;
  showImgViewer: boolean = false;

  viewingTab: string = 'Movies';
  availableTabs: string[] = [];

  infoSelected: transformedMovieInterface[] | undefined;

  normalizeFromCamel = normalizeFromCamel;
  objectKeys = Object.keys;

  constructor(
    private route: ActivatedRoute,
    private pathFinderService: PathfinderService // private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionFromURL();
  }

  nameValueObj(obj: any, typeVal: any | undefined) {
    const returnList = [];

    for (let k of Object.keys(obj)) {
      let val = obj[k];

      if (val instanceof Object && !Array.isArray(val)) {
        const subObj = this.nameValueObj(val, undefined);
        subObj.forEach((o) => returnList.push(o));
        //
      } else {
        val = /.\,./g.test(val) ? val.toString().replace(/(.)\,(.)/g, '$1, $2') : val;
        console.log('VAL', val);

        const tempObj = typeVal
          ? { name: k, value: val, type: typeVal }
          : { name: k, value: val };

        returnList.push(tempObj);
      }
    }
    return returnList;
  }

  setAndToggleInfoSelection(fileData: MovieDataInterface | undefined) {
    if (fileData !== undefined) {
      const idx = this.sessionData.movieData.findIndex(
        (d: MovieDataInterface) => d.id == fileData.id
      );
      this.infoSelected = this.nameValueObj(
        this.sessionData.movieData[idx],
        undefined
      );
    } else {
      this.infoSelected = fileData;
    }
    console.log(this.infoSelected);
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

  sessionFromURL() {
    return this.route.params
      .subscribe((params) => {
        this.urlSession = params.session;
        this.getSession();
      })
      .unsubscribe();
  }

  addTabToAvailableTabs(tabName: string): void {
    this.availableTabs.push(tabName);
  }
  switchTab(tabToSwitch: string): void {
    this.viewingTab = tabToSwitch;
    console.log('VIEWING TAB\t', this.viewingTab);
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
            this.viewingTab = 'Movies';
            this.addTabToAvailableTabs('Movies');
          }
        },
        (err: SessionErrorInterface) => {
          this.sessionData = err;
        },
        () => {
          console.log('HTTP request complete\n');
          this.getImageFiles(this.sessionData.directoryContent.files);
        }
      );
    }
    return console.error('"urlSession" is undefined!');
  }

  toggleSessionsData() {
    this.showSessionsData = !this.showSessionsData;
    console.log(this.showSessionsData);
  }

  checkForVideoFiles(files: string[]) {
    const videoFormats = [
      '.WEBM',
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
      '.AVCHD',
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
      (res) => {
        // Add video file data to "sessionData"
        this.sessionData.movieData = res;
        console.log('getVideoFileDetails RESPONSE:\n\t', res);
      },
      (err) => console.warn('getVideoFileDetails ERROR:\n', err),
      () => null // console.log('getVideoFileDetails FINAL:\tHTTP Request Complete')
    );
  }

  getImageFiles(files: string[]) {
    const imageFiles = this.checkForImageFiles(files);
    const data: object[] | undefined = [];

    // cleanup filename to use as display name
    imageFiles.forEach((file, i, imageFiles) => {
      setTimeout(() => {
        const newName = normalizeFileName(file);
        var pathToImgFile = this.sessionData.directoryPath + '\\' + file;
        pathToImgFile = pathToImgFile.replace(/\\+|\/+/g, '%5C');

        data.push({
          title: newName,
          fileName: file,
          url: imageFilePath + `/${pathToImgFile}`,
        });
      }, i * 150);
    });

    // Add image file data to sessionData
    this.sessionData.imageData = data;

    if (imageFiles.length > 0) {
      this.addTabToAvailableTabs('Images');
    }
  }

  checkForImageFiles(files: string[]) {
    const imageFormats = [
      '.JPG',
      '.PNG',
      '.GIF',
      '.WEBP',
      '.TIFF',
      '.PSD',
      '.RAW',
      '.BMP',
      '.HEIF',
      '.INDD',
      '.JPEG 2000',
      '.SVG',
    ];

    const imageFiles: string[] = [];
    files.forEach((file) => {
      // Get file extension
      let ext = '';
      const m = file.match(/\.(\w|\d)+$/gi);

      if (m) {
        // match extension to list of video formats & if matched, return filename
        ext = m[0];
        if (imageFormats.some((f) => f.toUpperCase() == ext.toUpperCase())) {
          imageFiles.push(file);
          return;
        }
      } else return;
    });
    console.log('IMAGE FILES:', imageFiles);
    return imageFiles;
  }

  // joinPathAndNavigate(destPath: string, endFile: string) {
  //   const fullPath = /(\\\\|\\|\/)$/.test(destPath)
  //     ? destPath + endFile
  //     : destPath + `\\${endFile}`;
  //   this.router.navigate(['session', this.urlSession, 'video', fullPath]);
  //   //
  // }
}

// USE https://api.tvmaze.com/ FOR TV SHOW QUERY'S
// USE https://itunes.apple.com/search? FOR ALMOST ANYTHING! (restricted to 20 calls/minute)
//    - DOCS: https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/
// WIKIPEDIA TOO: https://en.wikipedia.org/wiki/Special:ApiSandbox
