const express = require('express');
const path = require('path');
const { saveScore, getLeaderboard, getRank } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scores', async (req, res) => {
  const { nickname, character, score, level_reached } = req.body;

  if (!nickname || !character || score === undefined || level_reached === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (typeof score !== 'number' || typeof level_reached !== 'number') {
    return res.status(400).json({ error: 'score and level_reached must be numbers' });
  }

  try {
    const result = await saveScore({ nickname, character, score, level_reached });
    const rank   = await getRank(score);
    res.json({ id: result.lastID, rank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    res.json(await getLeaderboard());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Math Blaster running → http://localhost:${PORT}`);
});
