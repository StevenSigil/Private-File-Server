import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HeaderComponent } from './components/header/header.component';
import { FileSearchComponent } from './pages/file-search/file-search.component';
import { HomeComponent } from './pages/home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VideoPlayerComponent } from './pages/video-player/video-player.component';
import { SubmitModalComponent } from './components/modals/submit-modal/submit-modal.component';
import { SessionBrowserComponent } from './pages/session-browser/session-browser.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ImageViewerComponent } from './components/image-viewer/image-viewer/image-viewer.component';
import { MovieCardComponent } from './components/cards/movie-card/movie-card.component';
import { ImageCardComponent } from './components/cards/image-card/image-card.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FileSearchComponent,
    HomeComponent,
    VideoPlayerComponent,
    SubmitModalComponent,
    SessionBrowserComponent,
    LoadingComponent,
    ImageViewerComponent,
    MovieCardComponent,
    ImageCardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [Title],
  bootstrap: [AppComponent],
})
export class AppModule {}
