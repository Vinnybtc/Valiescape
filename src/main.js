import * as THREE from 'three';
import { GameState } from './GameState.js';
import { CharacterController } from './CharacterController.js';
import { CameraController } from './CameraController.js';
import { LevelManager } from './LevelManager.js';
import { UIManager } from './UIManager.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { ParticleSystem } from './ParticleSystem.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.state = new GameState();
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem(this.scene);
    this.ui = new UIManager(this.state, this);
    this.character = null;
    this.camera = null;
    this.levelManager = null;

    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x9999cc, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(30, 50, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    this.scene.add(sun);
    this.sun = sun;

    const hemi = new THREE.HemisphereLight(0x88aaff, 0xffaa88, 0.4);
    this.scene.add(hemi);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.camera) {
        this.camera.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.camera.updateProjectionMatrix();
      }
    });
  }

  startGame() {
    this.state.reset();
    this.scene.fog = new THREE.FogExp2(0xccccff, 0.008);
    this.scene.background = new THREE.Color(0x88aaff);

    // Create character
    this.character = new CharacterController(this.scene, this.state, this.input, this.audio, this.particles);

    // Create camera
    this.camera = new CameraController(this.character);

    // Create level
    this.levelManager = new LevelManager(this.scene, this.state, this.character, this.audio, this.particles);
    this.levelManager.loadLevel(1);

    // Show HUD
    this.ui.showScreen('hud');
    this.state.playing = true;
  }

  restartLevel() {
    // Clean up old level
    if (this.levelManager) {
      this.levelManager.cleanup();
    }
    if (this.character) {
      this.character.cleanup();
    }

    this.state.reset();
    this.character = new CharacterController(this.scene, this.state, this.input, this.audio, this.particles);
    this.camera = new CameraController(this.character);
    this.levelManager = new LevelManager(this.scene, this.state, this.character, this.audio, this.particles);
    this.levelManager.loadLevel(1);
    this.ui.showScreen('hud');
    this.state.playing = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.state.playing && !this.state.paused) {
      // Update input
      this.input.update();

      // Restart
      if (this.input.keys.r) {
        this.input.keys.r = false;
        this.restartLevel();
        return;
      }

      // Update character
      if (this.character) {
        this.character.update(delta);
      }

      // Update camera
      if (this.camera) {
        this.camera.update(delta);
      }

      // Update level (obstacles, timer, checkpoints, portal)
      if (this.levelManager) {
        this.levelManager.update(delta);
      }

      // Update particles
      this.particles.update(delta);

      // Update UI
      this.ui.update(delta);

      // Update sun shadow to follow player
      if (this.character && this.sun) {
        this.sun.target.position.copy(this.character.position);
        this.sun.position.set(
          this.character.position.x + 30,
          50,
          this.character.position.z + 30
        );
      }
    }

    if (this.camera) {
      this.renderer.render(this.scene, this.camera.camera);
    }
  }

  showMenu() {
    this.state.playing = false;
    if (this.levelManager) this.levelManager.cleanup();
    if (this.character) this.character.cleanup();
    this.character = null;
    this.camera = null;
    this.levelManager = null;
    // Clear scene except lights
    const toRemove = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(obj => {
      if (obj.parent === this.scene) this.scene.remove(obj);
    });
    this.ui.showScreen('main-menu');
  }
}

// Start
const game = new Game();
window.game = game;
