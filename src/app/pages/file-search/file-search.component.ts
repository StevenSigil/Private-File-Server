import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  FileSearchErrorInterface,
  FileSearchInterface,
} from 'src/app/config/interfaces/file-search-interface';
import { normalizeFromCamel } from 'src/app/util/text';

import { PathfinderService } from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss'],
})
export class FileSearchComponent implements OnInit {
  directoryResult: FileSearchInterface | FileSearchErrorInterface | any;
  normalizeFromCamel = normalizeFromCamel;

  objectKeys = Object.keys;
  pathForm = this.formBuilder.group({
    path: '',
  });

  constructor(
    private pathfinderService: PathfinderService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.pathForm.value.path = 'C:/Users/Steve/Desktop'; // DELETE ME
    this.getFiles(); // DELETE ME
  }

  getFiles(reqPath?: string): void {
    const origPath = this.pathForm.value.path;
    console.log(`\n\nPath submitted...\n ${origPath}`);
    var cleanedPath = reqPath
      ? this.cleanPath(reqPath)
      : this.cleanPath(origPath);

    this.pathfinderService.getSubDir(cleanedPath).subscribe(
      (res: FileSearchInterface) => {
        console.log(res);
        this.directoryResult = res;
        this.directoryResult.splitDirectory = res.directory
          .replace(/\/$/, '')
          .split('/');
      },
      (err: FileSearchErrorInterface) => {
        console.error(err);
        this.directoryResult = err.error;
      },
      () => console.log('HTTP request completed.')
    );
    this.pathForm.reset();
    return;
  }

  /**
   * @description Cleans and adds *folderName* to the *directoryResult.directory* path and
   *              calls *this.getFiles* api call.
   * @param folderName Part of file to concat with base path string
   */
  getSubDir(folderName: string): void {
    console.log(folderName);

    let curPath = this.directoryResult.directory;
    curPath = curPath.replace(/(\/|\\|\\\\)$/, '') + '/';
    const submitPath = curPath + folderName;
    this.getFiles(submitPath);
  }

  /**
   * @description Trims the *directoryResult.directory* path up to *clickVal*
   *              then calls *this.getFiles* api call.
   * @example
   * navUpFromPathVal('Users')  // 'C:/Users'
   */
  navUpFromPathVal(clickVal: string) {
    const curPath = this.directoryResult.directory;

    const r = new RegExp(`^.*${clickVal}`);
    const newPath = curPath.match(r);

    this.getFiles(newPath ? newPath[0] : curPath);
  }

  cleanPath(path: string) {
    return path
      .trim()
      .replace(/\\{1,}/g, '/')
      .replace(/\/+$/, '');
  }
  getFileExtension(fileName: string) {
    const extension = fileName.match(/\.\w+$/);
    return extension;
  }
  removeFileExtension(fileName: string) {
    var altered = fileName;
    altered = /\.\w+$/.test(altered) ? altered.replace(/\.\w+$/, '') : '';
    return altered;
  }
  regexTest(re: string, tester: string) {
    const reg = new RegExp(re);
    return reg.test(tester);
  }
}
