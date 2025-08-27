import { db } from './init';

/**
 * Database migration to add mastered column to vocabulary table
 * This column tracks words that are permanently mastered and should not appear in practice
 * even after progress resets
 */
export async function addMasteredColumn(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Add mastered column to vocabulary table
    const alterVocabularyTable = `
      ALTER TABLE vocabulary ADD COLUMN mastered BOOLEAN DEFAULT 0
    `;

    db.run(alterVocabularyTable, (err) => {
      // Ignore error if column already exists
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding mastered column:', err);
        reject(err);
        return;
      }

      if (err && err.message.includes('duplicate column name')) {
        console.log('Mastered column already exists');
      } else {
        console.log('Mastered column added successfully');
      }

      // Create index for better performance when filtering mastered words
      const createIndex = `
        CREATE INDEX IF NOT EXISTS idx_vocabulary_mastered
        ON vocabulary(mastered)
      `;

      db.run(createIndex, (indexErr) => {
        if (indexErr) {
          console.error('Error creating mastered index:', indexErr);
          reject(indexErr);
          return;
        }

        console.log('Mastered index created successfully');
        resolve();
      });
    });
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addMasteredColumn()
    .then(() => {
      console.log('Mastered column migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Mastered column migration failed:', error);
      process.exit(1);
    });
}
