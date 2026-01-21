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

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Auth + Firestore)
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
5. Add your domain to authorized domains in Authentication settings
6. Copy the config values to your `.env.local` file

## PWA Installation

The app can be installed as a PWA on mobile devices and desktop browsers. Users will see an "Add to Home Screen" prompt when visiting the app.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License
