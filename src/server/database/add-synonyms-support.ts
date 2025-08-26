import { db } from './init';

/**
 * Add synonyms support to the vocabulary system
 * 
 * This migration creates a new 'synonyms' table to store multiple translations
 * for each vocabulary item. The original 'translation' field in the vocabulary 
 * table remains as the primary/main translation.
 */
export async function addSynonymsSupport(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create synonyms table
    const createSynonymsTable = `
      CREATE TABLE IF NOT EXISTS synonyms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vocabulary_id INTEGER NOT NULL,
        synonym TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        UNIQUE(vocabulary_id, synonym) -- Prevent duplicate synonyms for the same word
      )
    `;

    db.run(createSynonymsTable, (err) => {
      if (err) {
        console.error('Error creating synonyms table:', err);
        reject(err);
        return;
      }
      
      console.log('Synonyms table created successfully');
      
      // Create index for better performance on lookups
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_synonyms_vocabulary_id 
        ON synonyms(vocabulary_id)
      `;
      
      db.run(createIndexQuery, (err) => {
        if (err) {
          console.error('Error creating synonyms index:', err);
          reject(err);
          return;
        }
        
        console.log('Synonyms index created successfully');
        
        // Optionally, migrate existing translations to synonyms table
        // This ensures existing translations are also available as synonyms
        const migrateSynonymsQuery = `
          INSERT OR IGNORE INTO synonyms (vocabulary_id, synonym)
          SELECT id, translation FROM vocabulary 
          WHERE translation IS NOT NULL AND translation != ''
        `;
        
        db.run(migrateSynonymsQuery, (err) => {
          if (err) {
            console.error('Error migrating existing translations to synonyms:', err);
            reject(err);
            return;
          }
          
          console.log('Successfully migrated existing translations to synonyms table');
          resolve();
        });
      });
    });
  });
}
