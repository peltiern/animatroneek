import { Component, HostListener, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { NgForOf } from '@angular/common';
import {MatIcon} from '@angular/material/icon';

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
  styleUrls: ['./timeline.component.css'],
  imports: [NgForOf, MatIcon],
  standalone: true
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
  isDraggingKeyframe = false;
  selectedKeyframe: { servo: Servo, keyframe: Keyframe } | null = null;

  togglePlayPause() {
    this.isPlaying ? this.pauseTimeline() : this.playTimeline();
  }

  playTimeline() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.timerSubscription = interval(10).subscribe(() => {
      if (this.currentTime >= this.maxTime) {
        this.stopTimeline();
        this.currentTime = 0;
      } else {
        this.currentTime = Math.round((this.currentTime + 0.01) * 100) / 100;
        if (!this.isDraggingIndicator) {
          this.checkKeyframes();
        }
      }
    });
  }

  pauseTimeline() {
    this.isPlaying = false;
    this.timerSubscription?.unsubscribe();
  }

  stopTimeline() {
    this.isPlaying = false;
    this.timerSubscription?.unsubscribe();
  }

  checkKeyframes() {
    if (this.isDraggingIndicator) return;
    this.servos.forEach(servo => {
      servo.keyframes.forEach(kf => {
        if (Math.abs(kf.time - this.currentTime) < 0.005) {
          this.sendServoCommand(servo.name, kf.angle);
        }
      });
    });
  }

  sendServoCommand(servoName: string, angle: number) {
    console.log(`Set ${servoName} to ${angle} degrees`);
  }

  onIndicatorDragStart(event: MouseEvent) {
    event.preventDefault();
    this.isDraggingIndicator = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      this.updateTimeFromEvent(moveEvent);
    };

    const onMouseUp = () => {
      this.isDraggingIndicator = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  updateTimeFromEvent(event: MouseEvent) {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * this.maxTime;
    this.currentTime = Math.max(0, Math.min(newTime, this.maxTime));
  }

  getTimeFromPosition(position: number): number {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    const timelineWidth = timeline ? timeline.offsetWidth : 1;
    return (position / timelineWidth) * this.maxTime;
  }

  onKeyframeDrag(event: MouseEvent, servo: Servo, keyframe: Keyframe) {
    event.preventDefault();
    this.isDraggingKeyframe = true;
    this.selectedKeyframe = { servo, keyframe };

    const timeline = document.querySelector('.timeline') as HTMLElement;
    const track = (event.target as HTMLElement).closest('.servo-track') as HTMLElement;
    const timelineRect = timeline.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newPosition = moveEvent.clientX - timelineRect.left;
      const newTime = this.getTimeFromPosition(newPosition);
      const newAngle = 180 - (moveEvent.clientY - trackRect.top);

      keyframe.time = Math.max(0, Math.min(newTime, this.maxTime));
      keyframe.angle = Math.max(0, Math.min(180, newAngle));
    };

    const onMouseUp = () => {
      this.isDraggingKeyframe = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  addKeyframe(event: MouseEvent, servo: Servo) {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * this.maxTime;

    const track = (event.target as HTMLElement).closest('.servo-track') as HTMLElement;
    const trackRect = track.getBoundingClientRect();
    const newAngle = 180 - (event.clientY - trackRect.top);

    servo.keyframes.push({ time: newTime, angle: newAngle });
  }

  selectKeyframe(servo: Servo, keyframe: Keyframe) {
    this.selectedKeyframe = { servo, keyframe };
  }

  @HostListener('document:keydown', ['$event'])
  handleDeleteKey(event: KeyboardEvent) {
    if (event.key === 'Delete' && this.selectedKeyframe) {
      this.selectedKeyframe.servo.keyframes = this.selectedKeyframe.servo.keyframes.filter(kf => kf !== this.selectedKeyframe!.keyframe);
      this.selectedKeyframe = null;
    }
  }

  ngOnInit() {
    window.addEventListener('resize', this.updateTimelineWidth);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateTimelineWidth);
  }

  updateTimelineWidth = () => {
    const timeline = document.querySelector('.timeline') as HTMLElement;
    if (timeline) {
      this.maxTime = 5;
    }
  };
}
