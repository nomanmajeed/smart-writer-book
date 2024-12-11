import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WriterComponent } from './components/writer/writer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WriterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Smart Writer Book';
}
