# Math Blaster 🚀

A full-stack browser arcade game that teaches addition and subtraction to kids in grades 1–5. Built with Phaser.js, Node.js/Express, and SQLite.

---

## Quick Start

### Prerequisites
- Node.js 18 or later

### Install & Run

```bash
cd blaster-master
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For development with auto-reload:

```bash
npm run dev        # requires nodemon (already in devDependencies)
```

---

## Project Structure

```
/
├── server.js          Express server + API routes
├── database.js        SQLite setup and query helpers
├── scores.db          Auto-created on first run
├── package.json
└── public/
    ├── index.html     Shell, leaderboard overlay, CSS
    ├── game.js        CONFIG, shared data, Phaser bootstrap
    └── scenes/
        ├── MenuScene.js          Title screen & character select
        ├── GameScene.js          Main gameplay
        ├── LevelCompleteScene.js Post-level results
        └── GameOverScene.js      Game over screen
```

---

## Game Controls

| Key | Action |
|-----|--------|
| ← / → Arrow | Move character left / right |
| ↑ / ↓ Arrow | Move character up / down (within bottom quarter) |

---

## Configuration

All game parameters live at the top of `public/game.js`:

```js
const CONFIG = {
  questionsPerLevel: 5,      // correct answers needed to advance
  levelTimeSeconds:  90,     // seconds per level
  startingLives:     3,
  pointsCorrect:     1,
  pointsWrongAnswer: -1,
  pointsDebris:      -2,
};
```

Change any value and refresh — no rebuild required.

---

## Swapping in Real Sprite Assets

All character and debris graphics are rendered as **placeholder colored shapes** in-engine. To replace them with real sprites:

### Characters

1. Add sprite sheets or PNG images to `public/assets/characters/`.  
   Suggested filenames: `snoopy.png`, `sonic.png`, `ninja-turtle.png`, `olaf.png`, `spike.png`.

2. In `GameScene.js`, load them in a `preload()` method:
   ```js
   preload() {
     this.load.image('sonic', 'assets/characters/sonic.png');
     // ... etc.
   }
   ```

3. In `_createCharacter()`, replace `this.add.container(...)` with:
   ```js
   this._char = this.add.image(startX, startY, this.charKey);
   this._char.setAngle(-12); // keep the Superman tilt
   ```
   Pass `charKey` (e.g. `'sonic'`) through scene data alongside `charColor`.

4. Apply the same pattern in `GameOverScene._deathAnimation()`.

### Debris

1. Add individual PNGs to `public/assets/debris/`  
   (e.g. `duck.png`, `boot.png`, `pizza.png`, …).

2. Preload each in `GameScene.preload()`.

3. In `GameScene._spawnDebris()`, replace `this.add.circle(...)` with:
   ```js
   const sprite = this.add.image(x, y, type.key);
   sprite.setScale(0.5); // adjust to fit ~52 px
   ```

### Debris wobble

The current `tweens.add({ angle: ... })` wobble works equally well on sprites — no further changes needed.

---

## API Reference

| Method | Endpoint | Body / Response |
|--------|----------|-----------------|
| POST | `/api/scores` | `{ nickname, character, score, level_reached }` → `{ id, rank }` |
| GET  | `/api/leaderboard` | `[ { id, nickname, character, score, level_reached, played_at }, … ]` (top 10) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Phaser 3.60 |
| Backend  | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 |
