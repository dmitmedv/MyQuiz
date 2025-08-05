# MyQuiz - Foreign Language Learning App

A responsive web application similar to Quizlet, designed to help users learn foreign words and expressions through interactive practice sessions.

## Features

- **Vocabulary Management**: Add, edit, and delete foreign words with their translations
- **Practice Mode**: Interactive word-translation practice with immediate feedback
- **Progress Tracking**: Mark words as learned and track your learning progress
- **Statistics Dashboard**: View detailed learning statistics and progress overview
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **SQLite Database**: Persistent storage for all vocabulary data

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React with TypeScript
- **Database**: SQLite
- **Styling**: Tailwind CSS
- **Language**: TypeScript (full-stack)

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dmitry/MyQuiz.git
   cd MyQuiz
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

   This will install dependencies for both the backend and frontend.

## Development

### Starting the Development Server

Run both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Individual Development Commands

- **Backend only**: `npm run dev:server`
- **Frontend only**: `npm run dev:client`

## Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Usage

### Adding Vocabulary

1. Navigate to the "Add Word" page
2. Enter a foreign word or phrase
3. Enter its translation
4. Click "Add Word" to save

### Practice Mode

1. Go to the "Practice" page
2. You'll see a foreign word to translate
3. Enter your translation in the input field
4. Click "Check Answer" or press Enter
5. If correct, the word is automatically marked as learned
6. Click "Next Word" to continue practicing

### Managing Vocabulary

- **View all words**: Visit the main "Vocabulary" page
- **Edit words**: Click the "Edit" button on any vocabulary card
- **Delete words**: Click the "Delete" button (with confirmation)
- **Mark as learned**: Toggle the learned status directly from the vocabulary list

### Tracking Progress

- **Statistics**: Visit the "Stats" page to see your learning progress
- **Progress overview**: View total words, learned words, and completion percentage
- **Recent activity**: See recently added words
- **Word lists**: Separate lists for learned and unlearned words

## API Endpoints

### Vocabulary Management

- `GET /api/vocabulary` - Get all vocabulary items
- `GET /api/vocabulary/:id` - Get specific vocabulary item
- `POST /api/vocabulary` - Create new vocabulary item
- `PUT /api/vocabulary/:id` - Update vocabulary item
- `DELETE /api/vocabulary/:id` - Delete vocabulary item

### Practice

- `GET /api/practice/word` - Get random unlearned word for practice
- `POST /api/practice/check` - Check answer and mark as learned if correct
- `GET /api/practice/stats` - Get practice statistics
- `POST /api/practice/reset` - Reset all words to unlearned status

## Database Schema

The application uses SQLite with the following schema:

```sql
CREATE TABLE vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  learned BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
MyQuiz/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── ...
│   └── package.json
├── src/
│   └── server/             # Node.js backend
│       ├── database/       # Database initialization
│       ├── routes/         # API routes
│       ├── types/          # TypeScript type definitions
│       └── index.ts        # Server entry point
├── data/                   # SQLite database files
├── package.json            # Root package.json
└── README.md
```

## Features in Detail

### Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers (1024px+)
- Tablet devices (768px - 1023px)
- Mobile devices (< 768px)

### Practice Algorithm

- Randomly selects unlearned words for practice
- Case-insensitive answer checking
- Automatic marking as learned when answered correctly
- Immediate feedback with correct/incorrect indicators

### Data Persistence

- All vocabulary data is stored in SQLite database
- Database is automatically created on first run
- Data persists between application restarts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Deployment

### GitHub Pages (Recommended)

The application is automatically deployed to GitHub Pages when you push to the main branch.

1. **Push your changes**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Access your deployed app**:
   - Go to: `https://dmitry.github.io/MyQuiz`
   - The app will be available after GitHub Actions completes the deployment

### Manual Deployment

You can also deploy manually using the provided script:

```bash
./deploy.sh
```

### Local Development

For local development, use:
```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000) servers.

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue in the repository.

## Live Demo

🌐 **Live Application**: [https://dmitry.github.io/MyQuiz](https://dmitry.github.io/MyQuiz) 