import { db } from './init';

export async function addAutoInsertSetting(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting auto-insert setting migration...');

    // Add auto_insert_enabled column to user_settings table
    db.run("ALTER TABLE user_settings ADD COLUMN auto_insert_enabled BOOLEAN DEFAULT 0", (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration failed:', err);
        reject(err);
        return;
      }

      if (err && err.message.includes('duplicate column name')) {
        console.log('Auto-insert setting column already exists, skipping migration');
        resolve();
        return;
      }

      console.log('Auto-insert setting column added successfully. Default value is disabled (0).');
      resolve();
    });
  });
}
