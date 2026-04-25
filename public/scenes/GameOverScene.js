/* ═══════════════════════════════════════════════════
   GameOverScene.js
   ═══════════════════════════════════════════════════ */

class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.nickname  = data.nickname;
    this.charName  = data.character;
    this.charColor = data.charColor;
    this.score     = data.score;
    this.level     = data.level;
  }

  async create() {
    this._drawBackground();
    this._deathAnimation();
    this._drawTitle();
    this._drawStats();
    this._drawButtons();

    const result = await window.saveScore({
      nickname:      this.nickname,
      character:     this.charName,
      score:         this.score,
      level_reached: this.level,
    });
    this._showRank(result.rank);
  }

  _drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a0000, 0x1a0000, 0x2a0808, 0x2a0808, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // Faint grid lines for drama
    g.lineStyle(1, 0xff0000, 0.05);
    for (let y = 0; y < GAME_H; y += 40) g.lineBetween(0, y, GAME_W, y);
  }

  _deathAnimation() {
    const char = this.add.container(GAME_W / 2, 160);

    // Body
    const body = this.add.rectangle(0, 0, 72, 28, this.charColor || 0xff6b35);
    body.setStrokeStyle(2, 0x000000, 0.5);
    char.add(body);

    // Cape
    const cape = this.add.triangle(
      -36 - 16, 0, -36, -12, -36, 12, -36 - 24, 0, 0xCC0000
    );
    char.add(cape);

    // Fist
    const fist = this.add.circle(48, 0, 10, this.charColor || 0xff6b35);
    fist.setStrokeStyle(2, 0x000000, 0.5);
    char.add(fist);

    // Initial
    const initial = (this.charName || 'H').split(' ').map(w => w[0]).join('').slice(0, 2);
    const lbl = this.add.text(0, 0, initial, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    char.add(lbl);

    // Death spin + fall
    this.tweens.add({
      targets: char,
      angle:   { from: 0,   to: 720 },
      scaleX:  { from: 1,   to: 0.2 },
      scaleY:  { from: 1,   to: 0.2 },
      y:       { from: 160, to: 300 },
      alpha:   { from: 1,   to: 0   },
      duration: 1200,
      ease: 'Cubic.In',
    });

    // Flash red on screen
    this.cameras.main.flash(600, 180, 0, 0);
    this.cameras.main.shake(400, 0.012);
  }

  _drawTitle() {
    const goText = this.add.text(GAME_W / 2, 240, 'GAME OVER', {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '54px',
      color: '#ff4444',
      stroke: '#880000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: goText,
      alpha: 1,
      scaleX: { from: 1.4, to: 1 },
      scaleY: { from: 1.4, to: 1 },
      duration: 500,
      delay: 800,
      ease: 'Back.Out',
    });

    // Pulse
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: goText,
        alpha: { from: 1, to: 0.6 },
        duration: 700,
        yoyo: true, repeat: -1,
      });
    });
  }

  _drawStats() {
    const panelY = 320;
    const bg = this.add.rectangle(GAME_W / 2, panelY + 50, GAME_W - 40, 110, 0x2a0808, 0.9);
    bg.setStrokeStyle(2, 0x880000, 0.7);

    this.add.text(GAME_W / 2, panelY, `Final Score: ${this.score}`, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '28px',
      color: '#f7c948',
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, panelY + 42, `Reached Level ${this.level}`, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '18px',
      color: '#ffaaaa',
    }).setOrigin(0.5);

    this._rankText = this.add.text(GAME_W / 2, panelY + 80, 'Checking rank…', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '15px',
      color: '#88ccff',
    }).setOrigin(0.5);
  }

  _showRank(rank) {
    if (rank === null || rank === undefined) {
      this._rankText.setText('');
      return;
    }
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    this._rankText.setText(`You are #${rank}${suffix} globally! 🌍`);
    if (rank <= 3) this._rankText.setColor('#f7c948');
  }

  _drawButtons() {
    this._makeBtn(GAME_W / 2, 490, 'Play Again', 0xf7c948, '#1a0000', () => {
      this.scene.start('MenuScene', { nickname: this.nickname });
    });

    this._makeBtn(GAME_W / 2, 545, 'View Leaderboard', 0x550000, '#ffaaaa', () => {
      window.showLeaderboard(this.nickname);
    });
  }

  _makeBtn(x, y, label, bg, textCol, onClick) {
    const btn = this.add.rectangle(x, y, 220, 44, bg).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(2, 0xffffff, 0.15);
    const txt = this.add.text(x, y, label, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '20px',
      color: textCol,
    }).setOrigin(0.5);
    btn.on('pointerover',  () => { btn.setAlpha(0.82); txt.setScale(1.04); });
    btn.on('pointerout',   () => { btn.setAlpha(1);    txt.setScale(1);    });
    btn.on('pointerdown',  () => onClick());
  }
}
