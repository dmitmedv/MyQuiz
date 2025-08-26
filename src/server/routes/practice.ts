import { Router } from 'express';
import { db } from '../database/init';
import { PracticeSession, PracticeResult, PracticeMode } from '../types';
import { authenticateToken } from '../middleware/auth';

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

// Apply authentication middleware to all practice routes
router.use(authenticateToken);

// Get a random word for practice (not learned) for the authenticated user
router.get('/word', (req, res) => {
  // Get practice mode from query parameter, default to 'word-translation'
  const mode = (req.query.mode as PracticeMode) || 'word-translation';
  
  // Validate mode parameter
  if (mode !== 'word-translation' && mode !== 'translation-word') {
    return res.status(400).json({ error: 'Invalid practice mode. Must be "word-translation" or "translation-word"' });
  }

  const userId = req.user!.id;
  
  const query = `
    SELECT id, word, translation, language, translation_language 
    FROM vocabulary 
    WHERE learned = 0 AND user_id = ?
    ORDER BY RANDOM() 
    LIMIT 1
  `;

  db.get(query, [userId], (err, row: { id: number; word: string; translation: string; language: string; translation_language: string }) => {
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
  const userId = req.user!.id;

  if (!id || userTranslation === undefined) {
    return res.status(400).json({ error: 'Word ID and user translation are required' });
  }

  // Validate mode parameter
  const practiceMode = mode || 'word-translation';
  if (practiceMode !== 'word-translation' && practiceMode !== 'translation-word') {
    return res.status(400).json({ error: 'Invalid practice mode' });
  }

  // Get the word and translation (only if it belongs to the authenticated user)
  const getWordQuery = 'SELECT word, translation, language, translation_language FROM vocabulary WHERE id = ? AND user_id = ?';
  
  db.get(getWordQuery, [id, userId], (err, row: { word: string; translation: string; language: string; translation_language: string }) => {
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

    // Update attempt counts and mark as learned if correct
    let updateQuery: string;
    let updateParams: any[];

    if (isCorrect) {
      // Increment correct attempts and mark as learned
      updateQuery = `
        UPDATE vocabulary 
        SET learned = 1, 
            correct_attempts = correct_attempts + 1, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      updateParams = [id, userId];
    } else {
      // Increment wrong attempts
      updateQuery = `
        UPDATE vocabulary 
        SET wrong_attempts = wrong_attempts + 1, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      updateParams = [id, userId];
    }
    
    db.run(updateQuery, updateParams, (err) => {
      if (err) {
        console.error('Error updating attempt counts:', err);
        // Still return the result even if updating fails
      }
      
      res.json(result);
    });
  });
});

// Get practice statistics for the authenticated user
router.get('/stats', (req, res) => {
  const userId = req.user!.id;
  
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN learned = 1 THEN 1 ELSE 0 END) as learned,
      SUM(CASE WHEN learned = 0 THEN 1 ELSE 0 END) as unlearned,
      SUM(correct_attempts) as total_correct_attempts,
      SUM(wrong_attempts) as total_wrong_attempts
    FROM vocabulary
    WHERE user_id = ?
  `;

  db.get(statsQuery, [userId], (err, row: { 
    total: number; 
    learned: number; 
    unlearned: number; 
    total_correct_attempts: number; 
    total_wrong_attempts: number; 
  }) => {
    if (err) {
      console.error('Error fetching practice stats:', err);
      return res.status(500).json({ error: 'Failed to fetch practice statistics' });
    }

    res.json({
      total: row.total,
      learned: row.learned,
      unlearned: row.unlearned,
      progress: row.total > 0 ? Math.round((row.learned / row.total) * 100) : 0,
      total_correct_attempts: row.total_correct_attempts || 0,
      total_wrong_attempts: row.total_wrong_attempts || 0
    });
  });
});

// Reset all words to unlearned for the authenticated user (for testing or restarting practice)
router.post('/reset', (req, res) => {
  const userId = req.user!.id;
  const resetQuery = 'UPDATE vocabulary SET learned = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
  
  db.run(resetQuery, [userId], function(err) {
    if (err) {
      console.error('Error resetting practice progress:', err);
      return res.status(500).json({ error: 'Failed to reset practice progress' });
    }

    res.json({ message: `Reset ${this.changes} words to unlearned status` });
  });
});

export { router as practiceRoutes }; 