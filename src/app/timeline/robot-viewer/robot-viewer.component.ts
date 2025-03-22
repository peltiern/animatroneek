import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-robot-viewer',
  templateUrl: './robot-viewer.component.html',
  styleUrls: ['./robot-viewer.component.css'],
  standalone: true
})
export class RobotViewerComponent implements AfterViewInit {
  @ViewChild('canvas3D', { static: true }) canvasRef!: ElementRef;
  @Input() tiltAngle: number = 0; // Servo 1 (Tilt)
  @Input() panAngle: number = 0;  // Servo 2 (Pan)

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;  // 👈 Ajout du contrôle par la souris
  private head!: THREE.Object3D;
  private panPivot!: THREE.Object3D;
  private tiltPivot!: THREE.Object3D;

  ngAfterViewInit() {
    this.initScene();
    this.animate();
  }

  initScene() {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // 🔄 Ajout des contrôles de souris
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Effet de friction
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;

    // Lumière
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    this.scene.add(light);

    this.createRobot();

    // Position de la caméra initiale
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 1.5, 0);
  }

  private createRobot() {
    // Création du corps (Cube)
    const bodyGeometry = new THREE.BoxGeometry(2, 3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({color: 0x3498db});
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.scene.add(body);

    // Pivot pour la rotation PAN (gauche/droite)
    this.panPivot = new THREE.Object3D();
    body.add(this.panPivot);

    // Pivot pour la rotation TILT (haut/bas)
    this.tiltPivot = new THREE.Object3D();
    this.panPivot.add(this.tiltPivot);

    // Création de la tête (Cube)
    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    const headMaterial = new THREE.MeshStandardMaterial({color: 0xe74c3c});
    this.head = new THREE.Mesh(headGeometry, headMaterial);

    // Positionnement de la tête au-dessus du corps
    this.tiltPivot.position.y = 2;
    this.tiltPivot.add(this.head);
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    // 🔄 Mettre à jour les contrôles de la souris
    this.controls.update();

    // Mise à jour des rotations selon les valeurs reçues
    this.panPivot.rotation.y = THREE.MathUtils.degToRad(this.panAngle);
    this.tiltPivot.rotation.x = THREE.MathUtils.degToRad(this.tiltAngle);

    this.renderer.render(this.scene, this.camera);
  };
}
