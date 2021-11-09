import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MasterSessionsInterface,
  SessionErrorInterface,
} from 'src/app/config/interfaces/sessions-interface';
import { PathfinderService } from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(
    private pathfinderService: PathfinderService,
    private router: Router
  ) {}

  sessions: MasterSessionsInterface[] | SessionErrorInterface | any;
  selectedSession: MasterSessionsInterface | undefined;

  ngOnInit(): void {
    this.getMasterSession();
  }

  getMasterSession() {
    this.pathfinderService.getMasterSessionData().subscribe(
      (res) => {
        console.log(res);
        this.sessions = res;
      },
      (err: SessionErrorInterface) => {
        console.warn(err);
        this.sessions = err;
      },
      () => {
        console.log('HTTP request completed');
        return;
      }
    );
  }

  setSelectedSection(sessionData: MasterSessionsInterface) {
    this.selectedSession = sessionData;
    this.navigateToSessions(sessionData);
  }

  navigateToSessions(sessionData?: MasterSessionsInterface | any) {
    var sessionDest;
    if (sessionData && sessionData.sessionName) {
      sessionDest = sessionData.sessionName;
    } else if (this.selectedSession && this.selectedSession.sessionName) {
      sessionDest = this.selectedSession.sessionName;
    }
    return this.router.navigate(['session', sessionDest]);
  }
}
