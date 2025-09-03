import { db } from './init';

/**
 * Add incorrect attempts tracking table
 * 
 * This migration creates a new 'incorrect_attempts' table to store detailed
 * information about each incorrect answer attempt made by users during practice.
 * This allows users to review their mistakes and understand their learning patterns.
 */
export async function addIncorrectAttemptsTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create incorrect_attempts table
    const createIncorrectAttemptsTable = `
      CREATE TABLE IF NOT EXISTS incorrect_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vocabulary_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        incorrect_answer TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        practice_mode TEXT NOT NULL DEFAULT 'word-translation',
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.run(createIncorrectAttemptsTable, (err) => {
      if (err) {
        console.error('Error creating incorrect_attempts table:', err);
        reject(err);
        return;
      }
      
      console.log('Incorrect attempts table created successfully');
      
      // Create indexes for better performance on lookups
      const createVocabularyIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_incorrect_attempts_vocabulary_id 
        ON incorrect_attempts(vocabulary_id)
      `;
      
      db.run(createVocabularyIndexQuery, (err) => {
        if (err) {
          console.error('Error creating incorrect_attempts vocabulary_id index:', err);
          reject(err);
          return;
        }
        
        console.log('Incorrect attempts vocabulary_id index created successfully');
        
        // Create index on user_id for user-specific queries
        const createUserIndexQuery = `
          CREATE INDEX IF NOT EXISTS idx_incorrect_attempts_user_id 
          ON incorrect_attempts(user_id)
        `;
        
        db.run(createUserIndexQuery, (err) => {
          if (err) {
            console.error('Error creating incorrect_attempts user_id index:', err);
            reject(err);
            return;
          }
          
          console.log('Incorrect attempts user_id index created successfully');
          
          // Create composite index for efficient user + vocabulary queries
          const createCompositeIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_incorrect_attempts_user_vocabulary 
            ON incorrect_attempts(user_id, vocabulary_id)
          `;
          
          db.run(createCompositeIndexQuery, (err) => {
            if (err) {
              console.error('Error creating incorrect_attempts composite index:', err);
              reject(err);
              return;
            }
            
            console.log('Incorrect attempts composite index created successfully');
            resolve();
          });
        });
      });
    });
  });
}
