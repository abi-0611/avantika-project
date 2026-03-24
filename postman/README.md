# ShieldBot Postman Tests

This folder contains a Postman Collection + Environment you can import to test every REST endpoint.

## Files
- `ShieldBot.postman_collection.json` — all API requests
- `ShieldBot.postman_environment.json` — variables for localhost, test users, tokens

## Prereqs
1) App running locally:
- `npm run dev`
- Verify in browser: `http://localhost:3000`

If port `3000` is already in use, you can run with a different port:
- PowerShell: `$env:PORT=3001; $env:VITE_HMR_PORT=24679; npm run dev`
- Then set Postman `baseUrl` to `http://localhost:3001`

2) Database migrated:
- `npm run db:migrate`

3) Optional (only required for `/api/safety/classify`): Ollama running and models pulled
- `ollama serve`
- `ollama pull llama3.1`
- `ollama pull llava`

## Import into Postman
1) Open Postman
2) **Import** → select `ShieldBot.postman_collection.json`
3) **Import** → select `ShieldBot.postman_environment.json`
4) In the top-right environment dropdown, select **ShieldBot Local**

## Configure variables (if needed)
Open the environment and verify:
- `baseUrl` is `http://localhost:3000`
- Emails/passwords can be anything you want

Tokens (`parentToken`, `childToken`, `adminToken`) start empty and get auto-filled when you run the login/register requests.

## Recommended run order
### 1) Health
- `Health` → `GET /api/health`

### 2) Auth (creates users & captures tokens)
In `Auth` folder, run:
- `POST /api/auth/register (parent)` then `POST /api/auth/login (parent)`
- `POST /api/auth/register (child)` then `POST /api/auth/login (child)`
- `POST /api/auth/register (admin)` then `POST /api/auth/login (admin)`

Notes:
- If you already registered that email, register returns **409** (that’s OK). Just run the matching **login** request.

### 3) Link child (parent)
- `Supervision (Parent)` → `POST /api/supervision (link child by email)`

### 4) Child settings + child visibility (parent)
- `Child Settings (Parent)` → GET then PUT
- `Chats` → `GET /api/chats/child/:childUid`
- `Logs` → `GET /api/logs/child/:childUid`

### 5) Safety + memory (parent)
- `Safety` → `POST /api/safety/classify (text)`
- `Memory` → status/toggle/clear

If Ollama is not running, `/api/safety/classify` will likely return **500**.

### 6) Admin-only
- `Rules (Admin)` → GET/POST/DELETE
- `Logs` → `GET /api/logs (admin sees all)`

### 7) Admin retrain (mock)
- `Admin` → `POST /api/admin/retrain`

### Danger Zone
- `DELETE /api/auth/account (parent)` permanently deletes that user + data.

## Troubleshooting
- **401 Unauthorized**: run the corresponding login request again to refresh tokens.
- **403 Forbidden** (rules endpoints): ensure you logged in as admin and `adminToken` is set.
- **500 on classify**: start Ollama and ensure the model names match your `.env`.
- **426 Upgrade Required**: switch `baseUrl` from `http://localhost:...` to `http://127.0.0.1:...` (Postman can prefer IPv6 localhost and hit a WebSocket listener).
