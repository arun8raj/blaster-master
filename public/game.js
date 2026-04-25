/* ═══════════════════════════════════════════════════
   Math Blaster – game.js
   Central config, data, helpers, and Phaser bootstrap
   ═══════════════════════════════════════════════════ */

// ── All configurable game parameters ──────────────────────
const CONFIG = {
  questionsPerLevel: 5,
  levelTimeSeconds: 90,
  startingLives: 3,
  pointsCorrect: 1,
  pointsWrongAnswer: -1,
  pointsDebris: -2,
};

// ── Character roster ───────────────────────────────────────
const CHARACTERS = [
  { name: 'Snoopy',        color: 0xF5F5DC, textColor: '#333333', accent: 0xE8E0C0 },
  { name: 'Sonic',         color: 0x1A6BCC, textColor: '#FFFFFF', accent: 0x0D4A99 },
  { name: 'Ninja Turtle',  color: 0x3DAA50, textColor: '#FFFFFF', accent: 0x267A38 },
  { name: 'Olaf',          color: 0xB8E4FF, textColor: '#1a3a5c', accent: 0x7ABFE0 },
  { name: 'Spike',         color: 0xFF6B35, textColor: '#FFFFFF', accent: 0xCC4A1A },
];

// ── Debris types ───────────────────────────────────────────
const DEBRIS_TYPES = [
  { label: '🦆 Duck',        color: 0xFFD700 },
  { label: '👢 Boot',        color: 0x8B5E3C },
  { label: '🍕 Pizza',       color: 0xFF6347 },
  { label: '🪠 Plunger',     color: 0xFF4500 },
  { label: '🤧 Cloud',       color: 0xB8CFDF },
  { label: '🌵 Cactus',      color: 0x2E8B57 },
  { label: '⏰ Clock',       color: 0xFF8C00 },
  { label: '🍌 Banana',      color: 0xFFEC40 },
  { label: '🥪 Sandwich',    color: 0xDEB887 },
  { label: '🏈 Football',    color: 0xA0522D },
  { label: '🚧 Cone',        color: 0xFF4500 },
  { label: '🍉 Melon',       color: 0x1A8C2A },
  { label: '🎒 Bag',         color: 0x5C2D91 },
  { label: '🦷 Tooth',       color: 0xF0EDE8 },
  { label: '☄️ Asteroid',    color: 0x888899 },
];

// ── Math question generator ────────────────────────────────
function generateQuestion(level) {
  let maxNum, allowSubtract;
  if      (level <= 2) { maxNum = 10; allowSubtract = false; }
  else if (level <= 4) { maxNum = 15; allowSubtract = true;  }
  else if (level <= 6) { maxNum = 20; allowSubtract = true;  }
  else                 { maxNum = 30; allowSubtract = true;  }

  const types = ['standard', 'missing'];
  if (allowSubtract) { types.push('subtract', 'subtractMissing'); }
  const type = types[randInt(0, types.length - 1)];

  let questionText, correct;

  if (type === 'standard') {
    // a + b = ?
    const a = randInt(1, maxNum - 1);
    const b = randInt(1, maxNum - a);
    correct      = a + b;
    questionText = `${a} + ${b} = ?`;

  } else if (type === 'missing') {
    // a + ? = c
    const a = randInt(1, maxNum - 1);
    const c = randInt(a + 1, maxNum);
    correct      = c - a;
    questionText = `${a} + ? = ${c}`;

  } else if (type === 'subtract') {
    // a - b = ?
    const a = randInt(2, maxNum);
    const b = randInt(1, a - 1);
    correct      = a - b;
    questionText = `${a} − ${b} = ?`;

  } else {
    // a - ? = c
    const a = randInt(2, maxNum);
    const c = randInt(0, a - 1);
    correct      = a - c;
    questionText = `${a} − ? = ${c}`;
  }

  // Wrong answer: plausible, close to correct, never negative, never equal
  let wrong;
  let attempts = 0;
  do {
    const sign   = Math.random() < 0.5 ? 1 : -1;
    const offset = level >= 7 ? randInt(1, 4) : randInt(1, 3);
    wrong = correct + sign * offset;
    attempts++;
    if (attempts > 30) { wrong = correct + 1; break; }
  } while (wrong === correct || wrong < 0);

  return { questionText, correct, wrong };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Phaser game init ───────────────────────────────────────
const GAME_W = 480;
const GAME_H = 640;

const phaserConfig = {
  type: Phaser.AUTO,
  width:  GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0d0d1a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  dom: { createContainer: true },
  scene: [MenuScene, GameScene, LevelCompleteScene, GameOverScene],
};

const game = new Phaser.Game(phaserConfig);
