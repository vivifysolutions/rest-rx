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

Open [http://localhost:9000](http://localhost:9000) to view the landing page.

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

## Web portal (team & partners)

Shared sign-in at **`/portal/login`** (not branded as “admin”). After Firebase auth, users are routed by **`userType`** on their profile in the API:

| `userType` | Destination |
|------------|-------------|
| `admin` | `/admin` — content management |
| `brand_partner` | `/brand` — brand dashboard |
| `expert` | `/admin/community` — community review |
| `member` | `/portal/unauthorized` — use the mobile app |

Roles are stored on `User.userType` in Postgres (not env allowlists). API guards enforce the same rules on write endpoints.

**Bootstrap the first admin** (after sign-up / `GET /users/me` created the row):

```sql
UPDATE users SET "userType" = 'admin' WHERE email = 'founder@example.com';
```

Or use **Management → Users** once any admin account exists.

1. Copy `.env.example` → `.env.local` (Firebase + `NEXT_PUBLIC_API_URL`).
2. Run `rest-and-rx/api` on port **3000** (`npm run start:dev`) and this site on port **9000** (`npm run dev`).
3. Open [http://localhost:9000/portal/login](http://localhost:9000/portal/login)

| Route | Who |
|-------|-----|
| `/portal/login` | All portal roles |
| `/admin/*` | `admin` (experts: `/admin/community` only) |
| `/brand` | `brand_partner` |

## Scripts

- `npm run dev` – Start dev server (Turbopack)
- `npm run build` – Production build
- `npm run start` – Run production server
- `npm run lint` – Run ESLint
