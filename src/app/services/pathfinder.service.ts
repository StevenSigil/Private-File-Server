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
import {
  SessionsInterface,
  SessionErrorInterface,
} from '../config/interfaces/sessions-interface';

export const directoryPath = `${Constants.API_ENDPOINT}/directory`;
export const videoFilePath = `${Constants.API_ENDPOINT}/video`;
// export const createSessionFilePath = `${Constants.API_ENDPOINT}/create-session-file`;
export const newSessionPath = `${Constants.API_ENDPOINT}/new-session`;
export const allSessionsPath = `${Constants.API_ENDPOINT}/all-sessions-data`;
export const sessionDataPath = `${Constants.API_ENDPOINT}/session-data`;
export const movieDataPath = `${Constants.API_ENDPOINT}/movie-data`;

@Injectable({
  providedIn: 'root',
})
export class PathfinderService {
  constructor(private http: HttpClient) {}

  getMovieData(moviesToMatch: string[]) {
    const sendData = { movieFiles: moviesToMatch };
    return this.http
      .post(movieDataPath, sendData)
      .pipe(catchError(this.handleError));
  }

  getSessionData(sessionName: string): Observable<SessionsInterface> {
    return this.http
      .get<SessionsInterface>(sessionDataPath, {
        params: { sessionName },
      })
      .pipe(catchError(this.handleError));
  }

  getMasterSessionData() {
    return this.http.get(allSessionsPath).pipe(catchError(this.handleError));
  }

  createSession(path: string) {
    return this.http
      .post(newSessionPath, JSON.parse(path))
      .pipe(catchError(this.handleError));
  }

  getSubDir(path: string) {
    return this.http
      .get<FileSearchInterface>(`${Constants.API_ENDPOINT}/directory2`, {
        params: { path },
      })
      .pipe(catchError(this.handleError));
  }

  getVideoFile(path: string | any) {
    if (path) {
      path = path.replace(/(\\\\|\\|\/\/)/g, '%5C');
    }

    return this.http
      .get(videoFilePath + `/${path}`, {
        headers: new HttpHeaders({ Accept: 'video/mp4', Range: 'bytes=0-' }),
        responseType: 'arraybuffer',
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  /** Sends a GET request to ".../api/test" */
  testService() {
    return this.http
      .get(`${Constants.API_ENDPOINT}/test`)
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
