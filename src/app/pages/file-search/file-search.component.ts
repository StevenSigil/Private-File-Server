import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { PathfinderService } from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-file-search',
  templateUrl: './file-search.component.html',
  styleUrls: ['./file-search.component.scss'],
})
export class FileSearchComponent implements OnInit {
  directoryResult: any | undefined;
  objectKeys = Object.keys;
  // files: any;
  // path: any;

  pathForm = this.formBuilder.group({
    path: '',
  });

  constructor(
    private pathfinderService: PathfinderService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    // this.messages = this.pathfinderService.getFiles();
    this.pathForm.value.path = 'C:/Users/Steve/Desktop';
    this.getFiles();
  }

  getFiles(): void {
    console.log('\n\nYour path has been submitted: ', this.pathForm.value.path);
    this.pathfinderService
      .getFiles2(this.pathForm.value.path)
      .subscribe((res) => {
        console.log(res);
        this.directoryResult = res;
      });
    this.pathForm.reset();
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

  // getFiles(newPath: string) {
  //   this.pathfinderService.getFiles2(newPath).subscribe((res) => {
  //     this.directoryResult = res;
  //   });
  // }
}
