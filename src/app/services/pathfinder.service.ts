import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    // console.log(path);
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
