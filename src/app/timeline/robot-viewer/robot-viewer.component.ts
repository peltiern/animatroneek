import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';


@Component({
  selector: 'app-robot-viewer',
  templateUrl: './robot-viewer.component.html',
  styleUrls: ['./robot-viewer.component.css'],
  standalone: true
})
export class RobotViewerComponent implements AfterViewInit {
  @ViewChild('canvas3D', { static: true }) canvasRef!: ElementRef;
  @ViewChild('compassCanvas', { static: true }) compassRef!: ElementRef;
  @Input() tiltAngle: number = 0;
  @Input() panAngle: number = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private head!: THREE.Object3D;
  private panPivot!: THREE.Object3D;
  private tiltPivot!: THREE.Object3D;

  private compassScene!: THREE.Scene;
  private compassCamera!: THREE.OrthographicCamera;
  private compassRenderer!: THREE.WebGLRenderer;

  ngAfterViewInit() {
    this.initScene();
    this.initCompass();
    this.animate();
  }

  initScene() {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    this.scene.add(light);

    this.createRobot();
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 1.5, 0);
  }

  private createRobot() {
    const bodyGeometry = new THREE.BoxGeometry(2, 3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.scene.add(body);

    this.panPivot = new THREE.Object3D();
    body.add(this.panPivot);

    this.tiltPivot = new THREE.Object3D();
    this.panPivot.add(this.tiltPivot);

    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    this.head = new THREE.Mesh(headGeometry, headMaterial);

    this.tiltPivot.position.y = 2;
    this.tiltPivot.add(this.head);
  }

  private initCompass() {
    const canvas = this.compassRef.nativeElement;
    this.compassScene = new THREE.Scene();
    this.compassCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.compassRenderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.compassRenderer.setSize(150, 150);
    this.compassCamera.position.set(0, 0, 5);

    const axes = new THREE.Group();

    const createAxis = (color: number, position: THREE.Vector3, label: string) => {
      const material = new THREE.MeshBasicMaterial({ color });
      const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
      const axis = new THREE.Mesh(geometry, material);
      axis.position.copy(position);
      axes.add(axis);

      const arrowGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
      const arrow = new THREE.Mesh(arrowGeometry, material);
      arrow.position.copy(position.clone().multiplyScalar(1.2));
      axes.add(arrow);

      const loader = new FontLoader();
      loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry(label, {
          font: font,
          size: 0.2,
          depth: 0.02,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color });
        const text = new THREE.Mesh(textGeometry, textMaterial);
        text.position.copy(position.clone().multiplyScalar(1.4));
        axes.add(text);
      });
    };

    createAxis(0xff0000, new THREE.Vector3(1, 0, 0), 'X');
    createAxis(0x00ff00, new THREE.Vector3(0, 1, 0), 'Y');
    createAxis(0x0000ff, new THREE.Vector3(0, 0, 1), 'Z');

    this.compassScene.add(axes);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.panPivot.rotation.y = THREE.MathUtils.degToRad(this.panAngle);
    this.tiltPivot.rotation.x = THREE.MathUtils.degToRad(this.tiltAngle);
    this.renderer.render(this.scene, this.camera);

    this.compassCamera.quaternion.copy(this.camera.quaternion);
    this.compassRenderer.render(this.compassScene, this.compassCamera);
  };
}
