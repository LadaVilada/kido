# Security Guidelines

## Environment Variables

### Never Commit These Files
- `.env`
- `.env.local`
- `.env.*.local`
- Any file containing API keys or secrets

### Setup Instructions
1. Copy `.env.example` to `.env.local`
2. Fill in your actual Firebase credentials
3. Never commit `.env.local` to git

## Firebase Service Account Keys

### Never Commit These Files
- `*-firebase-adminsdk-*.json`
- `serviceAccountKey.json`
- Any JSON file containing private keys

### Storage
- Store service account keys outside the repository
- Use environment variables or secure secret management
- For production, use Firebase Functions config or Cloud Secret Manager

## API Keys

### Public vs Private Keys
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for Firebase client config)
- Non-prefixed variables are server-side only (keep these secret)

### Firebase Public Keys
Firebase client API keys (NEXT_PUBLIC_FIREBASE_API_KEY) are safe to expose as they're protected by:
- Firebase Security Rules
- Domain restrictions in Firebase Console
- Authentication requirements

## Checking for Exposed Secrets

Run this command to check if any sensitive files are tracked:
```bash
git ls-files | grep -E "\\.env|serviceAccount|firebase-adminsdk"
```

If any are found, remove them from git history:
```bash
git rm --cached .env.local
git commit -m "Remove accidentally committed env file"
```

## Production Deployment

1. Set environment variables in your hosting platform (Vercel, etc.)
2. Never store secrets in code or config files
3. Use Firebase Security Rules to protect data
4. Enable Firebase App Check for additional security
