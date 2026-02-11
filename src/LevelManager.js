import * as THREE from 'three';
import { ObstacleFactory } from './ObstacleFactory.js';

export class LevelManager {
  constructor(scene, state, character, audio, particles) {
    this.scene = scene;
    this.state = state;
    this.character = character;
    this.audio = audio;
    this.particles = particles;
    this.obstacles = [];
    this.platforms = [];
    this.checkpoints = [];
    this.portal = null;
    this.levelObjects = [];
    this.collapsingPlatforms = [];
    this.alarmTickTimer = 0;

    this.obstacleFactory = new ObstacleFactory(scene);
  }

  loadLevel(levelNum) {
    this.state.currentLevel = levelNum;
    this.buildBedroomChaos();
  }

  buildBedroomChaos() {
    // Sky color for bedroom
    this.scene.background = new THREE.Color(0x88aaff);
    this.scene.fog = new THREE.FogExp2(0xaabbff, 0.005);

    // Build the level path
    const sectionWidth = 8;

    // === START PLATFORM ===
    this.addPlatform(0, 0, 0, 10, 1, 8, 0xaaddaa); // green start

    // === OBSTACLE SECTION A ===
    // Platform run with rotating pillows
    this.addPlatform(0, 0, 12, 8, 1, 16, 0xeeddcc);

    // Obstacle 1: Rotating pillows (slow rotating bars)
    const pillow1 = this.obstacleFactory.createRotatingPillow(0, 1.5, 10, 5);
    this.addObstacle(pillow1);

    // Obstacle 2: Bouncy bed (jump pad)
    const bed1 = this.obstacleFactory.createBouncyBed(0, 0.5, 18);
    this.addObstacle(bed1);

    // Gap jump section
    this.addPlatform(0, 0, 24, 6, 1, 4, 0xddccee);
    this.addPlatform(0, 0, 32, 6, 1, 4, 0xddccee);

    // Obstacle 3: Moving platform over gap
    const movPlat1 = this.obstacleFactory.createMovingPlatform(-2, 0, 28, 3, 1, 3, 'x', 4, 1.5);
    this.addObstacle(movPlat1);
    this.platforms.push(movPlat1);

    // === CHECKPOINT 1 ===
    this.addCheckpoint(0, 1, 34);

    // === OBSTACLE SECTION B ===
    this.addPlatform(0, 0, 40, 8, 1, 20, 0xeeddcc);

    // Obstacle 4: Slippery pajama floor
    const slippery1 = this.obstacleFactory.createSlipperyFloor(0, 0.52, 45, 8, 6);
    this.addObstacle(slippery1);

    // Obstacle 5: Falling cushions zone
    const cushionZone = this.obstacleFactory.createFallingCushionZone(0, 8, 52, 6, 6);
    this.addObstacle(cushionZone);

    // Elevated platforms (requires jumping)
    this.addPlatform(-2, 1.5, 56, 3, 0.5, 3, 0xffccaa);
    this.addPlatform(2, 3, 60, 3, 0.5, 3, 0xffccaa);
    this.addPlatform(0, 4.5, 64, 3, 0.5, 3, 0xffccaa);
    this.addPlatform(0, 4.5, 70, 8, 1, 4, 0xddddee);

    // === CHECKPOINT 2 ===
    this.addCheckpoint(0, 5.5, 72);

    // === HARD SECTION ===
    this.addPlatform(0, 4.5, 78, 8, 1, 10, 0xeeddcc);

    // Obstacle 6: Collapsing platforms
    const collapse1 = this.obstacleFactory.createCollapsingPlatform(-2, 4.5, 84, 3, 0.5, 3);
    this.addObstacle(collapse1);
    this.platforms.push(collapse1);
    this.collapsingPlatforms.push(collapse1);

    const collapse2 = this.obstacleFactory.createCollapsingPlatform(2, 4.5, 88, 3, 0.5, 3);
    this.addObstacle(collapse2);
    this.platforms.push(collapse2);
    this.collapsingPlatforms.push(collapse2);

    const collapse3 = this.obstacleFactory.createCollapsingPlatform(0, 4.5, 92, 3, 0.5, 3);
    this.addObstacle(collapse3);
    this.platforms.push(collapse3);
    this.collapsingPlatforms.push(collapse3);

    // Final platform before portal
    this.addPlatform(0, 4.5, 98, 10, 1, 6, 0xddffdd);

    // === EXIT PORTAL ===
    this.addPortal(0, 6, 100);

    // === DECORATION ===
    this.addBedroomDecorations();
  }

