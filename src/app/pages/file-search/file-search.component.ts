import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  FileSearchErrorInterface,
  FileSearchInterface,
} from 'src/app/config/interfaces/file-search-interface';

import { normalizeFromCamel } from 'src/app/util/text';
import { PathfinderService } from 'src/app/services/pathfinder.service';
import { CustomAlertInterface } from 'src/app/config/interfaces/custom-alert-interface';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss'],
})
export class FileSearchComponent implements OnInit {
  directoryResult: FileSearchInterface | FileSearchErrorInterface | any;
  customAlert: CustomAlertInterface = {
    heading: 'ERROR',
    message: 'An error has occured!',
    type: 'error',
    show: false,
  };

  modalIsOpen: boolean = false;
  hasSubmitted: boolean = false;
  submissionFormatErr: boolean = false;
  formattedSubmissionName: string | undefined;

  isLoading: boolean = false;
  alertTimeout: any;

  normalizeFromCamel = normalizeFromCamel;
  objectKeys = Object.keys;

  pathForm = this.formBuilder.group({
    path: '',
  });
  sessionForm = this.formBuilder.group({
    sessionName: '',
  });

  constructor(
    private pathfinderService: PathfinderService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.pathForm.value.path = 'C:/Users/Steve/Desktop/css_test'; // DELETE ME
    this.getFiles(); // DELETE ME
  }

  handleSessionModalReset() {
    this.sessionForm.reset();
    this.sessionForm.get('sessionName')?.enable();
    this.formattedSubmissionName = undefined;
    this.submissionFormatErr = false;
    this.hasSubmitted = false;
    // console.log('Variables have reset...');
  }

  submitSessionName(): void {
    if (!this.hasSubmitted && this.sessionForm.value.sessionName) {
      // Not submitted -> check & change formatting -> alert user of change OR start function again

      this.sessionForm.get('sessionName')?.disable();
      this.hasSubmitted = true;
      const inputData = this.sessionForm.value.sessionName;
      this.formattedSubmissionName = this.formatSessionName(inputData);
      // console.log('SUBMITTED!', inputData);

      if (this.formattedSubmissionName != inputData) {
        // Alert user of change to session name
        this.submissionFormatErr = true;
      }

      // Start function again and should go straight to "else" block...
      return this.submitSessionName();
    } else {
      // Formatting is OK -> User confirms info or backs out...
      console.log('FORMATTED INPUT DATA: ', this.formattedSubmissionName);
    }
  }

  handleFinalSessionSetupSubmit() {
    this.isLoading = true;
    const directory = this.directoryResult.directory;
    const fileName = this.formattedSubmissionName;

    const reqBody = JSON.stringify({ path: directory, filename: fileName });

    this.pathfinderService.postPathToContinue(reqBody).subscribe(
      (res) => {
        this.isLoading = false;
        this.handleSessionModalReset();
        console.log('\nhandleFinalSessionSubmit RESPONSE', res);

        // ====================================================
        // ======================= TODO =======================
        //     TODO: Progress the User to directory screen
        // ====================================================
        // ====================================================
      },
      (err) => {
        err = err.error;

        this.isLoading = false;
        this.handleSessionModalReset();

        if (err.code && err.code === 'EXISTS') {
          console.log('====================================');
          console.log('EXISTS!');
          console.log('====================================');
          this.throwCustomError(
            'File already exists. Please choose a different name and try again.',
            'error',
            'Error!'
          );
        }
        // console.warn('\nERROR', err);
      },
      () => {
        this.isLoading = false;
        this.handleSessionModalReset();
        console.log('HTTP request completed.');
      }
    );
  }

  throwCustomError(message: string, type: string = 'error', heading?: string) {
    this.customAlert = {
      message: message,
      type: type,
      show: true,
    };
    heading ? (this.customAlert.heading = heading) : null;

    this.alertTimeout = setTimeout(() => {
      this.customAlert.show = false;
    }, 9000);
  }
  cancelCustomError() {
    this.customAlert.show = false;
    window.clearTimeout(this.alertTimeout);
  }

  formatSessionName(txt: string) {
    txt = txt
      .replace(/[^\w\d\s]+/g, ' ') //replace non word, digit, spaces for space
      .replace(/(\b[a-z])/g, (l) => l.toUpperCase()) // capitalize first letters
      .replace(/(^[\w])/g, (l) => l.toLowerCase()) // lowercase first letter in line
      .replace(/\s/g, ''); // combine at spaces
    return txt;
  }

  getFiles(reqPath?: string): void {
    const origPath = this.pathForm.value.path;
    // console.log(`\n\nPath submitted...\n ${origPath}`);
    var cleanedPath = reqPath
      ? this.cleanPath(reqPath)
      : this.cleanPath(origPath);

    this.pathfinderService.getSubDir(cleanedPath).subscribe(
      (res: FileSearchInterface) => {
        console.log('getFiles RESPONSE:\n', res);
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
  navUpFromPathVal(clickVal: string): void {
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

  test() {
    this.pathfinderService.testService().subscribe(
      (res: any) => console.log("\nRESPONSE FROM 'test()'\n", res),
      (err) => {
        console.error("\nERROR FROM 'test()'\n", err);
        this.directoryResult = err.error;
      },
      () => console.log("'test()' function complete!")
    );
  }
}
