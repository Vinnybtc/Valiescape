import * as THREE from 'three';

export class CharacterController {
  constructor(scene, state, input, audio, particles) {
    this.scene = scene;
    this.state = state;
    this.input = input;
    this.audio = audio;
    this.particles = particles;

    // Physics
    this.position = new THREE.Vector3(
      state.spawnPosition.x,
      state.spawnPosition.y,
      state.spawnPosition.z
    );
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.grounded = false;
    this.groundY = 0;

    // Movement constants
    this.baseSpeed = 6;
    this.sprintSpeed = 8;
    this.autoRunSpeed = 2;
    this.jumpForce = 12;
    this.gravity = -28;
    this.airControl = 0.4;
    this.strafeSpeed = 8;

    // Coyote time
    this.coyoteTime = 0.15;
    this.coyoteTimer = 0;
    this.wasGrounded = false;

    // Dance boost
    this.danceBoosting = false;
    this.danceTimer = 0;

    // Animation
    this.bobPhase = 0;
    this.dancePhase = 0;
    this.celebrating = false;
    this.celebrateTimer = 0;

    // Falling
    this.fallThreshold = -20;

    // Create mesh
    this.mesh = this.createCharacterMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Disco glow (for dance boost)
    this.discoLight = new THREE.PointLight(0xff00ff, 0, 8);
    this.discoLight.position.set(0, -0.5, 0);
    this.mesh.add(this.discoLight);

    // Collider
    this.colliderRadius = 0.4;
    this.colliderHeight = 1.8;
  }

