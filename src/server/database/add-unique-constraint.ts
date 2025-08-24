import { db } from './init';

/**
 * Script to add unique constraint to existing vocabulary databases
 * This prevents duplicate words in the same language
 */
export async function addUniqueConstraint(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Adding unique constraint to vocabulary table...');
    
    // Create unique index to prevent duplicate words in the same language
    const createUniqueIndex = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_word_language 
      ON vocabulary(word, language)
    `;

    db.run(createUniqueIndex, (err) => {
      if (err) {
        console.error('Error creating unique index:', err);
        reject(err);
        return;
      }

      console.log('Unique constraint added successfully');
      console.log('Note: If you have existing duplicates, you may need to clean them up first');
      resolve();
    });
  });
}

// Run if this file is executed directly
if (require.main === module) {
  addUniqueConstraint()
    .then(() => {
      console.log('Unique constraint setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to add unique constraint:', err);
      process.exit(1);
    });
}
