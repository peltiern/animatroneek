import {Component} from '@angular/core';
import {TimelineComponent} from './timeline/timeline.component';
import {BezierEditorComponent} from './bezier-editor/bezier-editor.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    BezierEditorComponent
  ],
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'animatroneek';
}
