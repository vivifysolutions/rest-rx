# Rest & Rx Landing Page

Next.js landing page with Firebase configuration, following Vivify project conventions.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Copy `.env.example` to `.env.local`
   - Add your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/)
   - Required vars: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - Optional: auth domain, storage bucket, messaging sender ID, app ID, measurement ID

3. **Run dev server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

## Firebase Usage

The app exports from `src/lib/firebase.ts`:

- `auth` – Firebase Authentication
- `db` – Firestore
- `storage` – Firebase Storage
- `analytics` – Firebase Analytics (client-side only)

Import when needed:

```ts
import { auth, db, storage } from "@/lib/firebase";
```

## Scripts

- `npm run dev` – Start dev server (Turbopack)
- `npm run build` – Production build
- `npm run start` – Run production server
- `npm run lint` – Run ESLint
