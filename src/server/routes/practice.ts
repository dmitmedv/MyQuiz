import { Router } from 'express';
import { db } from '../database/init';
import { PracticeSession, PracticeResult, PracticeMode } from '../types';
import { authenticateToken } from '../middleware/auth';
import { compareWithMultipleAnswers } from '../utils/wordComparison';

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

/**
 * Helper function to get all possible answers (translation + synonyms) for a vocabulary item
 */
async function getAllAnswersForVocabulary(vocabularyId: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT v.translation, GROUP_CONCAT(s.synonym) as synonyms
      FROM vocabulary v
      LEFT JOIN synonyms s ON v.id = s.vocabulary_id
      WHERE v.id = ?
      GROUP BY v.id
    `;
    
    db.get(query, [vocabularyId], (err, row: { translation: string; synonyms: string | null }) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve([]);
        return;
      }
      
      const answers = [row.translation];
      
      // Add synonyms if they exist
      if (row.synonyms) {
        const synonymList = row.synonyms.split(',').filter(s => s.trim().length > 0);
        answers.push(...synonymList);
      }
      
      resolve(answers);
    });
  });
}

const router = Router();

// Apply authentication middleware to all practice routes
router.use(authenticateToken);

// Get a random word for practice (not learned) for the authenticated user
router.get('/word', async (req, res) => {
  // Get practice mode from query parameter, default to 'word-translation'
  const mode = (req.query.mode as PracticeMode) || 'word-translation';
  // Get language filter from query parameter
  const language = req.query.language as string;

  // Validate mode parameter
  if (mode !== 'word-translation' && mode !== 'translation-word') {
    return res.status(400).json({ error: 'Invalid practice mode. Must be "word-translation" or "translation-word"' });
  }

  const userId = req.user!.id;

  // Build query with optional language filter
  let query = `
    SELECT id, word, translation, language, translation_language
    FROM vocabulary
    WHERE learned = 0 AND mastered = 0 AND user_id = ?
  `;
  let queryParams: any[] = [userId];

  // Add language filter if specified
  if (language && language !== 'all') {
    query += ' AND language = ?';
    queryParams.push(language);
  }

  query += ' ORDER BY RANDOM() LIMIT 1';

  db.get(query, queryParams, async (err, row: { id: number; word: string; translation: string; language: string; translation_language: string }) => {
    if (err) {
      console.error('Error fetching practice word:', err);
      return res.status(500).json({ error: 'Failed to fetch practice word' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No unlearned words available for practice' });
    }

    try {
      // Get all possible answers (translation + synonyms) for this word
      const allAnswers = await getAllAnswersForVocabulary(row.id);
      
      // Include the practice mode, language, and synonyms in the response
      const practiceSession: PracticeSession = {
        ...row,
        mode,
        synonyms: allAnswers.filter(answer => answer !== row.translation) // Exclude main translation from synonyms list
      };

      res.json(practiceSession);
    } catch (synonymError) {
      console.error('Error fetching synonyms for practice:', synonymError);
      // Return session without synonyms if there's an error
      const practiceSession: PracticeSession = {
        ...row,
        mode
      };
      res.json(practiceSession);
    }
  });
});

// Check answer and mark as learned if correct
router.post('/check', async (req, res) => {
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
  
  db.get(getWordQuery, [id, userId], async (err, row: { word: string; translation: string; language: string; translation_language: string }) => {
    if (err) {
      console.error('Error fetching word for checking:', err);
      return res.status(500).json({ error: 'Failed to check answer' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Word not found' });
    }

    try {
      let possibleAnswers: string[];
      let expectedAnswer: string;
      
      // Determine the possible answers based on practice mode
      if (practiceMode === 'word-translation') {
        // User should translate from word to translation
        // Get all possible translations (main translation + synonyms)
        const allTranslations = await getAllAnswersForVocabulary(parseInt(id));
        possibleAnswers = allTranslations;
        expectedAnswer = row.translation; // Show main translation as primary expected answer
      } else {
        // User should translate from translation to word  
        // For translation-to-word mode, only the original word is valid (no synonyms for words themselves)
        possibleAnswers = [row.word];
        expectedAnswer = row.word;
      }

      // Use the new word comparison function to check answers and get word-level differences
      const comparisonResult = compareWithMultipleAnswers(userTranslation, possibleAnswers);
      
      // Check if the matched answer differs from normalized versions for diacriticals display
      const shouldShowOriginal = comparisonResult.isCorrect && 
        comparisonResult.matchedAnswer &&
        normalizeText(comparisonResult.matchedAnswer) !== comparisonResult.matchedAnswer && 
        normalizeText(userTranslation) !== comparisonResult.matchedAnswer;

      const result: PracticeResult = {
        correct: comparisonResult.isCorrect,
        expectedTranslation: expectedAnswer,
        userTranslation: userTranslation,
        // Only include originalAnswer if it contains diacriticals and differs from user input
        ...(shouldShowOriginal && { originalAnswer: comparisonResult.matchedAnswer }),
        // Include all synonyms when answer is incorrect to show user all possible correct answers
        ...(!comparisonResult.isCorrect && { synonyms: possibleAnswers.filter(answer => answer !== expectedAnswer) }),
        // Include word-level differences for highlighting when answer is incorrect
        ...(!comparisonResult.isCorrect && comparisonResult.wordDifferences.length > 0 && { wordDifferences: comparisonResult.wordDifferences })
      };

      // Update attempt counts and mark as learned if correct
      let updateQuery: string;
      let updateParams: any[];

      if (comparisonResult.isCorrect) {
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
    } catch (synonymError) {
      console.error('Error checking synonyms:', synonymError);
      return res.status(500).json({ error: 'Failed to check answer' });
    }
  });
});

// Get practice statistics for the authenticated user
router.get('/stats', (req, res) => {
  const userId = req.user!.id;
  
  const statsQuery = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN learned = 1 THEN 1 ELSE 0 END) as learned,
      SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered,
      SUM(CASE WHEN learned = 0 AND mastered = 0 THEN 1 ELSE 0 END) as unlearned,
      SUM(correct_attempts) as total_correct_attempts,
      SUM(wrong_attempts) as total_wrong_attempts
    FROM vocabulary
    WHERE user_id = ?
  `;

  db.get(statsQuery, [userId], (err, row: {
    total: number;
    learned: number;
    mastered: number;
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
      mastered: row.mastered,
      unlearned: row.unlearned,
      progress: row.total > 0 ? Math.round((row.learned / row.total) * 100) : 0,
      total_correct_attempts: row.total_correct_attempts || 0,
      total_wrong_attempts: row.total_wrong_attempts || 0
    });
  });
});

// Reset all words to unlearned for the authenticated user (for testing or restarting practice)
// Optionally filter by language if language parameter is provided
router.post('/reset', (req, res) => {
  const userId = req.user!.id;
  const language = req.query.language as string;

  let resetQuery = 'UPDATE vocabulary SET learned = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND mastered = 0';
  let queryParams: any[] = [userId];

  // Add language filter if specified
  if (language && language !== 'all') {
    resetQuery += ' AND language = ?';
    queryParams.push(language);
  }

  db.run(resetQuery, queryParams, function(err) {
    if (err) {
      console.error('Error resetting practice progress:', err);
      return res.status(500).json({ error: 'Failed to reset practice progress' });
    }

    const languageText = language && language !== 'all' ? ` for ${language}` : '';
    res.json({ message: `Reset ${this.changes} words${languageText} to unlearned status` });
  });
});

export { router as practiceRoutes }; 