  addPlatform(x, y, z, width, height, depth, color) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y - height / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.levelObjects.push(mesh);

    // Store as collision platform
    const platform = {
      mesh,
      type: 'static',
      bounds: {
        minX: x - width / 2,
        maxX: x + width / 2,
        minY: y - height,
        maxY: y,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
      }
    };
    this.platforms.push(platform);
    return platform;
  }

  addCheckpoint(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Dance pad base (glowing disc)
    const padGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xff66aa,
      emissive: 0xff3388,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.6
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.receiveShadow = true;
    group.add(pad);

    // Ring
    const ringGeo = new THREE.TorusGeometry(1.3, 0.08, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    // Flag pole
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 1, 0);
    group.add(pole);

    // Flag
    const flagGeo = new THREE.PlaneGeometry(0.6, 0.4);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide,
      emissive: 0xff2222,
      emissiveIntensity: 0.2
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.35, 1.8, 0);
    group.add(flag);

    this.scene.add(group);
    this.levelObjects.push(group);

    this.checkpoints.push({
      mesh: group,
      position: new THREE.Vector3(x, y, z),
      triggered: false
    });
  }

  addPortal(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Portal ring
    const ringGeo = new THREE.TorusGeometry(2, 0.3, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x8844ff,
      emissive: 0x6622ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 * 0.3;
    group.add(ring);

    // Inner glow
    const innerGeo = new THREE.CircleGeometry(1.8, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xcc88ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = Math.PI / 2 * 0.3;
    group.add(inner);

    // Light
    const portalLight = new THREE.PointLight(0x8844ff, 3, 15);
    portalLight.position.set(0, 0, 0);
    group.add(portalLight);

    this.scene.add(group);
    this.levelObjects.push(group);

    this.portal = {
      mesh: group,
      position: new THREE.Vector3(x, y, z),
      ring,
      inner: innerMat
    };
  }

  addBedroomDecorations() {
    // Side walls/rails (soft colored blocks)
    const wallColors = [0xffaaaa, 0xaaffaa, 0xaaaaff, 0xffffaa, 0xffaaff];

    // Add some bedroom-themed decorations along the path
    for (let z = 5; z < 100; z += 8) {
      // Random pillows on sides
      const side = Math.random() > 0.5 ? 1 : -1;
      const pillowGeo = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 8, 6);
      pillowGeo.scale(1.3, 0.7, 1);
      const pillowMat = new THREE.MeshStandardMaterial({
        color: wallColors[Math.floor(Math.random() * wallColors.length)],
        roughness: 0.9
      });
      const pillow = new THREE.Mesh(pillowGeo, pillowMat);
      pillow.position.set(side * (5 + Math.random() * 3), 0, z);
      pillow.rotation.y = Math.random() * Math.PI;
      pillow.castShadow = true;
      this.scene.add(pillow);
      this.levelObjects.push(pillow);
    }

    // Stars in the sky
    for (let i = 0; i < 50; i++) {
      const starGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
      const starMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.5
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(
        (Math.random() - 0.5) * 80,
        20 + Math.random() * 30,
        Math.random() * 120
      );
      this.scene.add(star);
      this.levelObjects.push(star);
    }

    // Large toy blocks (decoration)
    const blockColors = [0xff5555, 0x55ff55, 0x5555ff, 0xffff55];
    for (let i = 0; i < 8; i++) {
      const size = 1 + Math.random() * 2;
      const blockGeo = new THREE.BoxGeometry(size, size, size);
      const blockMat = new THREE.MeshStandardMaterial({
        color: blockColors[Math.floor(Math.random() * blockColors.length)],
        roughness: 0.6
      });
      const block = new THREE.Mesh(blockGeo, blockMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      block.position.set(
        side * (8 + Math.random() * 5),
        size / 2,
        10 + Math.random() * 90
      );
      block.rotation.y = Math.random() * 0.5;
      block.castShadow = true;
      this.scene.add(block);
      this.levelObjects.push(block);
    }
  }

  addObstacle(obstacle) {
    this.obstacles.push(obstacle);
  }

  update(delta) {
    if (this.state.levelComplete || this.state.gameOver) return;

    // Update timer
    this.updateTimer(delta);

    // Update obstacles
    const obstacleSpeedMult = this.state.danceBoostActive ? 0.8 : 1.0;
    for (const obs of this.obstacles) {
      if (obs.update) obs.update(delta * obstacleSpeedMult);
    }

    // Check platform collisions
    this.checkPlatformCollisions();

    // Check checkpoint collisions
    this.checkCheckpoints();

    // Check portal collision
    this.checkPortal();

    // Check obstacle hazard collisions
    this.checkObstacleCollisions(delta);

    // Animate portal
    if (this.portal) {
      this.portal.ring.rotation.z += delta * 1.5;
      this.portal.inner.opacity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
      this.particles.spawnPortalParticles(this.portal.position, 1);
    }
  }

  updateTimer(delta) {
    this.state.levelTime += delta;
    this.state.collapsePercent = Math.min(
      (this.state.levelTime / this.state.levelDuration) * 100,
      100
    );

    // At 80%: warning effects
    if (this.state.collapsePercent >= 80 && this.state.collapsePercent < 100) {
      this.scene.background = new THREE.Color().lerpColors(
        new THREE.Color(0x88aaff),
        new THREE.Color(0x6633aa),
        (this.state.collapsePercent - 80) / 20
      );

      // Shake platforms slightly
      this.alarmTickTimer -= delta;
      if (this.alarmTickTimer <= 0) {
        this.audio.playAlarmTick();
        this.alarmTickTimer = 1.0;
      }
    }

    // At 100%: collapse
    if (this.state.collapsePercent >= 100) {
      this.onDreamCollapse();
    }
  }

  onDreamCollapse() {
    // Start removing platforms from behind
    if (!this._collapseStarted) {
      this._collapseStarted = true;
      this._collapseZ = this.character.position.z - 15;
      this.audio.playCollapse();
    }

    this._collapseZ += 0.1;

    // Remove platforms behind collapse line
    for (const plat of this.platforms) {
      if (plat.mesh && plat.bounds && plat.bounds.maxZ < this._collapseZ) {
        if (plat.mesh.visible) {
          plat.mesh.visible = false;
          plat.disabled = true;
        }
      }
    }

    // Game over if player is behind collapse
    if (this.character.position.z < this._collapseZ) {
      this.state.gameOver = true;
      this.state.playing = false;
      window.game.ui.showScreen('game-over');
    }
  }

  checkPlatformCollisions() {
    const char = this.character;
    const pos = char.position;
    const radius = char.colliderRadius;
    let onPlatform = false;

    for (const plat of this.platforms) {
      if (plat.disabled) continue;

      let bounds;
      if (plat.getBounds) {
        bounds = plat.getBounds();
      } else if (plat.bounds) {
        bounds = plat.bounds;
      } else {
        continue;
      }

      // Check horizontal overlap
      if (
        pos.x + radius > bounds.minX &&
        pos.x - radius < bounds.maxX &&
        pos.z + radius > bounds.minZ &&
        pos.z - radius < bounds.maxZ
      ) {
        // Check vertical (landing on top)
        if (
          pos.y >= bounds.maxY - 0.1 &&
          pos.y <= bounds.maxY + 1.5 &&
          char.velocity.y <= 0
        ) {
          char.setGrounded(bounds.maxY);
          onPlatform = true;

          // Handle collapsing platforms
          if (plat.onStep) plat.onStep();

          // Handle slippery
          if (plat.type === 'slippery') {
            char.velocity.x *= 1.02; // slight drift
          }
        }
        // Side collision (push back)
        else if (pos.y + 0.5 > bounds.minY && pos.y < bounds.maxY) {
          // Push character out
          const overlapX1 = (bounds.maxX) - (pos.x - radius);
          const overlapX2 = (pos.x + radius) - (bounds.minX);
          const overlapZ1 = (bounds.maxZ) - (pos.z - radius);
          const overlapZ2 = (pos.z + radius) - (bounds.minZ);

          const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);

          if (minOverlap === overlapX1 && char.velocity.x < 0) {
            pos.x = bounds.maxX + radius;
          } else if (minOverlap === overlapX2 && char.velocity.x > 0) {
            pos.x = bounds.minX - radius;
          }
        }
      }
    }

    if (!onPlatform) {
      char.grounded = false;
    }
  }

  checkCheckpoints() {
    const pos = this.character.position;

    for (const cp of this.checkpoints) {
      if (cp.triggered) continue;

      const dist = pos.distanceTo(cp.position);
      if (dist < 2.5) {
        cp.triggered = true;
        this.state.checkpointsReached++;
        this.state.spawnPosition = {
          x: cp.position.x,
          y: cp.position.y + 1,
          z: cp.position.z
        };
        this.state.addScore(100);

        // Celebration
        this.character.celebrate();
        this.audio.playCheckpoint();
        this.particles.spawnConfetti(cp.position, 40);

        // Show UI feedback
        const cpIcon = document.getElementById('checkpoint-icon');
        cpIcon.style.display = 'block';
        cpIcon.style.animation = 'none';
        cpIcon.offsetHeight; // reflow
        cpIcon.style.animation = 'checkpointFade 2s forwards';
        setTimeout(() => { cpIcon.style.display = 'none'; }, 2000);
      }
    }
  }

  checkPortal() {
    if (!this.portal) return;
    const dist = this.character.position.distanceTo(this.portal.position);

    if (dist < 3) {
      this.onLevelComplete();
    }
  }

  onLevelComplete() {
    this.state.levelComplete = true;
    this.state.addScore(500);

    // No falls bonus
    if (this.state.falls === 0) {
      this.state.addScore(300);
    }

    // Fast finish bonus (under half the time)
    const fastThreshold = this.state.levelDuration * 0.5;
    if (this.state.levelTime < fastThreshold) {
      const fastBonus = Math.floor(500 * (1 - this.state.levelTime / fastThreshold));
      this.state.addScore(fastBonus);
    }

    this.audio.playPortal();
    this.particles.spawnConfetti(this.character.position, 60);

    // Show level complete after short delay
    this.state.playing = false;
    setTimeout(() => {
      window.game.ui.showLevelComplete();
    }, 1000);
  }

  checkObstacleCollisions(delta) {
    const pos = this.character.position;

    for (const obs of this.obstacles) {
      if (!obs.getHazardBounds) continue;

      const hazards = obs.getHazardBounds();
      for (const h of hazards) {
        if (
          pos.x > h.minX && pos.x < h.maxX &&
          pos.y > h.minY && pos.y < h.maxY &&
          pos.z > h.minZ && pos.z < h.maxZ
        ) {
          if (obs.type === 'bouncy') {
            this.character.bounce(obs.bounceForce || 15);
            this.audio.playBounce();
          } else if (obs.type === 'cushion') {
            // Push player and small damage
            this.character.velocity.x += (Math.random() - 0.5) * 5;
            this.character.velocity.y = 3;
          }
        }
      }
    }
  }

  cleanup() {
    for (const obj of this.levelObjects) {
      this.scene.remove(obj);
      obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    for (const obs of this.obstacles) {
      if (obs.cleanup) obs.cleanup();
    }
    this.levelObjects = [];
    this.platforms = [];
    this.obstacles = [];
    this.checkpoints = [];
    this.portal = null;
    this.collapsingPlatforms = [];
    this._collapseStarted = false;
  }
}
