# ShieldBot — Safety-Aware NLP Chatbot

ShieldBot is a safety-aware chat experience designed for kids/teens, with:
- real-time risk classification (rules + parental filters + Gemini)
- logging/escalation for non-safe events
- parental supervision (link accounts, view transcripts, set blocked keywords)
- account settings (export, delete, appearance)

This repo is a Vite + React frontend with Firebase (Auth + Firestore) and a lightweight Express server that hosts the app and exposes a couple admin/health endpoints.

## What’s implemented (and where)

### 1) Authentication + roles
- Google sign-in via Firebase Auth (popup)
- Role selection on first login (parent/child/user) stored in Firestore

Implementation:
- Auth + role selection flow: [src/App.tsx](src/App.tsx)
- Firebase init (Auth + Firestore): [src/firebase.ts](src/firebase.ts)
- User profile shape (role stored in `users/{uid}`): [src/types.ts](src/types.ts)

Firestore:
- `users/{uid}` is created/updated on first login and role selection

### 2) Chat UI (text + image + voice) with persistence
- Real-time chat history (Firestore `onSnapshot`)
- Send text messages and receive a bot reply
- Attach an image (base64) and classify it before replying
- Voice input (browser speech recognition) to transcribe and send
- Clear chat history (deletes all `chats` for the current user)

Implementation:
- Chat UI + Firestore persistence + image/voice: [src/components/ChatInterface.tsx](src/components/ChatInterface.tsx)
- Message types: [src/types.ts](src/types.ts)

Firestore:
- `chats` collection stores both user and bot messages (each message is a document)

### 3) Safety pipeline (rules → parental filters → Gemini) + logging
For every user message, ShieldBot runs a safety check and returns:
- `riskLevel`: `Safe | Low | Moderate | High`
- `category`: human-friendly tag
- `explanation`: short internal reason
- `suggestedResponse`: the actual bot reply text shown to the child

Pipeline order:
1. Keyword rules (admin-managed) from Firestore `rules`
2. Parental blocked keywords from Firestore `childSettings/{childUid}`
3. Gemini classification + response generation (JSON schema response)

Logging:
- Non-`Safe` events are written to Firestore `logs` (includes `escalated` when `High`)

Implementation:
- Safety classification + Gemini prompts + logging: [src/services/safetyService.ts](src/services/safetyService.ts)
- Risk/log types: [src/types.ts](src/types.ts)

Firestore:
- `rules` collection: keyword → riskLevel/category
- `childSettings/{childUid}`: `blockedKeywords[]` and `blockedTopics[]` (topics are present but not yet enforced)
- `logs` collection: stored only when the risk is not `Safe`

### 4) Parental supervision dashboard
- Link a child account by email (child must have logged in at least once so a `users` doc exists)
- View the child’s chat transcript (from `chats`)
- View recent safety alerts (from `logs`)
- Add/remove blocked keywords for that child (writes to `childSettings/{childUid}`)

Implementation:
- Parental dashboard UI + Firestore reads/writes: [src/components/ParentalDashboard.tsx](src/components/ParentalDashboard.tsx)

Firestore:
- `supervision/{guardianUid_childUid}` link docs
- `childSettings/{childUid}` settings docs

### 5) Admin dashboard (rules + logs + “retrain”)
- Create/delete keyword-based safety rules (Firestore `rules`)
- View latest safety logs (Firestore `logs`, limited to 50)
- Trigger a mock “model retraining” call (`POST /api/admin/retrain`)

Implementation:
- Admin UI: [src/components/AdminDashboard.tsx](src/components/AdminDashboard.tsx)
- Mock retrain endpoint: [server.ts](server.ts)

Note: the admin dashboard component exists and is wired in [src/App.tsx](src/App.tsx), but the current chat header button opens Settings (not Admin). If you want the Admin UI accessible, wire `onOpenAdmin()` in [src/components/ChatInterface.tsx](src/components/ChatInterface.tsx).

### 6) Settings (local UI prefs + profile + export + delete)
- Dark/light mode + chat font size saved in `localStorage`
- Update display name (Firebase Auth profile + Firestore `users/{uid}`)
- Export chat history to a `.txt` download
- Delete account (deletes `chats`, `logs`, `users/{uid}` and then deletes the Firebase Auth user)

Implementation:
- Settings modal: [src/components/SettingsPanel.tsx](src/components/SettingsPanel.tsx)

### 7) Error handling for Firestore operations
- Central helper that logs structured error context
- Shows an alert on “insufficient permissions” errors

Implementation:
- Firestore error helper: [src/services/errorService.ts](src/services/errorService.ts)

## Data model (Firestore)

Collections used by the app:
- `users/{uid}`: `{ email, displayName, role, createdAt }`
- `chats/{id}`: `{ uid, text, sender, timestamp, riskLevel, riskCategory?, explanation? }`
- `logs/{id}`: `{ uid, timestamp, text, riskLevel, riskCategory, escalated }`
- `rules/{id}`: `{ keyword, category, riskLevel }`
- `supervision/{guardianUid_childUid}`: `{ guardianUid, childUid, childEmail, status }`
- `childSettings/{childUid}`: `{ childUid, blockedKeywords[], blockedTopics[] }`

## Security (Firestore rules)

Security rules are defined in [firestore.rules](firestore.rules). Highlights:
- A user can read their own chats/logs.
- A guardian can read a child’s chats/logs if a matching `supervision` doc exists.
- `rules` writes require admin access.

Admin check is implemented as:
- `users/{uid}.role == 'admin'` OR
- a hardcoded admin email in the rules file.

## Tech stack

- Frontend: React + Vite + Tailwind
- Backend: Express (dev uses Vite middleware)
- Auth/DB: Firebase Auth + Firestore
- AI: Google Gemini via `@google/genai`

See dependencies in [package.json](package.json).

## Running locally

### Prerequisites
- Node.js (LTS recommended)
- A Firebase project with Firestore + Google sign-in enabled

### 1) Install deps
```bash
npm install
```

### 2) Configure environment variables
Copy [.env.example](.env.example) to `.env.local` (or `.env`) and set:
- `GEMINI_API_KEY`

Important: the current safety service reads `import.meta.env.VITE_GEMINI_API_KEY` in [src/services/safetyService.ts](src/services/safetyService.ts). If your environment only provides `GEMINI_API_KEY`, you can either:
- set `VITE_GEMINI_API_KEY` as well, or
- update the code to read `GEMINI_API_KEY` consistently.

### 3) Firebase configuration
The app currently initializes Firebase from [firebase-applet-config.json](firebase-applet-config.json) via [src/firebase.ts](src/firebase.ts).

If you are using your own Firebase project, replace values in that JSON with your project’s web app config.

### 4) Run dev server
```bash
npm run dev
```

This starts the Express server in [server.ts](server.ts) on `http://localhost:3000` and mounts Vite middleware for the React SPA.

## Scripts

- `npm run dev` — start Express + Vite middleware
- `npm run build` — build the SPA to `dist/`
- `npm run preview` — preview the built SPA
- `npm run lint` — TypeScript typecheck

## Project structure (high level)

- Frontend entry: [src/main.tsx](src/main.tsx) → [src/App.tsx](src/App.tsx)
- UI components: [src/components](src/components)
- Services: [src/services](src/services)
- Server: [server.ts](server.ts)
- Firestore rules: [firestore.rules](firestore.rules)
