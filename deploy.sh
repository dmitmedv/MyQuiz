#!/bin/bash

# Deploy script for MyQuiz application

echo "🚀 Starting deployment process..."

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
    git commit -m "Deploy: $(date)"
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "🎉 Deployment completed! Your app will be available at:"
    echo "   https://dmitry.github.io/MyQuiz"
    echo ""
    echo "Note: It may take a few minutes for the changes to appear."
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi 