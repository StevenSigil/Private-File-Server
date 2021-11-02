import { Component, OnInit } from '@angular/core';
import { PathfinderService } from 'src/app/services/pathfinder.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit {
  videoReady: boolean = false;

  constructor(private pathFinderService: PathfinderService) {}

  ngOnInit(): void {
    this.pathFinderService.getVideoFile('').subscribe(
      (res) => {
        this.videoReady = true;
      },
      (err) => {
        console.log(err);
        this.videoReady = true;
      },
      () => console.log('HTTP request completed.')
    );
  }
}
