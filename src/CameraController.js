import * as THREE from 'three';

export class CameraController {
  constructor(character) {
    this.character = character;
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    // Camera offset from character
    this.offset = new THREE.Vector3(0, 5, -8);
    this.lookAtOffset = new THREE.Vector3(0, 1.5, 4);

    // Smooth follow
    this.smoothSpeed = 4;
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    // Initialize position
    const targetPos = this.character.position.clone().add(this.offset);
    this.currentPosition.copy(targetPos);
    this.camera.position.copy(targetPos);
    this.currentLookAt.copy(this.character.position).add(this.lookAtOffset);
  }

  update(delta) {
    // Target position
    const targetPos = this.character.position.clone().add(this.offset);

    // Height adjustment when jumping/falling
    if (!this.character.grounded) {
      const heightDiff = this.character.position.y - this.character.groundY;
      targetPos.y += Math.max(0, heightDiff * 0.3);
    }

    // Smooth follow
    this.currentPosition.lerp(targetPos, this.smoothSpeed * delta);

    // Look at target
    const lookTarget = this.character.position.clone().add(this.lookAtOffset);
    this.currentLookAt.lerp(lookTarget, this.smoothSpeed * 1.5 * delta);

    // Apply shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const shakeMag = this.shakeIntensity * (this.shakeTimer / this.shakeDuration);
      shakeX = (Math.random() - 0.5) * shakeMag;
      shakeY = (Math.random() - 0.5) * shakeMag;
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.position.x += shakeX;
    this.camera.position.y += shakeY;
    this.camera.lookAt(this.currentLookAt);
  }

  shake(intensity = 0.3, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
}
