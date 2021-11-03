import { Component, OnInit } from '@angular/core';
import {
  PathfinderService,
  videoFilePath,
} from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit {
  videoReady: boolean = false;
  videoFilePath: typeof videoFilePath = videoFilePath;

  constructor(private pathFinderService: PathfinderService) {}

  ngOnInit(): void {
    this.pathFinderService.getVideoFile('').subscribe(
      (res) => {
        this.videoReady = true;
      },
      (err) => {
        console.log('\nvideo-player.component: 20');
        console.warn(err);
        this.videoReady = true;
      },
      () => console.log('HTTP request completed.')
    );
  }
}
