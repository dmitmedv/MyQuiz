import { Router } from 'express';
import { db } from '../database/init';
import { PracticeSession, PracticeResult } from '../types';

const router = Router();

// Get a random word for practice (not learned)
router.get('/word', (req, res) => {
  const query = `
    SELECT id, word, translation 
    FROM vocabulary 
    WHERE learned = 0 
    ORDER BY RANDOM() 
    LIMIT 1
  `;

  db.get(query, [], (err, row: PracticeSession) => {
    if (err) {
      console.error('Error fetching practice word:', err);
      return res.status(500).json({ error: 'Failed to fetch practice word' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No unlearned words available for practice' });
    }

    res.json(row);
  });
});

// Check answer and mark as learned if correct
router.post('/check', (req, res) => {
  const { id, userTranslation } = req.body;

  if (!id || userTranslation === undefined) {
    return res.status(400).json({ error: 'Word ID and user translation are required' });
  }

  // Get the correct translation
  const getWordQuery = 'SELECT translation FROM vocabulary WHERE id = ?';
  
  db.get(getWordQuery, [id], (err, row: { translation: string }) => {
    if (err) {
      console.error('Error fetching word for checking:', err);
      return res.status(500).json({ error: 'Failed to check answer' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const expectedTranslation = row.translation.toLowerCase().trim();
    const userAnswer = userTranslation.toLowerCase().trim();
    const isCorrect = expectedTranslation === userAnswer;

    const result: PracticeResult = {
      correct: isCorrect,
      expectedTranslation: row.translation,
      userTranslation: userTranslation
    };

    // If correct, mark as learned
    if (isCorrect) {
      const updateQuery = 'UPDATE vocabulary SET learned = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      db.run(updateQuery, [id], (err) => {
        if (err) {
          console.error('Error marking word as learned:', err);
          // Still return the result even if marking as learned fails
        }
        
        res.json(result);
      });
    } else {
      res.json(result);
    }
  });
});

// Get practice statistics
router.get('/stats', (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN learned = 1 THEN 1 ELSE 0 END) as learned,
      SUM(CASE WHEN learned = 0 THEN 1 ELSE 0 END) as unlearned
    FROM vocabulary
  `;

  db.get(statsQuery, [], (err, row: { total: number; learned: number; unlearned: number }) => {
    if (err) {
      console.error('Error fetching practice stats:', err);
      return res.status(500).json({ error: 'Failed to fetch practice statistics' });
    }

    res.json({
      total: row.total,
      learned: row.learned,
      unlearned: row.unlearned,
      progress: row.total > 0 ? Math.round((row.learned / row.total) * 100) : 0
    });
  });
});

// Reset all words to unlearned (for testing or restarting practice)
router.post('/reset', (req, res) => {
  const resetQuery = 'UPDATE vocabulary SET learned = 0, updated_at = CURRENT_TIMESTAMP';
  
  db.run(resetQuery, [], function(err) {
    if (err) {
      console.error('Error resetting practice progress:', err);
      return res.status(500).json({ error: 'Failed to reset practice progress' });
    }

    res.json({ message: `Reset ${this.changes} words to unlearned status` });
  });
});

export { router as practiceRoutes }; 