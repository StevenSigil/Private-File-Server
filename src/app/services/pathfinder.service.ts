import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { Constants } from '../config/constants';
import { FileSearchInterface } from '../config/interfaces/file-search-interface';

const httpOpts = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

const directoryPath = `${Constants.API_ENDPOINT}/directory`;
const videoFilePath = `${Constants.API_ENDPOINT}/file-finder`;

@Injectable({
  providedIn: 'root',
})
export class PathfinderService {
  constructor(private http: HttpClient) {}

  getFiles() {
    return this.http.get(directoryPath, httpOpts);
  }

  getFiles2(path: string) {
    return this.http
      .get<FileSearchInterface>(directoryPath + `?path=${path}`)
      .pipe(catchError(this.handleError));
  }

  getVideoFile(path: string | any) {
    console.log('Requesting from ', videoFilePath);

    return this.http
      .get(
        videoFilePath +'?path=C:/Users/Steve/Desktop/css_test/Shaun%20of%20the%20Dead.mp4',
        {
          headers: new HttpHeaders({
            Accept: '*',
          }),
        }
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // Client side error
      console.error('An error occurred (client-side): ', error.error);
    } else {
      // Unsuccessful response code from server
      console.warn(error);
      console.error(
        `Server returned code ${error.status}, body was:\n`,
        error.error
      );
    }

    return throwError(error.error);
  }
}
