export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      dance: false,
      r: false
    };

    this._jumpPressed = false;
    this._dancePressed = false;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this.keys.forward = true; break;
      case 'KeyA': case 'ArrowLeft':
        this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight':
        this.keys.right = true; break;
      case 'Space':
        e.preventDefault();
        if (!this._jumpPressed) {
          this.keys.jump = true;
          this._jumpPressed = true;
        }
        break;
      case 'ShiftLeft': case 'ShiftRight':
        this.keys.sprint = true; break;
      case 'KeyE':
        if (!this._dancePressed) {
          this.keys.dance = true;
          this._dancePressed = true;
        }
        break;
      case 'KeyR':
        this.keys.r = true; break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this.keys.forward = false; break;
      case 'KeyA': case 'ArrowLeft':
        this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight':
        this.keys.right = false; break;
      case 'Space':
        this._jumpPressed = false; break;
      case 'ShiftLeft': case 'ShiftRight':
        this.keys.sprint = false; break;
      case 'KeyE':
        this._dancePressed = false; break;
      case 'KeyR':
        this.keys.r = false; break;
    }
  }

  update() {
    // Jump and dance are consumed per-frame
  }

  consumeJump() {
    if (this.keys.jump) {
      this.keys.jump = false;
      return true;
    }
    return false;
  }

  consumeDance() {
    if (this.keys.dance) {
      this.keys.dance = false;
      return true;
    }
    return false;
  }
}
