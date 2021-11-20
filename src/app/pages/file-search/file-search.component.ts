import { Attribute, Component, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormControl } from '@angular/forms';
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
  pathForm = this.formBuilder.group({
    path: '',
  });
  sessionForm = this.formBuilder.group({
    sessionName: [''],
    sessionType: 'movies',
  });

  sessionTypeOpts: string[] = ['Movies', 'Images', 'General'];
  formattedSubmissionName: string | undefined;
  formattedSubmissionType: string | undefined =
    this.sessionForm.value.sessionType || '';

  customAlert: CustomAlertInterface = {
    heading: 'ERROR',
    message: 'An error has occured!',
    type: 'error',
    show: false,
  };

  directoryResult: FileSearchInterface | FileSearchErrorInterface | any;

  modalIsOpen: boolean = false;
  hasSubmitted: boolean = false;
  submissionFormatErr: boolean = false;
  isLoading: boolean = false;
  alertTimeout: any;

  normalizeFromCamel = normalizeFromCamel;
  objectKeys = Object.keys;

  constructor(
    private pathfinderService: PathfinderService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.pathForm.value.path = 'D:/' || 'C:/Users/Steve/Desktop/css_test'; // DELETE ME
    this.getFiles(); // DELETE ME

    this.sessionForm.get('sessionType')?.disable(); // Delete when more options
  }

  isChecked(value: string) {
    if (value == 'Movies') {
      return true;
    }
    return false;
  }

  handleSessionModalReset() {
    this.sessionForm.reset();
    this.sessionForm.get('sessionName')?.enable();
    this.sessionForm.get('sessionType')?.enable();
    this.formattedSubmissionName = undefined;
    this.formattedSubmissionType = 'movies';
    this.submissionFormatErr = false;
    this.hasSubmitted = false;
    // console.log('Variables have reset...');
  }

  submitSessionName(): void {
    if (!this.hasSubmitted && this.sessionForm.value.sessionName) {
      // Not submitted -> check & change formatting -> alert user of change OR start function again

      this.sessionForm.get('sessionName')?.disable();
      this.sessionForm.get('sessionType')?.disable();
      this.hasSubmitted = true;
      const inputData = this.sessionForm.value;

      this.formattedSubmissionName = this.formatSessionName(
        inputData.sessionName
      );
      this.formattedSubmissionType = this.formatSessionName(
        inputData.sessionType
      );

      if (this.formattedSubmissionName != inputData.sessionName) {
        // Alert user of change to session name
        this.submissionFormatErr = true;
      }

      // Start function again and should go straight to "else" block...
      return this.submitSessionName();
    } else {
      // Formatting is OK -> User confirms info or backs out...
      console.log(
        'FORMATTED INPUT DATA: ',
        this.formattedSubmissionName,
        this.formattedSubmissionType
      );
    }
  }

  handleFinalSessionSetupSubmit() {
    this.isLoading = true;
    const directory = this.directoryResult.directory;
    const sessionName = this.formattedSubmissionName;
    const fileType = this.formattedSubmissionType;

    const reqBody = {
      path: directory,
      sessionName: sessionName,
      type: fileType,
    };

    this.pathfinderService.createSession(JSON.stringify(reqBody)).subscribe(
      (res) => {
        this.isLoading = false;
        this.handleSessionModalReset();
        console.log('\nhandleFinalSessionSubmit RESPONSE', res);

        // ====================================================
        // ======================= TODO =======================
        //        TODO: Advance the User to next page!
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
            'Session already exists. Please choose a different name and try again.',
            'error',
            'Error!'
          );
        }
        // console.warn('\nERROR', err);
      },
      () => {
        this.isLoading = false;
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

  // .replace(/[^\w\d\s]+/g, ' ').replace(/(\b[a-z])/g, (l) => l.toUpperCase()).replace(/(^[\w])/g, (l) => l.toLowerCase()).replace(/\s/g, '')

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

  // test() {
  //   this.pathfinderService.testService().subscribe(
  //     (res: any) => console.log("\nRESPONSE FROM 'test()'\n", res),
  //     (err) => {
  //       console.error("\nERROR FROM 'test()'\n", err);
  //       this.directoryResult = err.error;
  //     },
  //     () => console.log("'test()' function complete!")
  //   );
  // }
  //
  // pathfinder.testService() BEFORE CHANGE:
  // testService() {
  //     return this.http
  //     .get(`${Constants.API_ENDPOINT}/test`)
  //     .pipe(catchError(this.handleError));
  // }
}
