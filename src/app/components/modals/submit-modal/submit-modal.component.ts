import { Component, OnInit, Input } from '@angular/core';
import { ConfirmationModal } from 'src/app/config/interfaces/modal-interface';

@Component({
  selector: 'app-submit-modal',
  templateUrl: './submit-modal.component.html',
  styleUrls: ['./submit-modal.component.scss'],
})
export class SubmitModalComponent implements OnInit {
  @Input() modalContent: ConfirmationModal | undefined;
  // bodyHTML: any;

  constructor() {}

  ngOnInit(): void {
    this.modalContent = {
      headerText: 'More Information Needed',
      bodyContent: `<h6>What would you like your session to be named?</h6><p>Selected Base Directory: ${'C:/Users/Name/Desktop/etc...'}</p>`,
      confirmBtnText: 'OK',
      cancelBtnText: 'Cancel',
      isShowing: true,
      data: { path: 'C:/Users/Name/Desktop/etc...' },
    };

    console.log(this.modalContent);
  }
}
