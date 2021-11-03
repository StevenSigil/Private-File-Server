import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { Constants } from '../config/constants';
import { FileSearchInterface } from '../config/interfaces/file-search-interface';

const httpOpts = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export const directoryPath = `${Constants.API_ENDPOINT}/directory`;
export const videoFilePath = `${Constants.API_ENDPOINT}/video`;

@Injectable({
  providedIn: 'root',
})
export class PathfinderService {
  constructor(private http: HttpClient) {}

  getSubDir(path: string) {
    console.log('\n================\ngetSubDir');

    return this.http
      .get<FileSearchInterface>(`${Constants.API_ENDPOINT}/directory2`, {
        params: { path },
      })
      .pipe(catchError(this.handleError));
  }

  getFiles2(path: string) {
    return this.http
      .get<FileSearchInterface>(directoryPath + `?path=${path}`)
      .pipe(catchError(this.handleError));
  }

  getVideoFile(path: string | any) {
    console.log('Requesting from ', videoFilePath);

    return this.http
      .get(videoFilePath, {
        headers: new HttpHeaders({ Accept: 'video/*' }),
        responseType: 'arraybuffer',
        params: {
          path: 'C:/Users/Steve/Desktop/css_test/JOJO_Rabbit.mp4',
        },
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // Client side error
      return throwError('An error occurred (client-side): ', error.error);
    } else {
      // Unsuccessful response code from server
      console.warn(error);
      console.error(
        `Server returned code ${error.status}, body was:\n`,
        error.error
      );
      return throwError(error);
    }
  }
}
