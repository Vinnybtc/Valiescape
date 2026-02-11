export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.playing = false;
    this.paused = false;
    this.score = 0;
    this.falls = 0;
    this.danceBoostsUsed = 0;
    this.checkpointsReached = 0;
    this.currentLevel = 1;
    this.levelTime = 0;
    this.levelDuration = 90; // seconds for the dream to collapse
    this.collapsePercent = 0;
    this.levelComplete = false;
    this.gameOver = false;

    // Dance boost
    this.danceBoostActive = false;
    this.danceBoostTimer = 0;
    this.danceBoostCooldown = 0;
    this.danceBoostDuration = 3;
    this.danceBoostCooldownDuration = 10;

    // Checkpoint
    this.lastCheckpoint = null;
    this.spawnPosition = { x: 0, y: 2, z: 0 };
  }

  addScore(points) {
    this.score += points;
  }

  getStarRating() {
    const fastThreshold = this.levelDuration * 0.5;
    const fast = this.levelTime < fastThreshold;
    const noFalls = this.falls === 0;

    if (noFalls && fast) return 3;
    if (fast || noFalls) return 2;
    return 1;
  }
}
