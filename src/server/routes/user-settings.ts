import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { UserSettings, UpdateUserSettingsRequest } from '../types';

const router = Router();

// Helper function to get user settings by user ID
function getUserSettings(userId: number): Promise<UserSettings | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, user_id, selected_languages, skip_button_enabled, created_at, updated_at FROM user_settings WHERE user_id = ?',
      [userId],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          // Parse the selected_languages JSON string back to array
          const settings: UserSettings = {
            ...row,
            selected_languages: JSON.parse(row.selected_languages),
            skip_button_enabled: Boolean(row.skip_button_enabled) // Ensure boolean type
          };
          resolve(settings);
        } else {
          resolve(null);
        }
      }
    );
  });
}

// GET /api/user/settings - Get user's language settings
router.get('/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    
    // Try to get existing settings
    let settings = await getUserSettings(userId);
    
    // If no settings exist, create default ones
    if (!settings) {
      const defaultLanguages = ['english', 'serbian', 'russian', 'spanish'];
      
      const settingsId = await new Promise<number>((resolve, reject) => {
        db.run(
          'INSERT INTO user_settings (user_id, selected_languages, skip_button_enabled) VALUES (?, ?, ?)',
          [userId, JSON.stringify(defaultLanguages), 0], // Default skip_button_enabled to false (0)
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Get the newly created settings
      settings = await getUserSettings(userId);
    }

    if (!settings) {
      return res.status(500).json({ error: 'Failed to retrieve user settings' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/settings - Update user's language settings
router.put('/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { selected_languages, skip_button_enabled }: UpdateUserSettingsRequest = req.body;

    // Validate input
    if (!selected_languages || !Array.isArray(selected_languages)) {
      return res.status(400).json({ error: 'selected_languages must be an array' });
    }

    if (selected_languages.length === 0) {
      return res.status(400).json({ error: 'At least one language must be selected' });
    }

    // Valid language codes
    const validLanguages = ['english', 'serbian', 'russian', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'arabic', 'hindi'];
    
    // Check if all selected languages are valid
    const invalidLanguages = selected_languages.filter(lang => !validLanguages.includes(lang));
    if (invalidLanguages.length > 0) {
      return res.status(400).json({ 
        error: `Invalid languages: ${invalidLanguages.join(', ')}. Valid languages are: ${validLanguages.join(', ')}` 
      });
    }

    // Check if settings exist for this user
    const existingSettings = await getUserSettings(userId);
    
    // Prepare the skip_button_enabled value (default to false if not provided)
    const skipButtonEnabled = skip_button_enabled !== undefined ? (skip_button_enabled ? 1 : 0) : 0;

    if (existingSettings) {
      // Update existing settings
      await new Promise<void>((resolve, reject) => {
        db.run(
          'UPDATE user_settings SET selected_languages = ?, skip_button_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
          [JSON.stringify(selected_languages), skipButtonEnabled, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Create new settings
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO user_settings (user_id, selected_languages, skip_button_enabled) VALUES (?, ?, ?)',
          [userId, JSON.stringify(selected_languages), skipButtonEnabled],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Return updated settings
    const updatedSettings = await getUserSettings(userId);
    
    if (!updatedSettings) {
      return res.status(500).json({ error: 'Failed to update user settings' });
    }

    res.json(updatedSettings);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
