import { Router } from 'express';
import { db } from '../database/init';
import { VocabularyItem, CreateVocabularyRequest, UpdateVocabularyRequest, Synonym } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all vocabulary routes
router.use(authenticateToken);

/**
 * Helper function to get synonyms for a vocabulary item
 */
async function getSynonymsForVocabulary(vocabularyId: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const query = 'SELECT synonym FROM synonyms WHERE vocabulary_id = ?';
    db.all(query, [vocabularyId], (err, rows: { synonym: string }[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map(row => row.synonym));
    });
  });
}

/**
 * Helper function to save synonyms for a vocabulary item
 */
async function saveSynonymsForVocabulary(vocabularyId: number, synonyms: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!synonyms || synonyms.length === 0) {
      resolve();
      return;
    }
    
    // Filter out empty synonyms and duplicates
    const uniqueSynonyms = Array.from(new Set(synonyms.filter(s => s.trim().length > 0).map(s => s.trim())));
    
    if (uniqueSynonyms.length === 0) {
      resolve();
      return;
    }
    
    // First, delete existing synonyms to avoid duplicates
    const deleteQuery = 'DELETE FROM synonyms WHERE vocabulary_id = ?';
    db.run(deleteQuery, [vocabularyId], (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Insert new synonyms
      const insertQuery = 'INSERT INTO synonyms (vocabulary_id, synonym) VALUES (?, ?)';
      let completed = 0;
      let hasError = false;
      
      for (const synonym of uniqueSynonyms) {
        db.run(insertQuery, [vocabularyId, synonym], (err) => {
          if (err && !hasError) {
            hasError = true;
            reject(err);
            return;
          }
          
          completed++;
          if (completed === uniqueSynonyms.length && !hasError) {
            resolve();
          }
        });
      }
    });
  });
}

/**
 * Helper function to add synonyms to vocabulary items
 */
async function addSynonymsToVocabularyItems(items: VocabularyItem[]): Promise<VocabularyItem[]> {
  const itemsWithSynonyms = await Promise.all(
    items.map(async (item) => {
      try {
        const synonyms = await getSynonymsForVocabulary(item.id);
        return { ...item, synonyms };
      } catch (error) {
        console.error(`Error fetching synonyms for vocabulary item ${item.id}:`, error);
        return item; // Return item without synonyms if there's an error
      }
    })
  );
  return itemsWithSynonyms;
}

// Get all vocabulary items for the authenticated user
router.get('/', async (req, res) => {
  const userId = req.user!.id; // user is guaranteed to exist due to authentication middleware
  
  const query = `
    SELECT id, word, translation, language, translation_language, learned, mastered, correct_attempts, wrong_attempts, user_id, created_at, updated_at
    FROM vocabulary
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.all(query, [userId], async (err, rows: VocabularyItem[]) => {
    if (err) {
      console.error('Error fetching vocabulary:', err);
      return res.status(500).json({ error: 'Failed to fetch vocabulary' });
    }
    
    try {
      // Add synonyms to each vocabulary item
      const itemsWithSynonyms = await addSynonymsToVocabularyItems(rows);
      res.json(itemsWithSynonyms);
    } catch (synonymError) {
      console.error('Error fetching synonyms:', synonymError);
      // Return items without synonyms if there's an error
      res.json(rows);
    }
  });
});

// Get vocabulary item by ID (only if it belongs to the authenticated user)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  const query = 'SELECT id, word, translation, language, translation_language, learned, mastered, correct_attempts, wrong_attempts, user_id, created_at, updated_at FROM vocabulary WHERE id = ? AND user_id = ?';
  
  db.get(query, [id, userId], async (err, row: VocabularyItem) => {
    if (err) {
      console.error('Error fetching vocabulary item:', err);
      return res.status(500).json({ error: 'Failed to fetch vocabulary item' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    try {
      // Add synonyms to the vocabulary item
      const synonyms = await getSynonymsForVocabulary(row.id);
      res.json({ ...row, synonyms });
    } catch (synonymError) {
      console.error('Error fetching synonyms:', synonymError);
      // Return item without synonyms if there's an error
      res.json(row);
    }
  });
});

// Create new vocabulary item for the authenticated user
router.post('/', async (req, res) => {
  const { word, translation, language, translation_language, synonyms }: CreateVocabularyRequest = req.body;
  const userId = req.user!.id;
  
  if (!word || !translation) {
    return res.status(400).json({ error: 'Word and translation are required' });
  }
  
  // Default to serbian if no language is specified
  const defaultLanguage = language || 'serbian';
  // Default to english if no translation_language is specified
  const defaultTranslationLanguage = translation_language || 'english';
  
  // First check if the word already exists in the same language for this user
  const checkDuplicateQuery = `
    SELECT id, word, translation, language, translation_language FROM vocabulary 
    WHERE word = ? AND language = ? AND user_id = ?
  `;
  
  db.get(checkDuplicateQuery, [word.trim(), defaultLanguage, userId], (err, existingItem: any) => {
    if (err) {
      console.error('Error checking for duplicates:', err);
      return res.status(500).json({ error: 'Failed to check for duplicates' });
    }
    
    if (existingItem) {
      return res.status(409).json({ 
        error: 'Word already exists', 
        details: `"${word}" already exists in ${defaultLanguage} with translation "${existingItem.translation || 'unknown'}"`,
        existingItem 
      });
    }
    
    // If no duplicate, proceed with insertion
    const insertQuery = `
      INSERT INTO vocabulary (word, translation, language, translation_language, user_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [word.trim(), translation.trim(), defaultLanguage, defaultTranslationLanguage, userId], function(err) {
      if (err) {
        console.error('Error creating vocabulary item:', err);
        return res.status(500).json({ error: 'Failed to create vocabulary item' });
      }
      
      // Fetch the created item and save synonyms
      const vocabularyId = this.lastID;
      const selectQuery = 'SELECT id, word, translation, language, translation_language, learned, mastered, correct_attempts, wrong_attempts, user_id, created_at, updated_at FROM vocabulary WHERE id = ?';
      
      db.get(selectQuery, [vocabularyId], async (err, row: VocabularyItem) => {
        if (err) {
          console.error('Error fetching created vocabulary item:', err);
          return res.status(500).json({ error: 'Failed to fetch created vocabulary item' });
        }
        
        try {
          // Save synonyms if provided
          if (synonyms && synonyms.length > 0) {
            await saveSynonymsForVocabulary(vocabularyId, synonyms);
            // Include synonyms in the response
            row.synonyms = synonyms.filter(s => s.trim().length > 0);
          }
          
          res.status(201).json(row);
        } catch (synonymError) {
          console.error('Error saving synonyms:', synonymError);
          // Return the vocabulary item without synonyms if synonym saving fails
          res.status(201).json(row);
        }
      });
    });
  });
});

