import * as THREE from 'three';

// Base obstacle wrapper
class Obstacle {
  constructor(mesh, scene, type = 'hazard') {
    this.mesh = mesh;
    this.scene = scene;
    this.type = type;
    this.disabled = false;
    scene.add(mesh);
  }

  update(delta) {}
  getHazardBounds() { return []; }
  getBounds() { return null; }
  cleanup() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

// Rotating Pillow - slow rotating bar
class RotatingPillow extends Obstacle {
  constructor(scene, x, y, z, length) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Center post
    const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const post = new THREE.Mesh(postGeo, postMat);
    post.castShadow = true;
    group.add(post);

    // Bar with pillows
    const barGroup = new THREE.Group();

    const barGeo = new THREE.CylinderGeometry(0.1, 0.1, length, 6);
    barGeo.rotateZ(Math.PI / 2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const bar = new THREE.Mesh(barGeo, barMat);
    barGroup.add(bar);

    // Pillows on ends
    for (const side of [-1, 1]) {
      const pillowGeo = new THREE.SphereGeometry(0.5, 8, 6);
      pillowGeo.scale(1.2, 0.8, 0.8);
      const pillowMat = new THREE.MeshStandardMaterial({
        color: side === 1 ? 0xffaacc : 0xaaccff,
        roughness: 0.9
      });
      const pillow = new THREE.Mesh(pillowGeo, pillowMat);
      pillow.position.x = side * (length / 2 - 0.3);
      pillow.castShadow = true;
      barGroup.add(pillow);
    }

    group.add(barGroup);

    super(group, scene, 'hazard');
    this.barGroup = barGroup;
    this.speed = 1.5;
    this.length = length;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  update(delta) {
    this.barGroup.rotation.y += this.speed * delta;
  }

  getHazardBounds() {
    // Return bounding boxes for the rotating ends
    const angle = this.barGroup.rotation.y;
    const halfLen = this.length / 2;
    const bounds = [];

    for (const side of [-1, 1]) {
      const px = this.x + Math.cos(angle) * halfLen * side;
      const pz = this.z + Math.sin(angle) * halfLen * side;
      bounds.push({
        minX: px - 0.6, maxX: px + 0.6,
        minY: this.y - 0.5, maxY: this.y + 0.5,
        minZ: pz - 0.6, maxZ: pz + 0.6
      });
    }
    return bounds;
  }
}

// Bouncy Bed - jump pad
class BouncyBed extends Obstacle {
  constructor(scene, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Bed frame
    const frameGeo = new THREE.BoxGeometry(2.5, 0.3, 2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // Mattress (bouncy)
    const mattGeo = new THREE.BoxGeometry(2.3, 0.4, 1.8);
    const mattMat = new THREE.MeshStandardMaterial({
      color: 0xff8899,
      roughness: 0.9,
      emissive: 0xff4466,
      emissiveIntensity: 0.2
    });
    const mattress = new THREE.Mesh(mattGeo, mattMat);
    mattress.position.y = 0.35;
    mattress.castShadow = true;
    group.add(mattress);

    // Springs visual
    for (let i = 0; i < 3; i++) {
      const springGeo = new THREE.TorusGeometry(0.15, 0.03, 6, 8);
      const springMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.position.set(-0.6 + i * 0.6, 0.15, 0);
      spring.rotation.x = Math.PI / 2;
      group.add(spring);
    }

    super(group, scene, 'bouncy');
    this.bounceForce = 18;
    this.x = x;
    this.y = y;
    this.z = z;
    this.bobPhase = 0;
    this.mattress = mattress;
  }

  update(delta) {
    this.bobPhase += delta * 3;
    this.mattress.position.y = 0.35 + Math.sin(this.bobPhase) * 0.05;
  }

  getHazardBounds() {
    return [{
      minX: this.x - 1.15, maxX: this.x + 1.15,
      minY: this.y + 0.2, maxY: this.y + 1.0,
      minZ: this.z - 0.9, maxZ: this.z + 0.9
    }];
  }
}

// Moving Platform
class MovingPlatform extends Obstacle {
  constructor(scene, x, y, z, w, h, d, axis, range, speed) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x88bbff,
      roughness: 0.5,
      emissive: 0x4488cc,
      emissiveIntensity: 0.15
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y - h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    super(mesh, scene, 'platform');
    this.originX = x;
    this.originY = y;
    this.originZ = z;
    this.w = w;
    this.h = h;
    this.d = d;
    this.axis = axis;
    this.range = range;
    this.speed = speed;
    this.phase = 0;
  }

  update(delta) {
    this.phase += delta * this.speed;
    const offset = Math.sin(this.phase) * this.range;

    if (this.axis === 'x') {
      this.mesh.position.x = this.originX + offset;
    } else if (this.axis === 'y') {
      this.mesh.position.y = this.originY + offset - this.h / 2;
    } else {
      this.mesh.position.z = this.originZ + offset;
    }
  }

  getBounds() {
    const pos = this.mesh.position;
    return {
      minX: pos.x - this.w / 2,
      maxX: pos.x + this.w / 2,
      minY: pos.y - this.h / 2,
      maxY: pos.y + this.h / 2,
      minZ: pos.z - this.d / 2,
      maxZ: pos.z + this.d / 2
    };
  }
}

// Slippery Floor
class SlipperyFloor extends Obstacle {
  constructor(scene, x, y, z, w, d) {
    const geo = new THREE.BoxGeometry(w, 0.05, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xaaeeff,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;

    super(mesh, scene, 'slippery');
    this.type = 'slippery';
  }
}

// Falling Cushions Zone
class FallingCushionZone extends Obstacle {
  constructor(scene, x, y, z, w, d) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    super(group, scene, 'cushion');

    this.cushions = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
    this.zoneX = x;
    this.zoneY = y;
    this.zoneZ = z;
    this.zoneW = w;
    this.zoneD = d;
    this.scene = scene;
  }

  update(delta) {
    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnCushion();
    }

    // Update existing cushions
    for (let i = this.cushions.length - 1; i >= 0; i--) {
      const c = this.cushions[i];
      c.velocity += -15 * delta;
      c.mesh.position.y += c.velocity * delta;
      c.mesh.rotation.x += delta * 2;

      if (c.mesh.position.y < -5) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        this.cushions.splice(i, 1);
      }
    }
  }

  spawnCushion() {
    const colors = [0xff8888, 0x88ff88, 0x8888ff, 0xffff88];
    const size = 0.5 + Math.random() * 0.3;
    const geo = new THREE.SphereGeometry(size, 8, 6);
    geo.scale(1.2, 0.6, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      this.zoneX + (Math.random() - 0.5) * this.zoneW,
      this.zoneY,
      this.zoneZ + (Math.random() - 0.5) * this.zoneD
    );
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.cushions.push({ mesh, velocity: 0 });
  }

  getHazardBounds() {
    return this.cushions.map(c => ({
      minX: c.mesh.position.x - 0.5,
      maxX: c.mesh.position.x + 0.5,
      minY: c.mesh.position.y - 0.3,
      maxY: c.mesh.position.y + 0.3,
      minZ: c.mesh.position.z - 0.5,
      maxZ: c.mesh.position.z + 0.5
    }));
  }

  cleanup() {
    super.cleanup();
    for (const c of this.cushions) {
      this.scene.remove(c.mesh);
      c.mesh.geometry.dispose();
      c.mesh.material.dispose();
    }
    this.cushions = [];
  }
}

// Collapsing Platform
class CollapsingPlatform extends Obstacle {
  constructor(scene, x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffcc77,
      roughness: 0.6,
      emissive: 0xff8800,
      emissiveIntensity: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y - h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    super(mesh, scene, 'platform');

    this.originX = x;
    this.originY = y;
    this.originZ = z;
    this.w = w;
    this.h = h;
    this.d = d;
    this.stepped = false;
    this.collapseTimer = 0;
    this.collapseDelay = 1.0; // seconds before falling
    this.fallen = false;
    this.fallVelocity = 0;
    this.shakePhase = 0;
    this.mat = mat;
  }

  onStep() {
    if (!this.stepped) {
      this.stepped = true;
    }
  }

  update(delta) {
    if (this.stepped && !this.fallen) {
      this.collapseTimer += delta;

      // Shake
      this.shakePhase += delta * 30;
      this.mesh.position.x = this.originX + Math.sin(this.shakePhase) * 0.05;
      this.mat.emissiveIntensity = 0.1 + (this.collapseTimer / this.collapseDelay) * 0.5;

      if (this.collapseTimer >= this.collapseDelay) {
        this.fallen = true;
      }
    }

    if (this.fallen) {
      this.fallVelocity += -20 * delta;
      this.mesh.position.y += this.fallVelocity * delta;
      this.mesh.rotation.x += delta * 2;

      if (this.mesh.position.y < -30) {
        this.disabled = true;
        this.mesh.visible = false;
      }
    }
  }

  getBounds() {
    if (this.disabled || this.fallen) return null;
    const pos = this.mesh.position;
    return {
      minX: pos.x - this.w / 2,
      maxX: pos.x + this.w / 2,
      minY: pos.y - this.h / 2,
      maxY: pos.y + this.h / 2,
      minZ: pos.z - this.d / 2,
      maxZ: pos.z + this.d / 2
    };
  }
}

export class ObstacleFactory {
  constructor(scene) {
    this.scene = scene;
  }

  createRotatingPillow(x, y, z, length = 5) {
    return new RotatingPillow(this.scene, x, y, z, length);
  }

  createBouncyBed(x, y, z) {
    return new BouncyBed(this.scene, x, y, z);
  }

  createMovingPlatform(x, y, z, w, h, d, axis, range, speed) {
    return new MovingPlatform(this.scene, x, y, z, w, h, d, axis, range, speed);
  }

  createSlipperyFloor(x, y, z, w, d) {
    return new SlipperyFloor(this.scene, x, y, z, w, d);
  }

  createFallingCushionZone(x, y, z, w, d) {
    return new FallingCushionZone(this.scene, x, y, z, w, d);
  }

  createCollapsingPlatform(x, y, z, w, h, d) {
    return new CollapsingPlatform(this.scene, x, y, z, w, h, d);
  }
}