  createCharacterMesh() {
    const group = new THREE.Group();

    // Body (pajama - white/blue striped)
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.0, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xddeeff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Stripes on body
    for (let i = 0; i < 4; i++) {
      const stripeGeo = new THREE.CylinderGeometry(0.36, 0.31, 0.05, 8);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x6688cc });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 0.2 + i * 0.22;
      group.add(stripe);
    }

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.35, 0.25);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.35, 0.25);
    group.add(rightEye);

    // Smile
    const smileGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI);
    const smileMat = new THREE.MeshStandardMaterial({ color: 0xff6666 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 1.22, 0.26);
    smile.rotation.z = Math.PI;
    group.add(smile);

    // Cape (red)
    const capeGeo = new THREE.PlaneGeometry(0.6, 0.8);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      side: THREE.DoubleSide
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.6, -0.35);
    cape.rotation.x = 0.1;
    cape.castShadow = true;
    group.add(cape);
    this.cape = cape;

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xddeeff });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.45, 0.7, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.45, 0.7, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);
    this.rightArm = rightArm;

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xddeeff });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15, -0.05, 0);
    group.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15, -0.05, 0);
    group.add(rightLeg);
    this.rightLeg = rightLeg;

    // Feet (barefoot - skin color)
    const footGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const footMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    footGeo.scale(1, 0.5, 1.3);

    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.15, -0.3, 0.05);
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.15, -0.3, 0.05);
    group.add(rightFoot);

    group.castShadow = true;
    return group;
  }

  update(delta) {
    if (this.celebrating) {
      this.celebrateTimer -= delta;
      this.danceAnimation(delta);
      if (this.celebrateTimer <= 0) {
        this.celebrating = false;
      }
      this.mesh.position.copy(this.position);
      return;
    }

    // Dance boost
    this.updateDanceBoost(delta);

    // Movement
    const speed = this.getSpeed();
    const airMult = this.grounded ? 1 : this.airControl;

    // Auto-run forward
    let forwardSpeed = this.autoRunSpeed;
    if (this.input.keys.forward) {
      forwardSpeed = speed;
    }
    if (this.input.keys.sprint) {
      forwardSpeed = this.sprintSpeed;
    }

    // Apply dance boost speed
    if (this.state.danceBoostActive) {
      forwardSpeed *= 1.2;
    }

    this.velocity.z = forwardSpeed;

    // Strafe
    let strafeVel = 0;
    if (this.input.keys.left) strafeVel = -this.strafeSpeed * airMult;
    if (this.input.keys.right) strafeVel = this.strafeSpeed * airMult;
    this.velocity.x = strafeVel;

    // Coyote time
    if (this.grounded) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer -= delta;
    }

    // Jump
    if (this.input.consumeJump() && this.coyoteTimer > 0) {
      let jumpForce = this.jumpForce;
      if (this.state.danceBoostActive) {
        jumpForce *= 1.25;
      }
      this.velocity.y = jumpForce;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.audio.playJump();
    }

    // Gravity
    if (!this.grounded) {
      this.velocity.y += this.gravity * delta;
    }

    // Apply velocity
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Ground collision (simple - actual platform collisions in LevelManager)
    this.wasGrounded = this.grounded;

    // Fall detection
    if (this.position.y < this.fallThreshold) {
      this.onFall();
    }

    // Update mesh
    this.mesh.position.copy(this.position);

    // Animate
    this.animate(delta);
  }

  getSpeed() {
    return this.input.keys.sprint ? this.sprintSpeed : this.baseSpeed;
  }

  updateDanceBoost(delta) {
    // Cooldown
    if (this.state.danceBoostCooldown > 0) {
      this.state.danceBoostCooldown -= delta;
    }

    // Activate
    if (this.input.consumeDance() && this.state.danceBoostCooldown <= 0 && !this.state.danceBoostActive) {
      this.state.danceBoostActive = true;
      this.state.danceBoostTimer = this.state.danceBoostDuration;
      this.state.danceBoostsUsed++;
      this.state.addScore(20);
      this.discoLight.intensity = 3;
      this.particles.spawnSparkles(this.position, 20);
      this.audio.playDanceBoost();
    }

    // Active timer
    if (this.state.danceBoostActive) {
      this.state.danceBoostTimer -= delta;
      this.particles.spawnSparkles(this.position, 1);
      if (this.state.danceBoostTimer <= 0) {
        this.state.danceBoostActive = false;
        this.state.danceBoostCooldown = this.state.danceBoostCooldownDuration;
        this.discoLight.intensity = 0;
      }
    }
  }

  animate(delta) {
    const isMoving = this.velocity.z > 1 || Math.abs(this.velocity.x) > 0.5;

    if (this.state.danceBoostActive) {
      this.danceAnimation(delta);
    } else if (isMoving && this.grounded) {
      // Run animation
      this.bobPhase += delta * 12;
      const bob = Math.sin(this.bobPhase) * 0.08;
      this.mesh.children[0].position.y = 0.5 + bob; // body bob

      // Arm swing
      this.leftArm.rotation.x = Math.sin(this.bobPhase) * 0.5;
      this.rightArm.rotation.x = -Math.sin(this.bobPhase) * 0.5;

      // Leg swing
      this.leftLeg.rotation.x = -Math.sin(this.bobPhase) * 0.4;
      this.rightLeg.rotation.x = Math.sin(this.bobPhase) * 0.4;

      // Cape flap
      this.cape.rotation.x = 0.1 + Math.sin(this.bobPhase * 0.5) * 0.15;
    } else if (this.grounded) {
      // Idle bounce
      this.bobPhase += delta * 3;
      const idleBob = Math.sin(this.bobPhase) * 0.03;
      this.mesh.children[0].position.y = 0.5 + idleBob;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }
  }

  danceAnimation(delta) {
    this.dancePhase += delta * 10;
    // Wiggle body
    this.mesh.rotation.y = Math.sin(this.dancePhase) * 0.3;
    // Arms up and waving
    this.leftArm.rotation.z = 0.3 + Math.sin(this.dancePhase * 2) * 0.5;
    this.rightArm.rotation.z = -0.3 - Math.sin(this.dancePhase * 2 + 1) * 0.5;
    this.leftArm.rotation.x = -1.2 + Math.sin(this.dancePhase * 1.5) * 0.3;
    this.rightArm.rotation.x = -1.2 + Math.cos(this.dancePhase * 1.5) * 0.3;
    // Leg bounce
    this.leftLeg.rotation.x = Math.sin(this.dancePhase * 2) * 0.3;
    this.rightLeg.rotation.x = -Math.sin(this.dancePhase * 2) * 0.3;
  }

  celebrate() {
    this.celebrating = true;
    this.celebrateTimer = 2.0;
    this.dancePhase = 0;
  }

  onFall() {
    this.state.falls++;
    this.audio.playFall();
    this.respawn();
  }

  respawn() {
    this.position.set(
      this.state.spawnPosition.x,
      this.state.spawnPosition.y,
      this.state.spawnPosition.z
    );
    this.velocity.set(0, 0, 0);
    this.grounded = false;
  }

  setGrounded(y) {
    if (this.velocity.y <= 0) {
      this.position.y = y + 0.3; // offset for character feet
      this.velocity.y = 0;
      if (!this.grounded) {
        // Landing
        this.audio.playLand();
      }
      this.grounded = true;
      this.groundY = y;
    }
  }

  bounce(force) {
    this.velocity.y = force;
    this.grounded = false;
    this.audio.playJump();
  }

  cleanup() {
    this.scene.remove(this.mesh);
  }
}
