# ShieldBot — Safety-Aware NLP Chatbot

ShieldBot is a safety-aware chat experience designed for kids/teens, with:
- real-time risk classification (rules + parental filters + Ollama)
- logging/escalation for non-safe events
- parental supervision (link accounts, view transcripts, set blocked keywords)
- account settings (export, delete, appearance)

This repo contains:
- a lightweight Express REST API backend (root)
- a separate Vite + React frontend app in `frontend/`

Auth is email/password + JWT. Safety classification uses Ollama (local model).

## What’s implemented (and where)

### 1) Authentication + roles
- Email/password login & registration via REST
- Role selection on registration (parent/child/user/admin)

Implementation:
- Frontend auth flow: [frontend/src/App.tsx](frontend/src/App.tsx)
- Auth API routes: [src/routes/auth.ts](src/routes/auth.ts)
- Types: [src/types.ts](src/types.ts)

### 2) Chat UI (text + image + voice) with persistence
- Chat history via REST polling
- Send text (and optional image base64) and receive a bot reply
- Voice input (browser speech recognition) to transcribe and send
- Clear chat history (deletes all chats for the current user)

Implementation:
- Chat UI: [frontend/src/pages/ChatPage.tsx](frontend/src/pages/ChatPage.tsx)
- Message types: [src/types.ts](src/types.ts)

### 3) Safety pipeline (rules → parental filters → Ollama) + logging
For every user message, ShieldBot runs a safety check and returns:
- `riskLevel`: `Safe | Low | Moderate | High`
- `category`: human-friendly tag
- `explanation`: short internal reason
- `suggestedResponse`: the actual bot reply text shown to the child

Pipeline order:
1. Keyword rules (admin-managed) from PostgreSQL
2. Parental blocked keywords from PostgreSQL child settings
3. Ollama classification + response generation (JSON)

Logging:
- Non-`Safe` events are written to the `logs` table (includes `escalated` when `High`)

Implementation:
- Safety endpoint: [src/routes/safety.ts](src/routes/safety.ts)
- Ollama service + memory: [src/services/ollamaService.ts](src/services/ollamaService.ts)
- Risk/log types: [src/types.ts](src/types.ts)

### 4) Parental supervision dashboard
- Link a child account by email
- View the child’s chat transcript (from `chats`)
- View recent safety alerts (from `logs`)
- Add/remove blocked keywords for that child (writes to `childSettings/{childUid}`)

Implementation:
- Parental dashboard UI: [frontend/src/pages/ParentalPage.tsx](frontend/src/pages/ParentalPage.tsx)
- Routes: [src/routes/supervision.ts](src/routes/supervision.ts), [src/routes/childSettings.ts](src/routes/childSettings.ts), [src/routes/chats.ts](src/routes/chats.ts), [src/routes/logs.ts](src/routes/logs.ts)

### 5) Admin dashboard (rules + logs + “retrain”)
- Create/delete keyword-based safety rules (PostgreSQL)
- View latest safety logs (limited to 50)
- Trigger a mock “model retraining” call (`POST /api/admin/retrain`, if implemented)

Implementation:
- Admin UI: [frontend/src/pages/AdminPage.tsx](frontend/src/pages/AdminPage.tsx)

### 6) Settings (local UI prefs + profile + export + delete)
- Dark/light mode + chat font size saved in `localStorage`
- Update display name (REST profile update)
- Export chat history to a `.txt` download
- Delete account (deletes chats/logs/user in PostgreSQL)

Implementation:
- Settings page: [frontend/src/pages/SettingsPage.tsx](frontend/src/pages/SettingsPage.tsx)
## Data model (PostgreSQL)

Tables used by the app are defined in [src/db/schema.ts](src/db/schema.ts) (users, chats, logs, safety_rules, supervision, child_settings).

## Tech stack

- Frontend: React + Vite + Tailwind
- Backend: Express
- Auth: JWT (email/password)
- DB: PostgreSQL + Drizzle ORM
- AI: Ollama (local)

See dependencies in [package.json](package.json).

## Running locally

### Prerequisites
- Node.js (LTS recommended)
- PostgreSQL
- Ollama (optional, required for `/api/safety/classify`)

### 1) Install deps
```bash
npm install
```

Then install frontend deps:
```bash
npm --prefix frontend install
```

### 2) Configure environment variables
Copy [.env.example](.env.example) to `.env` (or `.env.local`) and set at minimum:
- `DATABASE_URL`
- `JWT_SECRET`

Optional (Ollama):
- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_MODEL` / `OLLAMA_VISION_MODEL`

### 3) Apply DB schema
```bash
npm run db:migrate
```

### 4) Run dev server
```bash
npm run dev
```

This starts:
- backend API at `http://127.0.0.1:3000`
- frontend dev server at `http://127.0.0.1:5173` (proxying `/api` to the backend)

If you see `426 Upgrade Required` in Postman, use `http://127.0.0.1:PORT` instead of `http://localhost:PORT`.

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
- DB schema: [src/db/schema.ts](src/db/schema.ts)
