const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'scores.db'));

// Promise helpers
const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    })
  );

const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    })
  );

const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    })
  );

// Schema init — awaited before every query
const ready = run(`
  CREATE TABLE IF NOT EXISTS scores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname      TEXT    NOT NULL,
    character     TEXT    NOT NULL,
    score         INTEGER NOT NULL,
    level_reached INTEGER NOT NULL,
    played_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

async function saveScore({ nickname, character, score, level_reached }) {
  await ready;
  return run(
    'INSERT INTO scores (nickname, character, score, level_reached) VALUES (?, ?, ?, ?)',
    [nickname.slice(0, 12), character, score, level_reached]
  );
}

async function getLeaderboard() {
  await ready;
  return all(
    `SELECT id, nickname, character, score, level_reached,
            strftime('%d/%m/%Y', played_at) AS played_at
     FROM scores
     ORDER BY score DESC
     LIMIT 10`
  );
}

async function getRank(score) {
  await ready;
  const row = await get('SELECT COUNT(*) AS cnt FROM scores WHERE score > ?', [score]);
  return row.cnt + 1;
}

module.exports = { saveScore, getLeaderboard, getRank };
