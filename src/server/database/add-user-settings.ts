import { db } from './init';

/**
 * Database migration to add user_settings table for language preferences
 * This table stores which languages each user has selected for vocabulary learning
 */
export async function addUserSettingsTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create user_settings table
    const createUserSettingsTable = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        selected_languages TEXT NOT NULL DEFAULT '["english","serbian","russian","spanish"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.run(createUserSettingsTable, (err) => {
      if (err) {
        console.error('Error creating user_settings table:', err);
        reject(err);
        return;
      }
      
      console.log('User settings table created successfully');
      
      // Add default settings for existing users
      const insertDefaultSettings = `
        INSERT INTO user_settings (user_id, selected_languages)
        SELECT id, '["english","serbian","russian","spanish"]'
        FROM users 
        WHERE id NOT IN (SELECT user_id FROM user_settings)
      `;

      db.run(insertDefaultSettings, (insertErr) => {
        if (insertErr) {
          console.error('Error adding default settings for existing users:', insertErr);
          // Don't reject here - table creation succeeded
        } else {
          console.log('Default settings added for existing users');
        }
        resolve();
      });
    });
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addUserSettingsTable()
    .then(() => {
      console.log('User settings migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('User settings migration failed:', error);
      process.exit(1);
    });
}
