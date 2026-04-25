const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'scores.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname     TEXT    NOT NULL,
    character    TEXT    NOT NULL,
    score        INTEGER NOT NULL,
    level_reached INTEGER NOT NULL,
    played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const stmtInsert = db.prepare(
  'INSERT INTO scores (nickname, character, score, level_reached) VALUES (?, ?, ?, ?)'
);

const stmtLeaderboard = db.prepare(
  `SELECT id, nickname, character, score, level_reached,
          strftime('%d/%m/%Y', played_at) AS played_at
   FROM scores
   ORDER BY score DESC
   LIMIT 10`
);

const stmtRank = db.prepare(
  'SELECT COUNT(*) AS cnt FROM scores WHERE score > ?'
);

function saveScore({ nickname, character, score, level_reached }) {
  return stmtInsert.run(
    nickname.slice(0, 12),
    character,
    score,
    level_reached
  );
}

function getLeaderboard() {
  return stmtLeaderboard.all();
}

function getRank(score) {
  const { cnt } = stmtRank.get(score);
  return cnt + 1; // 1-based rank
}

module.exports = { saveScore, getLeaderboard, getRank };
