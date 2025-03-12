import { Component, HostListener, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import {NgForOf} from '@angular/common';

interface Keyframe {
  time: number;
  angle: number;
}

interface Servo {
  name: string;
  keyframes: Keyframe[];
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit {
  servos: Servo[] = [
    { name: 'Servo 1', keyframes: [{ time: 0, angle: 10 }, { time: 2, angle: 90 }, { time: 4, angle: 45 }] },
    { name: 'Servo 2', keyframes: [{ time: 1, angle: 30 }, { time: 3, angle: 120 }] }
  ];

  currentTime = 0;
  isPlaying = false;
  maxTime = 5;
  private timerSubscription: Subscription | null = null;
  isDraggingIndicator = false;
  selectedKeyframe: { servo: Servo; keyframe: Keyframe } | null = null;

  ngOnInit(): void {}

  togglePlayPause(): void {
    this.isPlaying ? this.pauseTimeline() : this.playTimeline();
  }

  playTimeline(): void {
    this.isPlaying = true;
    this.timerSubscription = interval(100).subscribe(() => this.updateTime());
  }

  pauseTimeline(): void {
    this.isPlaying = false;
    this.timerSubscription?.unsubscribe();
  }

  stopTimeline(): void {
    this.pauseTimeline();
    this.currentTime = 0;
  }

  private updateTime(): void {
    if (this.currentTime >= this.maxTime) {
      this.stopTimeline();
      return;
    }

    this.currentTime = Math.round((this.currentTime + 0.1) * 10) / 10;
    if (!this.isDraggingIndicator) {
      this.triggerKeyframes();
    }
  }

  private triggerKeyframes(): void {
    this.servos.forEach(servo => {
      servo.keyframes.forEach(kf => {
        if (Math.abs(kf.time - this.currentTime) < 0.05) {
          this.sendServoCommand(servo.name, kf.angle);
        }
      });
    });
  }

  sendServoCommand(servoName: string, angle: number): void {
    console.log(`Set ${servoName} to ${angle} degrees`);
  }

  onIndicatorDragStart(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingIndicator = true;

    const onMouseMove = (moveEvent: MouseEvent) => this.updateTimeFromEvent(moveEvent);
    const onMouseUp = () => this.stopDragging(onMouseMove);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private stopDragging(onMouseMove: (event: MouseEvent) => void): void {
    this.isDraggingIndicator = false;
    document.removeEventListener('mousemove', onMouseMove);
  }

  private updateTimeFromEvent(event: MouseEvent): void {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * this.maxTime;
    this.currentTime = Math.max(0, Math.min(newTime, this.maxTime));
  }

  onKeyframeDrag(event: MouseEvent, servo: Servo, keyframe: Keyframe): void {
    event.preventDefault();

    const timeline = document.querySelector('.timeline') as HTMLElement;
    const track = (event.target as HTMLElement).closest('.servo-track') as HTMLElement;
    if (!timeline || !track) return;

    const timelineRect = timeline.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newTime = ((moveEvent.clientX - timelineRect.left) / timelineRect.width) * this.maxTime;
      const newAngle = 180 - (moveEvent.clientY - trackRect.top);
      keyframe.time = Math.max(0, Math.min(newTime, this.maxTime));
      keyframe.angle = Math.max(0, Math.min(180, newAngle));
    };

    const onMouseUp = () => this.stopDragging(onMouseMove);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  addKeyframe(event: MouseEvent, servo: Servo): void {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    const track = (event.target as HTMLElement).closest('.servo-track') as HTMLElement;

    if (!timeline || !track) return;

    const rect = timeline.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    const newTime = ((event.clientX - rect.left) / rect.width) * this.maxTime;
    const newAngle = 180 - (event.clientY - trackRect.top);

    servo.keyframes.push({ time: newTime, angle: newAngle });
  }

  @HostListener('document:keydown', ['$event'])
  handleDeleteKey(event: KeyboardEvent): void {
    if (event.key === 'Delete' && this.selectedKeyframe) {
      this.selectedKeyframe.servo.keyframes = this.selectedKeyframe.servo.keyframes.filter(kf => kf !== this.selectedKeyframe!.keyframe);
      this.selectedKeyframe = null;
    }
  }
}
