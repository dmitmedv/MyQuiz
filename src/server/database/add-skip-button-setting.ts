import { db } from './init';

export async function addSkipButtonSetting(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting skip button setting migration...');

    // Add skip_button_enabled column to user_settings table
    db.run("ALTER TABLE user_settings ADD COLUMN skip_button_enabled BOOLEAN DEFAULT 0", (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration failed:', err);
        reject(err);
        return;
      }

      if (err && err.message.includes('duplicate column name')) {
        console.log('Skip button setting column already exists, skipping migration');
        resolve();
        return;
      }

      console.log('Skip button setting column added successfully. Default value is disabled (0).');
      resolve();
    });
  });
}
