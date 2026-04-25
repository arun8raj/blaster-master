/* ═══════════════════════════════════════════════════
   LevelCompleteScene.js
   ═══════════════════════════════════════════════════ */

class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelCompleteScene' }); }

  init(data) {
    this.nickname    = data.nickname;
    this.charName    = data.character;
    this.charColor   = data.charColor;
    this.charTextCol = data.charTextCol;
    this.score       = data.score;
    this.level       = data.level;
    this.lives       = data.lives;
    this.correct     = data.correct;
    this.attempts    = data.attempts;
    this._saved      = false;
  }

  async create() {
    this._drawBackground();
    this._drawStars();
    this._drawTitle();
    this._drawStats();
    this._drawButtons();

    // Save score and show rank
    const result = await window.saveScore({
      nickname:      this.nickname,
      character:     this.charName,
      score:         this.score,
      level_reached: this.level,
    });
    this._saved = true;
    this._showRank(result.rank);
  }

  _drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a1f0a, 0x0a1f0a, 0x0d2b0d, 0x0d2b0d, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
  }

  _drawStars() {
    // Confetti-style coloured dots
    const cols = [0xf7c948, 0xff6b9d, 0x88ff88, 0x44ccff, 0xff9944];
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_W);
      const y = Phaser.Math.Between(0, GAME_H);
      const c = cols[i % cols.length];
      const r = Phaser.Math.Between(2, 5);
      const dot = this.add.circle(x, y, r, c).setAlpha(0.7);
      this.tweens.add({
        targets: dot,
        y: y + Phaser.Math.Between(80, 200),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 2400),
        delay: Phaser.Math.Between(0, 600),
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  _drawTitle() {
    const title = this.add.text(GAME_W / 2, 90, `Level ${this.level} Complete!`, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '40px',
      color: '#f7c948',
      stroke: '#774400',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: title,
      scaleX: 1, scaleY: 1,
      duration: 450,
      ease: 'Back.Out',
    });

    // Bounce loop
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: title,
        y: title.y - 10,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    this.add.text(GAME_W / 2, 145, '🎉  Keep blasting!  🎉', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '18px',
      color: '#aaffaa',
    }).setOrigin(0.5);
  }

  _drawStats() {
    const accuracy = this.attempts > 0
      ? Math.round((this.correct / this.attempts) * 100)
      : 100;

    const lines = [
      { label: 'Correct answers', value: `${this.correct} / ${this.attempts}` },
      { label: 'Accuracy',        value: `${accuracy}%` },
      { label: 'Total score',     value: String(this.score) },
    ];

    const panelY = 220;
    const bg = this.add.rectangle(GAME_W / 2, panelY + 55, GAME_W - 40, 130, 0x1a3a1a, 0.85);
    bg.setStrokeStyle(2, 0x4a8a4a, 0.7);

    lines.forEach((line, i) => {
      const y = panelY + i * 42;
      this.add.text(60, y, line.label, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '16px',
        color: '#aaddaa',
      });
      this.add.text(GAME_W - 60, y, line.value, {
        fontFamily: "'Fredoka One', cursive",
        fontSize: '20px',
        color: '#f7c948',
      }).setOrigin(1, 0);
    });

    // Rank placeholder — filled in after save
    this._rankText = this.add.text(GAME_W / 2, panelY + 138, 'Checking rank…', {
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
    this._makeBtn(GAME_W / 2, 430, 'Next Level ▶', 0xf7c948, '#1a2a0a', () => {
      this.scene.start('GameScene', {
        nickname:    this.nickname,
        character:   this.charName,
        charColor:   this.charColor,
        charTextCol: this.charTextCol,
        score:       this.score,
        level:       this.level + 1,
        lives:       this.lives,
      });
    });

    this._makeBtn(GAME_W / 2, 490, 'View Leaderboard', 0x2d5a2d, '#ffffff', () => {
      window.showLeaderboard(this.nickname);
    });

    this._makeBtn(GAME_W / 2, 545, 'Exit to Menu', 0x2a2a2a, '#cccccc', () => {
      this.scene.start('MenuScene', { nickname: this.nickname });
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
