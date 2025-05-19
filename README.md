# Snippy Backend

This is the backend service for Snippy, a URL shortening application.

## Deployment to Vercel

### Prerequisites

1. A Vercel account
2. Vercel CLI installed (optional for command-line deployment)
3. Firebase project set up with Firestore

### Environment Variables

Make sure to set up the following environment variables in your Vercel project:

- `BASE_URL`: The base URL of your deployed backend (e.g., https://snippy-backend.vercel.app)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key (make sure to escape newlines)
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email
- `SLUG_LENGTH`: Length of generated slugs (default: 6)
- `FRONTEND_URL`: URL of your frontend application for CORS

### Deployment Steps

#### Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your Vercel dashboard
3. Click "New Project"
4. Import your repository
5. Select the "backend" directory as the root directory
6. Configure the environment variables
7. Click "Deploy"

#### Using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the backend directory: `cd backend`
3. Run: `vercel`
4. Follow the prompts to link to your Vercel account and project
5. For production deployment, run: `vercel --prod`

### Important Notes

- The Firebase service account key file should not be committed to your repository
- Use environment variables for all sensitive information
- Make sure your Firebase security rules are properly configured
- Update the CORS settings in `config/corsOptions.js` to match your frontend URL

## Local Development

1. Install dependencies: `npm install`
2. Set up your environment variables:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Edit `.env` with your Firebase credentials and other configuration
3. Run the development server: `npm run dev`

## Firebase Credentials Setup

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Open the downloaded JSON file
6. Copy the values to your `.env` file:
   - `FIREBASE_PROJECT_ID` = `project_id` from the JSON
   - `FIREBASE_PRIVATE_KEY` = `private_key` from the JSON (keep the quotes)
   - `FIREBASE_CLIENT_EMAIL` = `client_email` from the JSON
7. **IMPORTANT**: Do not commit the downloaded JSON file to your repository

You can use our helper script to extract the credentials:
```bash
npm run extract-firebase-creds path/to/your-firebase-credentials.json
```
This will output the formatted environment variables to copy to your .env file.

## Subscription Plans API (Coming Soon)

The backend includes support for subscription plans:
- Free plan: 5 URLs per user
- Starter plan (₹50): 50 URLs, custom slugs, 30-day validity
- Premium plan (₹100): Unlimited URLs, advanced features

Razorpay integration will be available for processing payments.
