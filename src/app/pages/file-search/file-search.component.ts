import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  FileSearchErrorInterface,
  FileSearchInterface,
} from 'src/app/config/interfaces/file-search-interface';

import { PathfinderService } from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss'],
})
export class FileSearchComponent implements OnInit {
  directoryResult: FileSearchInterface | FileSearchErrorInterface | any;

  objectKeys = Object.keys;
  pathForm = this.formBuilder.group({
    path: '',
  });

  constructor(
    private pathfinderService: PathfinderService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.pathForm.value.path = 'C:/Users/Steve/Desktop';
    this.getFiles();
  }

  t(): void {
    const formCard = document.getElementById('fileDirForm');
    const selectedPathCard = document.getElementById('selectedPathCard');

    if (selectedPathCard && formCard) {
      console.log('====================================');
      console.log(formCard.clientHeight);
      console.log('====================================');

      selectedPathCard.style.height = formCard.clientHeight.toString() + 'px';
    }
    return;
  }

  getFiles(): void {
    const origPath = this.pathForm.value.path;
    console.log(`\n\nPath submitted...\n ${origPath}`);

    // Cleanup input before sending request
    var cleanedPath = String(origPath).trim();

    // replaces  \  or  \\  with  /  then remove trailing  /
    cleanedPath = cleanedPath.replace(/\\{1,}/g, '/').replace(/\/+$/, '');

    this.pathfinderService.getFiles2(cleanedPath).subscribe(
      (res: FileSearchInterface) => {
        console.log(res);
        this.directoryResult = res;
      },
      (err: FileSearchErrorInterface) => {
        console.error(err);
        this.directoryResult = err;
      },
      () => console.log('HTTP request completed.')
    );
    this.pathForm.reset();
    return;
  }

  getSubFolders(folderName: string): void {
    const currPath = this.directoryResult.directory;
    const newPath = `${currPath}/${folderName}`;

    console.log('\n\nYour path has been submitted: ', newPath);

    this.pathfinderService.getFiles2(newPath).subscribe((res) => {
      console.log(res);
      this.directoryResult = res;
    });

    this.pathForm.reset();
  }

  normalizeText(text: string) {
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
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
}
