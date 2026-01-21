# Kids Activity Scheduler

A Progressive Web Application (PWA) that enables parents to efficiently manage their children's activities with recurring schedules and push notifications.

## Features

- 🔐 Secure authentication with Firebase Auth (email/password + Google OAuth)
- 👶 Child profile management with color coding
- 📅 Weekly calendar view for activity scheduling
- 🔔 Push notifications for activity reminders
- 📱 PWA support for mobile installation
- 🌐 Offline functionality
- 🎨 Modern UI with shadcn/ui components
- ⚡ Real-time updates with Firestore
- 📊 Dashboard with activity overview

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Auth + Firestore + Cloud Functions)
- **Hosting**: Vercel (frontend) + Firebase (backend)
- **PWA**: next-pwa with service worker

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd kids-activity-scheduler
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (email/password + Google)
   - Create a Firestore database
   - Copy your Firebase config to `.env.local`

4. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Firebase configuration values.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Email/Password and Google providers
4. Create a Firestore database in production mode
5. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Deploy Cloud Functions for notifications:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
7. Add your domain to authorized domains in Authentication settings
8. Copy the config values to your `.env.local` file

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Deploy to Vercel**:
   - Connect your repository to Vercel
   - Add environment variables
   - Deploy automatically on push to main

2. **Deploy Firebase**:
   ```bash
   firebase deploy
   ```

3. **Verify Deployment**:
   - Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## PWA Installation

The app can be installed as a PWA on mobile devices and desktop browsers. Users will see an "Add to Home Screen" prompt when visiting the app.

## Project Structure

```
kids-activity-scheduler/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── services/         # Firebase services
│   └── types/            # TypeScript types
├── functions/            # Firebase Cloud Functions
├── public/               # Static assets
├── docs/                 # Documentation
└── firestore.rules       # Firestore security rules
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Testing

See [E2E_INTEGRATION_TEST.md](docs/E2E_INTEGRATION_TEST.md) for comprehensive testing guide.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [E2E Testing Guide](docs/E2E_INTEGRATION_TEST.md)
- [Notification Setup](docs/NOTIFICATION_SETUP.md)
- [PWA Configuration](docs/PWA.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

