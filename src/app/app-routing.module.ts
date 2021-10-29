import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileSearchComponent } from './pages/file-search/file-search.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'file-search', component: FileSearchComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
