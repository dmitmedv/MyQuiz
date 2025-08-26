import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/vocabulary.db'
  : path.join(__dirname, '../../../data/vocabulary.db');

export const db = new sqlite3.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create users table first
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createUsersTable, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Users table created successfully');

      // Create vocabulary table with language field and attempt tracking
      const createVocabularyTable = `
        CREATE TABLE IF NOT EXISTS vocabulary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL,
          translation TEXT NOT NULL,
          language TEXT NOT NULL DEFAULT 'serbian',
          learned BOOLEAN DEFAULT 0,
          correct_attempts INTEGER DEFAULT 0,
          wrong_attempts INTEGER DEFAULT 0,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

    db.run(createVocabularyTable, (err) => {
      if (err) {
        reject(err);
        return;
      }

        // Add language column if it doesn't exist (for existing databases)
        db.run("ALTER TABLE vocabulary ADD COLUMN language TEXT DEFAULT 'serbian'", (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('Warning: Could not add language column:', err.message);
          } else {
            console.log('Language column added successfully. Existing items will use default language: serbian');
          }
        });

        // Add attempt tracking columns if they don't exist (for existing databases)
        db.run("ALTER TABLE vocabulary ADD COLUMN correct_attempts INTEGER DEFAULT 0", (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('Warning: Could not add correct_attempts column:', err.message);
          } else {
            console.log('Correct attempts column added successfully. Existing items will start with 0 attempts.');
          }
        });

        db.run("ALTER TABLE vocabulary ADD COLUMN wrong_attempts INTEGER DEFAULT 0", (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('Warning: Could not add wrong_attempts column:', err.message);
          } else {
            console.log('Wrong attempts column added successfully. Existing items will start with 0 attempts.');
          }
        });

        // Add user_id column if it doesn't exist (for existing databases)
        // For migration, we'll set a default user_id of 1 for existing vocabulary items
        db.run("ALTER TABLE vocabulary ADD COLUMN user_id INTEGER DEFAULT 1", (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('Warning: Could not add user_id column:', err.message);
          } else {
            console.log('User_id column added successfully. Existing items will be assigned to user_id 1.');
          }
        });

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

        // Drop the old unique index that doesn't include user_id (for migration)
        db.run("DROP INDEX IF EXISTS idx_vocabulary_word_language", (err) => {
          // Ignore error if index doesn't exist
          if (err && !err.message.includes('no such index')) {
            console.warn('Warning: Could not drop old unique index:', err.message);
          } else {
            console.log('Old unique index dropped successfully (if it existed).');
          }
        });

        // Create unique index to prevent duplicate words in the same language for the same user
        const createUniqueIndex = `
          CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_word_language_user 
          ON vocabulary(word, language, user_id)
        `;

        db.run(createUniqueIndex, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Create indexes for users table
          const createUserIndexes = `
            CREATE INDEX IF NOT EXISTS idx_users_email 
            ON users(email)
          `;

          db.run(createUserIndexes, (err) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('Database tables and indexes created successfully');
            resolve();
          });
        });
      });
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