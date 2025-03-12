import {Component} from '@angular/core';
import {TimelineComponent} from './timeline/timeline.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    TimelineComponent
  ],
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'puppeter';
}
