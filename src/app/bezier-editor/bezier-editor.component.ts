import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Bezier} from 'bezier-js';
import {NgForOf} from '@angular/common';


@Component({
  selector: 'app-bezier-editor',
  template: `
    <svg #svgContainer (dblclick)="addPoint($event)" (mousedown)="startDrag($event)" width="600" height="400">
      <path [attr.d]="curvePath" stroke="blue" fill="none" stroke-width="4"/>
      <circle *ngFor="let p of points; let i = index" [attr.cx]="p.x" [attr.cy]="p.y" r="5" class="point"
              (click)="selectPoint(i)"/>
    </svg>
  `,
  imports: [
    NgForOf
  ],
  styleUrls: ['./bezier-editor.component.css']
})
export class BezierEditorComponent {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef;
  points: { x: number, y: number }[] = [];
  curve: Bezier | null = null;
  selectedIndex: number | null = null;
  isDragging = false;

  get curvePath(): string {
    if (this.points.length < 2) return '';

    // Passe un tableau d'objets {x, y}
    this.curve = new Bezier(this.points);

    // Génère une liste de points pour interpoler la courbe
    const lut = this.curve.getLUT(50);

    // Génère un chemin SVG à partir des points LUT
    return `M ${lut.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }

  addPoint(event: MouseEvent) {
    const rect = this.svgContainer.nativeElement.getBoundingClientRect();
    this.points.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  selectPoint(index: number) {
    this.selectedIndex = index;
  }

  startDrag(event: MouseEvent) {
    if (this.selectedIndex !== null) {
      this.isDragging = true;
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging && this.selectedIndex !== null) {
      const rect = this.svgContainer.nativeElement.getBoundingClientRect();
      this.points[this.selectedIndex] = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      // Force l'update de la courbe en rafraîchissant la variable
      this.curvePath;
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' && this.selectedIndex !== null) {
      this.points.splice(this.selectedIndex, 1);
      this.selectedIndex = null;
    }
  }
}
