/* ═══════════════════════════════════════════════════
   GameScene.js
   ═══════════════════════════════════════════════════ */

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── init ───────────────────────────────────────────────
  init(data) {
    this.nickname    = data.nickname;
    this.charName    = data.character;
    this.charColor   = data.charColor;
    this.charTextCol = data.charTextCol;
    this.score       = data.score   ?? 0;
    this.level       = data.level   ?? 1;
    this.lives       = data.lives   ?? CONFIG.startingLives;

    this.correctThisLevel  = 0;
    this.attemptsThisLevel = 0;
    this.timeLeft          = CONFIG.levelTimeSeconds;
    this.currentQuestion   = null;
    this.answerBlocks      = [];    // [{rect, label, glow, isCorrect}]
    this.debrisItems       = [];    // [{circle, label}]
    this._scoreSaved       = false;
    this._transitioning    = false;
    this._debrisTimer      = 0;
    this._debrisInterval   = this._calcDebrisInterval();
    this._blockSpeed       = this._calcBlockSpeed();
    this._debrisSpeed      = this._calcDebrisSpeed();
  }

  // ── create ─────────────────────────────────────────────
  create() {
    this._drawBackground();
    this._createHUD();
    this._createQuestionDisplay();
    this._createCharacter();
    this._setupInput();
    this._setupDividers();

    // Start first question & blocks after a short delay
    this.time.delayedCall(400, () => {
      this._nextQuestion();
      this._spawnAnswerBlocks();
    });

    // 1-second countdown tick
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this._tickTimer,
      callbackScope: this,
    });

    // Speed ramp within level (every 15 s increase speed 10%)
    this._rampEvent = this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => {
        this._blockSpeed  *= 1.10;
        this._debrisSpeed *= 1.10;
      },
    });
  }

  // ── background ─────────────────────────────────────────
  _drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d0d2e, 0x0d0d2e, 0x0a1428, 0x0a1428, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // Starfield
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_W);
      const y = Phaser.Math.Between(50, GAME_H - 60);
      g.fillStyle(0xffffff, 0.15 + Math.random() * 0.4);
      g.fillCircle(x, y, Math.random() < 0.2 ? 2 : 1);
    }
  }

  _setupDividers() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x334466, 0.5);
    g.lineBetween(0, 50, GAME_W, 50);   // below top HUD
    g.lineBetween(0, 120, GAME_W, 120); // below question
    g.lineBetween(0, GAME_H - 50, GAME_W, GAME_H - 50); // above bottom HUD
  }

  // ── HUD ────────────────────────────────────────────────
  _createHUD() {
    // Hearts (lives)
    this._heartTexts = [];
    for (let i = 0; i < CONFIG.startingLives; i++) {
      const t = this.add.text(18 + i * 28, 14, '❤️', {
        fontSize: '20px',
      }).setOrigin(0, 0.5);
      this._heartTexts.push(t);
    }

    // Level label
    this._levelText = this.add.text(GAME_W / 2, 25, `Level ${this.level}`, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '20px',
      color: '#f7c948',
    }).setOrigin(0.5);

    // Timer
    this._timerText = this.add.text(GAME_W - 14, 25, this._formatTime(this.timeLeft), {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#aaddff',
    }).setOrigin(1, 0.5);

    // Score (bottom HUD)
    this._scoreLabel = this.add.text(GAME_W / 2, GAME_H - 25, `Score: ${this.score}`, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '22px',
      color: '#f7c948',
    }).setOrigin(0.5);
  }

  _updateHUD() {
    // Hearts
    this._heartTexts.forEach((t, i) => {
      t.setText(i < this.lives ? '❤️' : '🖤');
    });
    this._timerText.setText(this._formatTime(this.timeLeft));
    this._levelText.setText(`Level ${this.level}`);
    this._scoreLabel.setText(`Score: ${this.score}`);
  }

  _formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Question display ────────────────────────────────────
  _createQuestionDisplay() {
    this._questionBg = this.add.rectangle(GAME_W / 2, 85, GAME_W - 20, 54, 0x1a2a4a).setAlpha(0.7);
    this._questionText = this.add.text(GAME_W / 2, 85, '', {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '34px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  // ── Character ──────────────────────────────────────────
  _createCharacter() {
    const startX = GAME_W / 2;
    const startY = GAME_H - 110;

    // Body: wide rectangle, tilted like Superman horizontal pose
    this._char = this.add.container(startX, startY);

    const bodyW = 72, bodyH = 28;
    const body = this.add.rectangle(0, 0, bodyW, bodyH, this.charColor);
    body.setStrokeStyle(2, 0x000000, 0.5);
    this._char.add(body);

    // Cape trailing behind
    const cape = this.add.triangle(
      -bodyW / 2 - 16, 0,
      -bodyW / 2,      -12,
      -bodyW / 2,       12,
      -bodyW / 2 - 24,  0,
      0xCC0000
    );
    this._char.add(cape);

    // Fist forward (right side)
    const fist = this.add.circle(bodyW / 2 + 12, 0, 10, this.charColor);
    fist.setStrokeStyle(2, 0x000000, 0.5);
    this._char.add(fist);

    // Character initial
    const initial = this.charName.split(' ').map(w => w[0]).join('').slice(0, 2);
    const label = this.add.text(0, 0, initial, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '14px',
      color: this.charTextCol,
    }).setOrigin(0.5);
    this._char.add(label);

    this._char.setAngle(-12);

    // Physics body on an invisible rect for collision
    this._charHitbox = this.add.rectangle(startX, startY, bodyW + 24, bodyH + 10, 0x000000, 0);
    this.physics.add.existing(this._charHitbox);
    this._charHitbox.body.setAllowGravity(false);
    this._charHitbox.body.setImmovable(true);

    this._charVelX = 0;
    this._charVelY = 0;
  }

  // ── Input ──────────────────────────────────────────────
  _setupInput() {
    this._cursors = this.input.keyboard.createCursorKeys();
  }

  // ── Timer tick ─────────────────────────────────────────
  _tickTimer() {
    if (this._transitioning) return;
    this.timeLeft--;
    this._updateHUD();

    if (this.timeLeft <= 10) {
      this._timerText.setColor('#ff6b6b');
      if (this.timeLeft % 2 === 0) {
        this.cameras.main.shake(80, 0.003);
      }
    }

    if (this.timeLeft <= 0) {
      this._timerText.setColor('#aaddff');
      this._onTimerExpired();
    }
  }

  _onTimerExpired() {
    this._transitioning = true;
    this.lives--;
    this._updateHUD();

    if (this.lives <= 0) {
      this._triggerGameOver();
    } else {
      this._showBanner("⏰  Time's Up! −1 Life", '#ff6b6b', () => {
        this._retryLevel();
      });
    }
  }

  // ── Speed helpers ───────────────────────────────────────
  _calcBlockSpeed() {
    return 90 + (this.level - 1) * 18;
  }
  _calcDebrisSpeed() {
    return 70 + (this.level - 1) * 20;
  }
  _calcDebrisInterval() {
    return Math.max(800, 2200 - (this.level - 1) * 180);
  }

  // ── Question & answer blocks ────────────────────────────
  _nextQuestion() {
    this.currentQuestion = generateQuestion(this.level);
    this._questionText.setText(this.currentQuestion.questionText);

    // Pulse the question text
    this.tweens.add({
      targets: this._questionText,
      scaleX: { from: 1.15, to: 1 },
      scaleY: { from: 1.15, to: 1 },
      duration: 250,
      ease: 'Back.Out',
    });
  }

  _spawnAnswerBlocks() {
    if (this._transitioning) return;

    // Clear old blocks
    this._clearAnswerBlocks();

    const correct = this.currentQuestion.correct;
    const wrong   = this.currentQuestion.wrong;
    const showGlow = this.level <= 2;

    // Randomise which side correct goes on
    const correctOnLeft = Math.random() < 0.5;
    const leftVal  = correctOnLeft ? correct : wrong;
    const rightVal = correctOnLeft ? wrong   : correct;

    const yStart = 130;
    const blockSize = 64;
    const positions = [
      GAME_W * 0.28,
      GAME_W * 0.72,
    ];

    [leftVal, rightVal].forEach((val, i) => {
      const isCorrect = (i === 0 && correctOnLeft) || (i === 1 && !correctOnLeft);
      const x = positions[i];
      this._createAnswerBlock(x, yStart, val, isCorrect, showGlow);
    });
  }

  _createAnswerBlock(x, y, value, isCorrect, showGlow) {
    const size = 64;

    // Glow halo (levels 1-2, correct only)
    let glowObj = null;
    if (showGlow && isCorrect) {
      glowObj = this.add.rectangle(x, y, size + 18, size + 18, 0xFFD700).setAlpha(0.35);
      this.physics.add.existing(glowObj);
      glowObj.body.setVelocityY(this._blockSpeed);
      glowObj.body.setAllowGravity(false);
      this.tweens.add({
        targets: glowObj, alpha: { from: 0.15, to: 0.55 },
        duration: 500, yoyo: true, repeat: -1,
      });
    }

    // Block face — Mario brick style
    const g = this.add.graphics();
    g.x = x - size / 2;
    g.y = y - size / 2;
    // Main fill
    g.fillStyle(0xCC8822); g.fillRect(0, 0, size, size);
    // Top highlight
    g.fillStyle(0xEEAA44); g.fillRect(2, 2, size - 4, 10);
    // Bottom shadow
    g.fillStyle(0x995500); g.fillRect(2, size - 12, size - 4, 10);
    // Outline
    g.lineStyle(3, 0x553300, 1); g.strokeRect(0, 0, size, size);

    // We need a physics body for collision — use an invisible rect
    const hitRect = this.add.rectangle(x, y, size, size, 0x000000, 0);
    this.physics.add.existing(hitRect);
    hitRect.body.setVelocityY(this._blockSpeed);
    hitRect.body.setAllowGravity(false);

    // Number label
    const label = this.add.text(x, y, String(value), {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#553300',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.answerBlocks.push({ hitRect, graphics: g, label, glowObj, isCorrect, value });

    // Overlap with character hitbox
    this.physics.add.overlap(this._charHitbox, hitRect, () => {
      this._onBlockHit(hitRect, isCorrect);
    });
  }

  _clearAnswerBlocks() {
    this.answerBlocks.forEach(b => {
      if (b.hitRect)   { b.hitRect.destroy(); }
      if (b.graphics)  { b.graphics.destroy(); }
      if (b.label)     { b.label.destroy(); }
      if (b.glowObj)   { b.glowObj.destroy(); }
    });
    this.answerBlocks = [];
  }

  // ── Debris ─────────────────────────────────────────────
  _spawnDebris() {
    if (this._transitioning) return;

    const type = DEBRIS_TYPES[Phaser.Math.Between(0, DEBRIS_TYPES.length - 1)];
    const x    = Phaser.Math.Between(30, GAME_W - 30);
    const y    = 115;
    const r    = 26;

    const circle = this.add.circle(x, y, r, type.color);
    circle.setStrokeStyle(2, 0x000000, 0.5);
    this.physics.add.existing(circle);
    circle.body.setVelocityY(this._debrisSpeed + Phaser.Math.Between(-20, 20));
    circle.body.setAllowGravity(false);

    const label = this.add.text(x, y, type.label.slice(0, 6), {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Wobble / spin animation
    this.tweens.add({
      targets: [circle, label],
      angle: { from: -18, to: 18 },
      duration: 300 + Phaser.Math.Between(0, 200),
      yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    const item = { circle, label };
    this.debrisItems.push(item);

    this.physics.add.overlap(this._charHitbox, circle, () => {
      this._onDebrisHit(item);
    });
  }

  _cleanDebris() {
    this.debrisItems = this.debrisItems.filter(d => {
      if (!d.circle || !d.circle.active) return false;
      if (d.circle.y > GAME_H + 40) {
        d.circle.destroy();
        d.label.destroy();
        return false;
      }
      return true;
    });
  }

  // ── Collision handlers ──────────────────────────────────
  _onBlockHit(hitRect, isCorrect) {
    if (this._transitioning) return;
    // Remove this block pair immediately to prevent repeat triggers
    const blockIdx = this.answerBlocks.findIndex(b => b.hitRect === hitRect);
    if (blockIdx === -1) return;
    this._clearAnswerBlocks();

    if (isCorrect) {
      this.attemptsThisLevel++;
      this.correctThisLevel++;
      this._changeScore(CONFIG.pointsCorrect);
      this._showFloatingText(hitRect.x, hitRect.y, `+${CONFIG.pointsCorrect}`, '#88ff88');
      this.cameras.main.flash(120, 0, 180, 0);

      if (this.correctThisLevel >= CONFIG.questionsPerLevel) {
        this._transitioning = true;
        this._showBanner(`🎉 Level ${this.level} Complete!`, '#f7c948', () => {
          this._goLevelComplete();
        });
      } else {
        this._nextQuestion();
        this.time.delayedCall(300, () => this._spawnAnswerBlocks());
      }
    } else {
      this.attemptsThisLevel++;
      this._changeScore(CONFIG.pointsWrongAnswer);
      this._showFloatingText(hitRect.x, hitRect.y, `${CONFIG.pointsWrongAnswer}`, '#ff6b6b');
      this.cameras.main.shake(150, 0.006);
      // Respawn same question with new blocks
      this.time.delayedCall(400, () => this._spawnAnswerBlocks());
    }
  }

  _onDebrisHit(item) {
    if (this._transitioning) return;
    if (!item.circle || !item.circle.active) return;

    const x = item.circle.x;
    const y = item.circle.y;
    item.circle.destroy();
    item.label.destroy();
    this.debrisItems = this.debrisItems.filter(d => d !== item);

    this._changeScore(CONFIG.pointsDebris);
    this._showFloatingText(x, y, `${CONFIG.pointsDebris}`, '#ff4444');
    this.cameras.main.shake(100, 0.005);
  }

  // ── Score management ────────────────────────────────────
  _changeScore(delta) {
    this.score += delta;
    if (this.score < 0) {
      this.score = 0;
      this.lives--;
      this._flashLives();
      this._updateHUD();
      if (this.lives <= 0 && !this._transitioning) {
        this._transitioning = true;
        this._triggerGameOver();
        return;
      }
    }
    this._updateHUD();
  }

  _flashLives() {
    this._heartTexts.forEach(t => {
      this.tweens.add({
        targets: t, alpha: { from: 0.2, to: 1 },
        duration: 120, repeat: 3,
      });
    });
  }

  // ── Transitions ─────────────────────────────────────────
  _retryLevel() {
    this.correctThisLevel  = 0;
    this.attemptsThisLevel = 0;
    this.timeLeft          = CONFIG.levelTimeSeconds;
    this._transitioning    = false;
    this._blockSpeed       = this._calcBlockSpeed();
    this._debrisSpeed      = this._calcDebrisSpeed();
    this._timerText.setColor('#aaddff');
    this._clearAnswerBlocks();
    this._nextQuestion();
    this._spawnAnswerBlocks();
    this._updateHUD();
  }

  _goLevelComplete() {
    this._timerEvent.remove();
    this._rampEvent.remove();
    this._clearAnswerBlocks();
    this.debrisItems.forEach(d => { d.circle?.destroy(); d.label?.destroy(); });
    this.debrisItems = [];

    this.scene.start('LevelCompleteScene', {
      nickname:    this.nickname,
      character:   this.charName,
      charColor:   this.charColor,
      charTextCol: this.charTextCol,
      score:       this.score,
      level:       this.level,
      lives:       this.lives,
      correct:     this.correctThisLevel,
      attempts:    this.attemptsThisLevel,
    });
  }

  _triggerGameOver() {
    this._timerEvent?.remove();
    this._rampEvent?.remove();
    this._clearAnswerBlocks();
    this.debrisItems.forEach(d => { d.circle?.destroy(); d.label?.destroy(); });
    this.debrisItems = [];

    this.scene.start('GameOverScene', {
      nickname:  this.nickname,
      character: this.charName,
      charColor: this.charColor,
      score:     this.score,
      level:     this.level,
    });
  }

  // ── UI helpers ─────────────────────────────────────────
  _showFloatingText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '26px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }

  _showBanner(msg, color, onDone) {
    const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, 80, 0x000000, 0.7);
    const txt = this.add.text(GAME_W / 2, GAME_H / 2, msg, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '30px',
      color,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [bg, txt],
      alpha: { from: 0, to: 1 },
      duration: 250,
      onComplete: () => {
        this.time.delayedCall(1100, () => {
          bg.destroy(); txt.destroy();
          if (onDone) onDone();
        });
      },
    });
  }

  // ── update loop ─────────────────────────────────────────
  update(time, delta) {
    if (this._transitioning) return;

    this._moveCharacter(delta);
    this._syncVisuals();
    this._tickDebrisSpawner(delta);
    this._syncFallingObjects();
    this._cleanDebris();
    this._cullOffscreenBlocks();
  }

  _moveCharacter(delta) {
    const speed = 280;
    const dt    = delta / 1000;
    const CHAR_ZONE_TOP    = GAME_H - 160;
    const CHAR_ZONE_BOTTOM = GAME_H - 55;
    const MARGIN = 36;

    let vx = 0, vy = 0;
    if (this._cursors.left.isDown)  vx = -speed;
    if (this._cursors.right.isDown) vx =  speed;
    if (this._cursors.up.isDown)    vy = -speed * 0.5;
    if (this._cursors.down.isDown)  vy =  speed * 0.5;

    const nx = Phaser.Math.Clamp(this._char.x + vx * dt, MARGIN, GAME_W - MARGIN);
    const ny = Phaser.Math.Clamp(this._char.y + vy * dt, CHAR_ZONE_TOP, CHAR_ZONE_BOTTOM);
    this._char.x = nx;
    this._char.y = ny;

    // Flip slight tilt based on direction
    if (vx < 0) this._char.setAngle(-12);
    else if (vx > 0) this._char.setAngle(12);
  }

  _syncVisuals() {
    this._charHitbox.x = this._char.x;
    this._charHitbox.y = this._char.y;
  }

  _tickDebrisSpawner(delta) {
    this._debrisTimer += delta;
    if (this._debrisTimer >= this._debrisInterval) {
      this._debrisTimer = 0;
      // Spawn 1-2 debris based on level
      const count = this.level >= 5 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * 250, () => this._spawnDebris());
      }
    }
  }

  _syncFallingObjects() {
    // Sync graphics and labels to physics hitRect positions
    this.answerBlocks.forEach(b => {
      if (!b.hitRect || !b.hitRect.active) return;
      const x = b.hitRect.x;
      const y = b.hitRect.y;
      b.graphics.x = x - 32;
      b.graphics.y = y - 32;
      b.label.x = x;
      b.label.y = y;
      if (b.glowObj) {
        b.glowObj.x = x;
        b.glowObj.y = y;
      }
    });

    this.debrisItems.forEach(d => {
      if (!d.circle || !d.circle.active) return;
      d.label.x = d.circle.x;
      d.label.y = d.circle.y;
    });
  }

  _cullOffscreenBlocks() {
    const toRemove = [];
    this.answerBlocks.forEach(b => {
      if (b.hitRect && b.hitRect.y > GAME_H + 50) {
        toRemove.push(b);
      }
    });
    if (toRemove.length > 0) {
      // Both blocks exited — spawn new pair without counting as attempt
      this._clearAnswerBlocks();
      this.time.delayedCall(200, () => this._spawnAnswerBlocks());
    }
  }
}
