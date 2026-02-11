export class UIManager {
  constructor(state, game) {
    this.state = state;
    this.game = game;
    this.screens = {
      'main-menu': document.getElementById('main-menu'),
      'hud': document.getElementById('hud'),
      'level-complete': document.getElementById('level-complete'),
      'game-over': document.getElementById('game-over')
    };

    this.setupButtons();
  }

  setupButtons() {
    // Main menu
    document.getElementById('btn-play').addEventListener('click', () => {
      this.game.audio.init();
      this.game.startGame();
    });

    document.getElementById('btn-level-select').addEventListener('click', () => {
      this.game.audio.init();
      this.game.startGame(); // For MVP, just start level 1
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      // Settings placeholder
      alert('Settings coming soon!');
    });

    // Level complete
    document.getElementById('btn-next-level').addEventListener('click', () => {
      this.game.restartLevel(); // For MVP, replay level 1
    });

    document.getElementById('btn-replay').addEventListener('click', () => {
      this.game.restartLevel();
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      this.game.showMenu();
    });

    // Game over
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.game.restartLevel();
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      this.game.showMenu();
    });
  }

  showScreen(id) {
    for (const [name, el] of Object.entries(this.screens)) {
      el.style.display = name === id ? '' : 'none';
    }
  }

  showLevelComplete() {
    const stars = this.state.getStarRating();
    const starsEl = document.getElementById('stars-display');

    // Create star display
    let starHTML = '';
    for (let i = 0; i < 3; i++) {
      if (i < stars) {
        starHTML += '<span style="color: #FFD700; text-shadow: 0 0 10px #FFD700;">&#9733;</span>';
      } else {
        starHTML += '<span style="color: #555;">&#9733;</span>';
      }
    }
    starsEl.innerHTML = starHTML;

    document.getElementById('final-score').textContent = this.state.score;

    // Bonus text
    const bonuses = [];
    if (this.state.falls === 0) bonuses.push('No Falls Bonus: +300');
    if (this.state.levelTime < this.state.levelDuration * 0.5) bonuses.push('Speed Bonus!');
    document.getElementById('bonus-text').textContent = bonuses.join(' | ');

    this.showScreen('level-complete');
  }

  update(delta) {
    if (!this.state.playing) return;

    // Update timer bar
    const timerBar = document.getElementById('timer-bar');
    const timerLabel = document.getElementById('timer-label');
    timerBar.style.width = `${this.state.collapsePercent}%`;

    if (this.state.collapsePercent < 50) {
      timerLabel.textContent = 'Dream Stable';
    } else if (this.state.collapsePercent < 80) {
      timerLabel.textContent = 'Dream Weakening...';
    } else {
      timerLabel.textContent = 'DREAM COLLAPSING!';
    }

    // Update score
    document.getElementById('score-value').textContent = this.state.score;

    // Update dance cooldown
    const danceBar = document.getElementById('dance-cooldown-bar');
    const danceLabel = document.getElementById('dance-label');

    if (this.state.danceBoostActive) {
      const pct = (this.state.danceBoostTimer / this.state.danceBoostDuration) * 100;
      danceBar.style.width = `${pct}%`;
      danceBar.style.background = 'linear-gradient(90deg, #ff00ff, #ffff00)';
      danceLabel.textContent = 'DANCING!';
    } else if (this.state.danceBoostCooldown > 0) {
      const pct = (1 - this.state.danceBoostCooldown / this.state.danceBoostCooldownDuration) * 100;
      danceBar.style.width = `${pct}%`;
      danceBar.style.background = 'linear-gradient(90deg, #666, #888)';
      danceLabel.textContent = `Cooldown ${Math.ceil(this.state.danceBoostCooldown)}s`;
    } else {
      danceBar.style.width = '100%';
      danceBar.style.background = 'linear-gradient(90deg, #e040fb, #7c4dff)';
      danceLabel.textContent = 'Dance [E]';
    }

    // Update gameover score
    document.getElementById('gameover-score').textContent = this.state.score;
  }
}
