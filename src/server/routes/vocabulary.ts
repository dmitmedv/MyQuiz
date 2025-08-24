import { Router } from 'express';
import { db } from '../database/init';
import { VocabularyItem, CreateVocabularyRequest, UpdateVocabularyRequest } from '../types';

const router = Router();

// Get all vocabulary items
router.get('/', (req, res) => {
  const query = `
    SELECT * FROM vocabulary 
    ORDER BY created_at DESC
  `;

  db.all(query, [], (err, rows: VocabularyItem[]) => {
    if (err) {
      console.error('Error fetching vocabulary:', err);
      return res.status(500).json({ error: 'Failed to fetch vocabulary' });
    }
    res.json(rows);
  });
});

// Get vocabulary item by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT * FROM vocabulary WHERE id = ?';
  
  db.get(query, [id], (err, row: VocabularyItem) => {
    if (err) {
      console.error('Error fetching vocabulary item:', err);
      return res.status(500).json({ error: 'Failed to fetch vocabulary item' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    res.json(row);
  });
});

// Create new vocabulary item
router.post('/', (req, res) => {
  const { word, translation, language }: CreateVocabularyRequest = req.body;
  
  if (!word || !translation) {
    return res.status(400).json({ error: 'Word and translation are required' });
  }
  
  // Default to serbian if no language is specified
  const defaultLanguage = language || 'serbian';
  
  // First check if the word already exists in the same language
  const checkDuplicateQuery = `
    SELECT id, word, translation, language FROM vocabulary 
    WHERE word = ? AND language = ?
  `;
  
  db.get(checkDuplicateQuery, [word.trim(), defaultLanguage], (err, existingItem: any) => {
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
      INSERT INTO vocabulary (word, translation, language) 
      VALUES (?, ?, ?)
    `;
    
    db.run(insertQuery, [word.trim(), translation.trim(), defaultLanguage], function(err) {
      if (err) {
        console.error('Error creating vocabulary item:', err);
        return res.status(500).json({ error: 'Failed to create vocabulary item' });
      }
      
      // Fetch the created item
      const selectQuery = 'SELECT * FROM vocabulary WHERE id = ?';
      db.get(selectQuery, [this.lastID], (err, row: VocabularyItem) => {
        if (err) {
          console.error('Error fetching created vocabulary item:', err);
          return res.status(500).json({ error: 'Failed to fetch created vocabulary item' });
        }
        
        res.status(201).json(row);
      });
    });
  });
});

// Update vocabulary item
router.put('/:id', (req, res) => {
  const { id } = req.params;
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
  
  if (updates.learned !== undefined) {
    setClause.push('learned = ?');
    values.push(updates.learned ? 1 : 0);
  }
  
  if (setClause.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  setClause.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const query = `UPDATE vocabulary SET ${setClause.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error updating vocabulary item:', err);
      return res.status(500).json({ error: 'Failed to update vocabulary item' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    // Fetch the updated item
    const selectQuery = 'SELECT * FROM vocabulary WHERE id = ?';
    db.get(selectQuery, [id], (err, row: VocabularyItem) => {
      if (err) {
        console.error('Error fetching updated vocabulary item:', err);
        return res.status(500).json({ error: 'Failed to fetch updated vocabulary item' });
      }
      
      res.json(row);
    });
  });
});

// Delete vocabulary item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM vocabulary WHERE id = ?';
  
  db.run(query, [id], function(err) {
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

// Reset attempt counts for a vocabulary item
router.post('/:id/reset-attempts', (req, res) => {
  const { id } = req.params;
  
  const query = `
    UPDATE vocabulary 
    SET correct_attempts = 0, 
        wrong_attempts = 0, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  
  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error resetting attempt counts:', err);
      return res.status(500).json({ error: 'Failed to reset attempt counts' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vocabulary item not found' });
    }
    
    // Fetch the updated item
    const selectQuery = 'SELECT * FROM vocabulary WHERE id = ?';
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