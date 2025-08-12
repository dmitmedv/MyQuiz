# Deployment Guide for MyQuiz

This guide will help you deploy your MyQuiz application on Render.com.

## Prerequisites

- A GitHub account with your MyQuiz repository
- A Render.com account

## Quick Deployment

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub:**
   ```bash
   ./deploy-render.sh
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `dmitmedv/MyQuiz`
   - Render will automatically detect the `render.yaml` configuration
   - Click "Create Web Service"

### Option 2: Manual Configuration

1. **Push your code to GitHub:**
   ```bash
   ./deploy-render.sh
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `dmitmedv/MyQuiz`
   - Configure the service:
     - **Name**: `myquiz-app`
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `NODE_ENV`: `production`
       - `PORT`: `10000` (or leave default)
   - Click "Create Web Service"

## What Happens During Deployment

1. **Build Process:**
   - Render installs all dependencies (`npm install`)
   - Builds the server (`npm run build:server`)
   - Builds the client (`npm run build:client`)

2. **Runtime:**
   - Server starts on the assigned port
   - Serves both API endpoints and static frontend files
   - Database is initialized automatically

## Environment Variables

- `NODE_ENV`: Set to `production` automatically
- `PORT`: Assigned by Render (usually 10000)

## Database

- SQLite database is stored in the `/data` directory
- Data persists between deployments
- Database is automatically initialized on first run

## Monitoring

- **Health Check**: `/api/vocabulary` endpoint
- **Logs**: Available in Render dashboard
- **Auto-deploy**: Enabled for automatic updates

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript compilation succeeds locally
- Verify build commands work locally

### Runtime Errors
- Check Render logs for error messages
- Verify environment variables are set correctly
- Ensure database path is accessible

### API Issues
- Frontend automatically uses relative paths in production
- No CORS issues since frontend and backend are served together

## Local Development

For local development, the app still works as before:
```bash
npm run dev
```

## Production URL

Once deployed, your app will be available at:
`https://your-app-name.onrender.com`

The deployment process typically takes 5-10 minutes for the first deployment.
