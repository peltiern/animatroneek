import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';


@Component({
  selector: 'app-robot-viewer',
  templateUrl: './robot-viewer.component.html',
  styleUrls: ['./robot-viewer.component.css'],
  standalone: true
})
export class RobotViewerComponent implements AfterViewInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  @Input() tiltAngle: number = 0;
  @Input() panAngle: number = 0;

  private scene!: THREE.Scene;
  private model!: THREE.Object3D;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private axesScene!: THREE.Scene;
  private axesHelper!: THREE.AxesHelper;
  private axesCamera!: THREE.OrthographicCamera;
  private axesRenderer!: THREE.WebGLRenderer;
  private head!: THREE.Object3D;
  private panPivot!: THREE.Object3D;
  private tiltPivot!: THREE.Object3D;

  ngAfterViewInit(): void {
    this.initScene();
    this.animate();
  }

  private initScene(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 2, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const light = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.createRobot();
    this.setupAxesIndicator();
  }

  private createRobot() {
    const bodyGeometry = new THREE.BoxGeometry(2, 3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
    this.model = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.scene.add(this.model);

    this.panPivot = new THREE.Object3D();
    this.model.add(this.panPivot);

    this.tiltPivot = new THREE.Object3D();
    this.panPivot.add(this.tiltPivot);

    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    this.head = new THREE.Mesh(headGeometry, headMaterial);

    this.tiltPivot.position.y = 2;
    this.tiltPivot.add(this.head);

    // Mettre à jour l'affichage du modèle
    this.updateModel = () => {
      // Copier la rotation de la caméra des axes dans celle de la scène du modèle
      this.scene.quaternion.copy(this.axesCamera.quaternion);

      // Rendu de la scène du modèle
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    };
  }

  private setupAxesIndicator(): void {
    // Créer une mini-scène pour l'indicateur des axes
    this.axesScene = new THREE.Scene();

    // Groupe pivotant autour de (0,0,0)
    const axesGroup = new THREE.Group();
    this.axesScene.add(axesGroup);

    // Ajouter l'AxesHelper au groupe
    this.axesHelper = new THREE.AxesHelper(1);
    axesGroup.add(this.axesHelper);

    // Mini caméra orthographique
    this.axesCamera = new THREE.OrthographicCamera(-0.8, 0.8, 0.8, -0.8, 0.1, 10);
    this.axesCamera.position.set(0, 0, 1);
    this.axesCamera.lookAt(0, 0, 0);

    // Renderer séparé pour les axes
    this.axesRenderer = new THREE.WebGLRenderer({ alpha: true });
    this.axesRenderer.setSize(150, 150);
    this.axesRenderer.domElement.style.position = 'absolute';
    this.axesRenderer.domElement.style.bottom = '10px';
    this.axesRenderer.domElement.style.right = '10px';
    // this.axesRenderer.domElement.style.border = '1px solid rgba(0, 0, 0, 0.8)';
    this.axesRenderer.domElement.style.background = 'rgba(255, 255, 255, 0.2)';

    this.rendererContainer.nativeElement.appendChild(this.axesRenderer.domElement);
    console.log(this.axesRenderer.domElement.classList); // Vérifie si la classe est bien ajoutée


    // 🎯 Rendre interactif
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    this.axesRenderer.domElement.addEventListener('mousedown', (event) => {
      isDragging = true;
      previousMouseX = event.clientX;
      previousMouseY = event.clientY;
    });

    window.addEventListener('mousemove', (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - previousMouseX;
      const deltaY = event.clientY - previousMouseY;

      previousMouseX = event.clientX;
      previousMouseY = event.clientY;

      const rotationSpeed = 0.005;

      // 🎯 Appliquer la rotation aux axes
      axesGroup.rotation.y += deltaX * rotationSpeed;
      axesGroup.rotation.x += deltaY * rotationSpeed;

      // 🎯 Appliquer la même rotation au modèle
      if (this.model) {
        this.model.rotation.y += deltaX * rotationSpeed;
        this.model.rotation.x += deltaY * rotationSpeed;
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Mettre à jour l'affichage des axes
    this.updateAxesIndicator = () => {
      // Copier la rotation de la caméra principale dans l'indicateur des axes
      axesGroup.quaternion.copy(this.camera.quaternion);

      // Rendu de la mini-scène des axes
      this.axesCamera.updateProjectionMatrix();
      this.axesRenderer.render(this.axesScene, this.axesCamera);
    };
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.panPivot.rotation.y = THREE.MathUtils.degToRad(this.panAngle);
    this.tiltPivot.rotation.x = THREE.MathUtils.degToRad(this.tiltAngle);
    this.renderer.render(this.scene, this.camera);
    this.axesRenderer.render(this.axesScene, this.axesCamera);
    this.updateAxesIndicator();
    this.updateModel();
  };

  private updateAxesIndicator(): void {
    this.axesRenderer.render(this.scene, this.axesCamera);
  }

  private updateModel(): void {
    this.renderer.render(this.axesScene, this.camera);
  }
}
