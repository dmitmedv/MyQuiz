import { Router } from 'express';
import { db } from '../database/init';
import { PracticeSession, PracticeResult, PracticeMode } from '../types';

/**
 * Normalize text by removing diacritical marks to allow flexible matching
 * For example: ž → z, ć → c, š → s, etc.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize common Slavic diacriticals
    .replace(/[žŽ]/g, 'z')
    .replace(/[ćčĆČ]/g, 'c')
    .replace(/[šŠ]/g, 's')
    .replace(/[ňŇ]/g, 'n')
    .replace(/[ďĎ]/g, 'd')
    .replace(/[ťŤ]/g, 't')
    .replace(/[ľĽłŁ]/g, 'l')
    .replace(/[řŘ]/g, 'r')
    .replace(/[áäÁÄ]/g, 'a')
    .replace(/[éěÉĚ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óôÓÔ]/g, 'o')
    .replace(/[úůüÚŮÜ]/g, 'u')
    .replace(/[ýÝ]/g, 'y');
}

const router = Router();

// Get a random word for practice (not learned)
router.get('/word', (req, res) => {
  // Get practice mode from query parameter, default to 'word-translation'
  const mode = (req.query.mode as PracticeMode) || 'word-translation';
  
  // Validate mode parameter
  if (mode !== 'word-translation' && mode !== 'translation-word') {
    return res.status(400).json({ error: 'Invalid practice mode. Must be "word-translation" or "translation-word"' });
  }

  const query = `
    SELECT id, word, translation, language 
    FROM vocabulary 
    WHERE learned = 0 
    ORDER BY RANDOM() 
    LIMIT 1
  `;

  db.get(query, [], (err, row: { id: number; word: string; translation: string; language: string }) => {
    if (err) {
      console.error('Error fetching practice word:', err);
      return res.status(500).json({ error: 'Failed to fetch practice word' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No unlearned words available for practice' });
    }

    // Include the practice mode and language in the response
    const practiceSession: PracticeSession = {
      ...row,
      mode
    };

    res.json(practiceSession);
  });
});

// Check answer and mark as learned if correct
router.post('/check', (req, res) => {
  const { id, userTranslation, mode } = req.body;

  if (!id || userTranslation === undefined) {
    return res.status(400).json({ error: 'Word ID and user translation are required' });
  }

  // Validate mode parameter
  const practiceMode = mode || 'word-translation';
  if (practiceMode !== 'word-translation' && practiceMode !== 'translation-word') {
    return res.status(400).json({ error: 'Invalid practice mode' });
  }

  // Get the word and translation
  const getWordQuery = 'SELECT word, translation FROM vocabulary WHERE id = ?';
  
  db.get(getWordQuery, [id], (err, row: { word: string; translation: string }) => {
    if (err) {
      console.error('Error fetching word for checking:', err);
      return res.status(500).json({ error: 'Failed to check answer' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Word not found' });
    }

    let expectedAnswer: string;
    let originalAnswer: string; // The answer with original diacriticals from database
    let isCorrect: boolean;

    // Determine the expected answer based on practice mode
    if (practiceMode === 'word-translation') {
      // User should translate from word to translation
      expectedAnswer = row.translation;
      originalAnswer = row.translation;
      // Use normalized comparison to handle diacritical marks (z ↔ ž, etc.)
      isCorrect = normalizeText(row.translation) === normalizeText(userTranslation);
    } else {
      // User should translate from translation to word  
      expectedAnswer = row.word;
      originalAnswer = row.word;
      // Use normalized comparison to handle diacritical marks (z ↔ ž, etc.)
      isCorrect = normalizeText(row.word) === normalizeText(userTranslation);
    }

    // Check if the original answer differs from normalized versions
    // Only include originalAnswer if it contains diacriticals that differ from user input
    const shouldShowOriginal = isCorrect && 
      normalizeText(originalAnswer) !== originalAnswer && 
      normalizeText(userTranslation) !== originalAnswer;

    const result: PracticeResult = {
      correct: isCorrect,
      expectedTranslation: expectedAnswer,
      userTranslation: userTranslation,
      // Only include originalAnswer if it contains diacriticals and differs from user input
      ...(shouldShowOriginal && { originalAnswer })
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