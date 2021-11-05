import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Constants } from './config/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = Constants.TitleOfSite;

  constructor(private titleService: Title) {
    // console.log(Constants.API_ENDPOINT);
  }

  public setTitle(newTitle?: string) {
    newTitle = newTitle ? newTitle : this.title;
    this.titleService.setTitle(newTitle);
  }

  ngOnInit() {
    this.setTitle();
  }
}
