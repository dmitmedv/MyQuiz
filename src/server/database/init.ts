import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/vocabulary.db'
  : path.join(__dirname, '../../../data/vocabulary.db');

export const db = new sqlite3.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create vocabulary table
    const createVocabularyTable = `
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        translation TEXT NOT NULL,
        learned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createVocabularyTable, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create index for better performance
      const createIndex = `
        CREATE INDEX IF NOT EXISTS idx_vocabulary_learned 
        ON vocabulary(learned)
      `;

      db.run(createIndex, (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('Database tables created successfully');
        resolve();
      });
    });
  });
}

export function closeDatabase(): void {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
} 