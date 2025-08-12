#!/bin/bash

# Deploy script for MyQuiz application on Render.com

echo "🚀 Starting deployment preparation for Render.com..."

# Build the application
echo "📦 Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Add all changes to git
    echo "📝 Adding changes to git..."
    git add .
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Deploy: Prepare for Render.com deployment - $(date)"
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "🎉 Deployment preparation completed!"
    echo ""
    echo "Next steps for Render.com deployment:"
    echo "1. Go to https://render.com and sign up/login"
    echo "2. Click 'New +' and select 'Web Service'"
    echo "3. Connect your GitHub repository: dmitmedv/MyQuiz"
    echo "4. Configure the service:"
    echo "   - Name: myquiz-app"
    echo "   - Build Command: npm run build"
    echo "   - Start Command: npm start"
    echo "   - Environment Variables:"
    echo "     - NODE_ENV: production"
    echo "     - PORT: 10000 (or leave default)"
    echo "5. Click 'Create Web Service'"
    echo ""
    echo "Your app will be available at: https://your-app-name.onrender.com"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
