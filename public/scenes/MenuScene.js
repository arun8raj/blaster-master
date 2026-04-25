/* ═══════════════════════════════════════════════════
   MenuScene.js
   Title screen: nickname input, character select,
   Play button, Leaderboard button.
   ═══════════════════════════════════════════════════ */

class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  // ── create ─────────────────────────────────────────────
  create(data) {
    this._selectedCharIdx = 0;
    this._charBoxes       = [];
    this._nickInputEl     = document.getElementById('nickname-input');
    this._nickErrorEl     = document.getElementById('nick-error');
    this._menuFormEl      = document.getElementById('menu-form');

    // Pre-fill nickname if returning from game over
    if (data && data.nickname) {
      this._nickInputEl.value = data.nickname;
    }

    this._drawBackground();
    this._drawTitle();
    this._positionNicknameInput();
    this._drawLabel('What do your friends call you?', GAME_W / 2, 168);
    this._drawCharacterSelect();
    this._drawButtons();
    this._addStars();

    // Floating title tween
    this.tweens.add({
      targets: this._titleText,
      y: this._titleText.y - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Clean up DOM elements when scene shuts down
    this.events.once('shutdown', () => this._hideMenuForm());
    this.events.once('destroy',  () => this._hideMenuForm());
  }

  // ── background ─────────────────────────────────────────
  _drawBackground() {
    const g = this.add.graphics();
    // Deep space gradient (approximate with layered rects)
    g.fillGradientStyle(0x0d0d2e, 0x0d0d2e, 0x1a1040, 0x1a1040, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
  }

  _addStars() {
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x  = Phaser.Math.Between(0, GAME_W);
      const y  = Phaser.Math.Between(0, GAME_H);
      const r  = Math.random() < 0.2 ? 2 : 1;
      const a  = 0.3 + Math.random() * 0.7;
      g.fillStyle(0xffffff, a);
      g.fillCircle(x, y, r);
    }
    // Gentle twinkle on the whole star layer
    this.tweens.add({
      targets: g, alpha: { from: 0.6, to: 1 },
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  // ── title ──────────────────────────────────────────────
  _drawTitle() {
    // Shadow
    this.add.text(GAME_W / 2 + 3, 68, 'Math Blaster', {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '52px',
      color: '#000000',
      alpha: 0.4,
    }).setOrigin(0.5).setAlpha(0.35);

    this._titleText = this.add.text(GAME_W / 2, 65, 'Math Blaster', {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '52px',
      color: '#f7c948',
      stroke: '#cc7700',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 118, '— blast your way through math! —', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      color: '#aabbdd',
    }).setOrigin(0.5);
  }

  // ── nickname input (HTML element) ───────────────────────
  _positionNicknameInput() {
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / GAME_W;
    const scaleY = rect.height / GAME_H;

    const inputY = 188; // game-space Y
    const el = this._menuFormEl;
    el.style.display  = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.left     = `${rect.left + (GAME_W / 2 - 110) * scaleX}px`;
    el.style.top      = `${rect.top  + inputY * scaleY}px`;
    el.style.width    = `${220 * scaleX}px`;
  }

  _hideMenuForm() {
    this._menuFormEl.style.display = 'none';
    if (this._nickErrorEl) this._nickErrorEl.textContent = '';
  }

  _drawLabel(txt, x, y) {
    this.add.text(x, y, txt, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      color: '#c8d8f0',
    }).setOrigin(0.5);
  }

  // ── character select ────────────────────────────────────
  _drawCharacterSelect() {
    const startY   = 260;
    const boxW     = 74;
    const boxH     = 80;
    const spacing  = 6;
    const totalW   = CHARACTERS.length * boxW + (CHARACTERS.length - 1) * spacing;
    const startX   = (GAME_W - totalW) / 2;

    this.add.text(GAME_W / 2, startY - 22, 'Choose your hero', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      color: '#c8d8f0',
    }).setOrigin(0.5);

    CHARACTERS.forEach((ch, i) => {
      const x = startX + i * (boxW + spacing);
      const y = startY;
      this._createCharBox(x, y, boxW, boxH, ch, i);
    });

    this._updateCharSelection();
  }

  _createCharBox(x, y, w, h, ch, idx) {
    const container = this.add.container(x + w / 2, y + h / 2);

    // Selection ring (visible when selected)
    const ring = this.add.rectangle(0, 0, w + 8, h + 8, 0xf7c948).setAlpha(0);
    container.add(ring);

    // Body
    const body = this.add.rectangle(0, 0, w, h, ch.color);
    body.setStrokeStyle(2, 0x334455);
    container.add(body);

    // Highlight stripe top
    const hl = this.add.rectangle(0, -h / 2 + 6, w - 4, 10, 0xffffff).setAlpha(0.2);
    container.add(hl);

    // Character initial(s)
    const initial = ch.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const label = this.add.text(0, -8, initial, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '26px',
      color: ch.textColor,
    }).setOrigin(0.5);
    container.add(label);

    // Name below
    const name = this.add.text(0, h / 2 - 14, ch.name, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '9px',
      color: '#ddeeff',
    }).setOrigin(0.5);
    // Wrap long names
    name.setWordWrapWidth(w - 4);
    container.add(name);

    // Hover / click
    body.setInteractive({ useHandCursor: true });
    body.on('pointerover',  () => { if (this._selectedCharIdx !== idx) body.setAlpha(0.85); });
    body.on('pointerout',   () => { if (this._selectedCharIdx !== idx) body.setAlpha(1);    });
    body.on('pointerdown',  () => {
      this._selectedCharIdx = idx;
      this._updateCharSelection();
    });

    this._charBoxes.push({ container, ring, body });
  }

  _updateCharSelection() {
    this._charBoxes.forEach((box, i) => {
      const selected = i === this._selectedCharIdx;
      box.ring.setAlpha(selected ? 0.9 : 0);
      box.body.setStrokeStyle(selected ? 3 : 2, selected ? 0xf7c948 : 0x334455);
    });
  }

  // ── buttons ─────────────────────────────────────────────
  _drawButtons() {
    this._makeButton(GAME_W / 2, 400, 'Play!', 0xf7c948, '#1a1a2e', () => this._startGame());
    this._makeButton(GAME_W / 2, 450, 'Leaderboard', 0x2d4a7a, '#ffffff', () => {
      window.showLeaderboard(null, null);
    });
  }

  _makeButton(x, y, label, bg, textCol, onClick) {
    const btn = this.add.rectangle(x, y, 200, 44, bg).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(2, 0xffffff, 0.2);
    const txt = this.add.text(x, y, label, {
      fontFamily: "'Fredoka One', cursive",
      fontSize: '22px',
      color: textCol,
    }).setOrigin(0.5);

    btn.on('pointerover',  () => { btn.setAlpha(0.85); txt.setScale(1.04); });
    btn.on('pointerout',   () => { btn.setAlpha(1);    txt.setScale(1);    });
    btn.on('pointerdown',  () => onClick());
    return { btn, txt };
  }

  // ── start game ──────────────────────────────────────────
  _startGame() {
    const rawNick = this._nickInputEl.value.trim();
    if (!rawNick) {
      this._nickErrorEl.textContent = 'Enter a nickname first!';
      this._nickInputEl.focus();
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(rawNick)) {
      this._nickErrorEl.textContent = 'Letters and numbers only.';
      this._nickInputEl.focus();
      return;
    }
    this._nickErrorEl.textContent = '';
    const nickname  = rawNick.slice(0, 12);
    const character = CHARACTERS[this._selectedCharIdx];

    this._hideMenuForm();

    this.scene.start('GameScene', {
      nickname,
      character:    character.name,
      charColor:    character.color,
      charTextCol:  character.textColor,
      score:        0,
      level:        1,
      lives:        CONFIG.startingLives,
    });
  }
}
