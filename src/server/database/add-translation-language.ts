import { db } from './init';

/**
 * Migration script to add translation_language column to vocabulary table
 * This allows us to store the language of both the word and translation
 */
export async function addTranslationLanguageColumn(): Promise<void> {
  return new Promise((resolve, reject) => {
    // First, check if column already exists
    const checkColumnQuery = `PRAGMA table_info(vocabulary)`;
    
    db.all(checkColumnQuery, (err, rows: any[]) => {
      if (err) {
        console.error('Error checking table info:', err);
        reject(err);
        return;
      }

      // Check if translation_language column already exists
      const hasTranslationLanguageColumn = rows.some(row => row.name === 'translation_language');
      
      if (hasTranslationLanguageColumn) {
        console.log('translation_language column already exists, skipping migration');
        resolve();
        return;
      }

      // Add the translation_language column with default value 'english'
      // We assume most translations are in English by default
      const addColumnQuery = `
        ALTER TABLE vocabulary 
        ADD COLUMN translation_language TEXT NOT NULL DEFAULT 'english'
      `;

      db.run(addColumnQuery, (err) => {
        if (err) {
          console.error('Error adding translation_language column:', err);
          reject(err);
          return;
        }
        
        console.log('Successfully added translation_language column to vocabulary table');
        resolve();
      });
    });
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addTranslationLanguageColumn()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