// Update vocabulary item (only if it belongs to the authenticated user)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const updates: UpdateVocabularyRequest = req.body;
  
  const setClause: string[] = [];
  const values: any[] = [];
  
  if (updates.word !== undefined) {
    setClause.push('word = ?');
    values.push(updates.word.trim());
  }
  
  if (updates.translation !== undefined) {
    setClause.push('translation = ?');
    values.push(updates.translation.trim());
  }
  
  if (updates.language !== undefined) {
    setClause.push('language = ?');
    values.push(updates.language);
  }
  
  if (updates.translation_language !== undefined) {
    setClause.push('translation_language = ?');
    values.push(updates.translation_language);
  }
  
  if (updates.learned !== undefined) {
    setClause.push('learned = ?');
    values.push(updates.learned ? 1 : 0);
  }

  if (updates.mastered !== undefined) {
    setClause.push('mastered = ?');
    values.push(updates.mastered ? 1 : 0);
  }
  
  // Handle synonyms separately since they go in a different table
  const hasSynonymUpdates = updates.synonyms !== undefined;
  
  if (setClause.length === 0 && !hasSynonymUpdates) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  // Only run vocabulary table update if there are vocabulary fields to update
  const updateVocabularyTable = async () => {
    if (setClause.length > 0) {
      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `UPDATE vocabulary SET ${setClause.join(', ')} WHERE id = ? AND user_id = ?`;
      values.push(userId);
      
      return new Promise((resolve, reject) => {
        db.run(query, values, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            reject(new Error('Vocabulary item not found'));
            return;
          }
          
          resolve(true);
        });
      });
    }
    return Promise.resolve(true);
  };
  
  try {
    // Update vocabulary table if needed
    await updateVocabularyTable();
    
    // Update synonyms if provided
    if (hasSynonymUpdates) {
      await saveSynonymsForVocabulary(parseInt(id), updates.synonyms || []);
    }
    
    // Fetch the updated item with synonyms
    const selectQuery = 'SELECT id, word, translation, language, translation_language, learned, mastered, correct_attempts, wrong_attempts, user_id, created_at, updated_at FROM vocabulary WHERE id = ? AND user_id = ?';
    db.get(selectQuery, [id, userId], async (err, row: VocabularyItem) => {
      if (err) {
        console.error('Error fetching updated vocabulary item:', err);
        return res.status(500).json({ error: 'Failed to fetch updated vocabulary item' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Vocabulary item not found' });
      }
      
      try {
        // Add synonyms to the response
        const synonyms = await getSynonymsForVocabulary(row.id);
        res.json({ ...row, synonyms });
      } catch (synonymError) {
        console.error('Error fetching synonyms:', synonymError);
        // Return item without synonyms if there's an error
        res.json(row);
      }
    });
  } catch (updateError: any) {
    console.error('Error updating vocabulary item:', updateError);
    
    if (updateError.message === 'Vocabulary item not found') {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    return res.status(500).json({ error: 'Failed to update vocabulary item' });
  }
});

// Delete vocabulary item (only if it belongs to the authenticated user)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  const query = 'DELETE FROM vocabulary WHERE id = ? AND user_id = ?';
  
  db.run(query, [id, userId], function(err) {
    if (err) {
      console.error('Error deleting vocabulary item:', err);
      return res.status(500).json({ error: 'Failed to delete vocabulary item' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    res.status(204).send();
  });
});

// Reset attempt counts for a vocabulary item (only if it belongs to the authenticated user)
router.post('/:id/reset-attempts', (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  const query = `
    UPDATE vocabulary 
    SET correct_attempts = 0, 
        wrong_attempts = 0, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [id, userId], function(err) {
    if (err) {
      console.error('Error resetting attempt counts:', err);
      return res.status(500).json({ error: 'Failed to reset attempt counts' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    // Fetch the updated item
    const selectQuery = 'SELECT id, word, translation, language, translation_language, learned, mastered, correct_attempts, wrong_attempts, user_id, created_at, updated_at FROM vocabulary WHERE id = ?';
    db.get(selectQuery, [id], (err, row: VocabularyItem) => {
      if (err) {
        console.error('Error fetching updated vocabulary item:', err);
        return res.status(500).json({ error: 'Failed to fetch updated vocabulary item' });
      }
      
      res.json({ message: 'Attempt counts reset successfully', item: row });
    });
  });
});

export { router as vocabularyRoutes }; 