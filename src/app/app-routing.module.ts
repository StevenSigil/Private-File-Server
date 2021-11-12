import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileSearchComponent } from './pages/file-search/file-search.component';
import { HomeComponent } from './pages/home/home.component';
import { SessionBrowserComponent } from './pages/session-browser/session-browser.component';
import { VideoPlayerComponent } from './pages/video-player/video-player.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'file-search', component: FileSearchComponent },
  { path: 'player', component: VideoPlayerComponent },
  { path: 'player/:videoPath', component: VideoPlayerComponent },
  { path: 'session/:session', component: SessionBrowserComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
