#!/bin/bash

# Quick Deploy Script for Behind the Protocol
# This script helps you deploy to Vercel via GitHub

echo "🚀 Behind the Protocol - Quick Deploy Script"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "📝 Please login to GitHub first:"
    gh auth login
fi

echo "✅ GitHub authenticated"
echo ""

# Get repository name
read -p "Enter repository name (default: behind-the-protocol): " repo_name
repo_name=${repo_name:-behind-the-protocol}

# Get visibility
read -p "Make repository public? (y/n, default: y): " is_public
is_public=${is_public:-y}

echo ""
echo "📦 Creating GitHub repository..."
if [ "$is_public" = "y" ]; then
    gh repo create "$repo_name" --public --source=. --remote=origin
else
    gh repo create "$repo_name" --private --source=. --remote=origin
fi

echo ""
echo "⬆️  Pushing code to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed successfully!"
echo ""
echo "🌐 Next Steps:"
echo "   1. Go to https://vercel.com"
echo "   2. Click 'Add New Project'"
echo "   3. Import your repository: $repo_name"
echo "   4. Add environment variables (see .env.example)"
echo "   5. Click 'Deploy'"
echo ""
echo "📝 Required Environment Variables:"
echo "   - DATABASE_URL"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - CLERK_SECRET_KEY"
echo "   - RESEND_API_KEY"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "✨ Your site will be live at: https://$repo_name.vercel.app"