import * as THREE from 'three';

class Particle {
  constructor(mesh, velocity, lifetime, gravity = -5) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.gravity = gravity;
  }

  update(delta) {
    this.velocity.y += this.gravity * delta;
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
    this.lifetime -= delta;

    const t = this.lifetime / this.maxLifetime;
    this.mesh.material.opacity = t;
    this.mesh.scale.setScalar(t * 0.8 + 0.2);
    return this.lifetime > 0;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawnConfetti(position, count = 30) {
    const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff6bcb, 0xffa94d];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(0.15, 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += 2;
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 6
      );

      this.particles.push(new Particle(mesh, vel, 2 + Math.random(), -8));
    }
  }

  spawnSparkles(position, count = 5) {
    const colors = [0xff00ff, 0xffff00, 0x00ffff, 0xff88ff];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.y += Math.random() * 2;
      mesh.position.z += (Math.random() - 0.5) * 1.5;
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );

      this.particles.push(new Particle(mesh, vel, 0.6 + Math.random() * 0.4, -3));
    }
  }

  spawnPortalParticles(position, count = 15) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 1, 0.6),
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random();
      mesh.position.set(
        position.x + Math.cos(angle) * radius,
        position.y + Math.random() * 3,
        position.z + Math.sin(angle) * radius
      );
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        -Math.cos(angle) * 2,
        Math.random() * 2 + 1,
        -Math.sin(angle) * 2
      );

      this.particles.push(new Particle(mesh, vel, 1 + Math.random(), -1));
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(delta);
      if (!alive) {
        this.scene.remove(this.particles[i].mesh);
        this.particles[i].mesh.geometry.dispose();
        this.particles[i].mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  cleanup() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles = [];
  }
}
