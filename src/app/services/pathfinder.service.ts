import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Constants } from '../config/constants';

const httpOpts = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

const directoryPath = `${Constants.API_ENDPOINT}/directory`;

@Injectable({
  providedIn: 'root',
})
export class PathfinderService {
  constructor(private http: HttpClient) {}

  getFiles() {
    return this.http.get(directoryPath, httpOpts);
  }

  getFiles2(path: string) {
    return this.http.get(directoryPath + `?path=${path}`);
    // return this.http.get(`${Constants.API_ENDPOINT}/t?path=${path}`);
  }
}
