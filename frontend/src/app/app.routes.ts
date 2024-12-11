import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { WriterComponent } from './components/writer/writer.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'document/new', pathMatch: 'full' },
      { path: 'document/:id', component: WriterComponent }
    ]
  }
];
