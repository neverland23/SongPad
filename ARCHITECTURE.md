# VOIP Dashboard – React + Redux Refactor

This document describes the updated architecture after modernizing the frontend
to React 18 + Redux Toolkit + React Router, and aligning the backend with the new SPA.

---

## Top-level Structure

- `backend/` – Node.js + Express API, MongoDB models, Telnyx integration (Vercel serverless).
- `frontend/` – React 18 + Vite SPA with Redux Toolkit state management (Vercel hosted).
- `.github/`
   └── `workflows`
       └── `ci-cd.yml`

## CI/CD Pipeline Overview

`dev`	– No deploy / optional preview	none
`stage`	– Staging environment	https://staging.yourapp.vercel.app
`main` – Production environment	https://yourapp.vercel.app


---

## Frontend (React + Redux + Vite)

### Tooling

- **React**: 18.x (functional components + hooks)
- **Router**: `react-router-dom` v6+
- **State**: `@reduxjs/toolkit` + `react-redux`
- **Bundler/Dev Server**: Vite
- **Code Quality**:
  - ESLint (`.eslintrc.cjs`)
  - Prettier (`.prettierrc`)
  - TypeScript config (`tsconfig.json`) with `allowJs` enabled for gradual typing

### Folder Layout

```txt
frontend/
  package.json
  vite.config.js
  tsconfig.json
  .eslintrc.cjs
  .prettierrc
  index.html             # Vite entry, loads /src/main.jsx

  legacy/                # Original static implementation
    index.html
    login.html
    register.html
    dashboard.html
    order.html
    css/styles.css
    js/*.js

  src/
    main.jsx             # React root, Redux Provider, BrowserRouter
    App.jsx              # Router configuration

    styles.css           # Global styles (based on legacy styles.css)

    app/
      store.js           # configureStore(..)
      hooks.js           # typed wrappers around useDispatch/useSelector

    services/
      apiClient.js       # Fetch wrapper and API helpers, token management

    features/
      auth/
        authSlice.js
      numbers/
        numbersSlice.js
      voice/
        voiceSlice.js
      sms/
        smsSlice.js
      notifications/
        notificationsSlice.js

    components/
      layout/
        Header.jsx       # Top bar with user info and notifications
        Sidebar.jsx      # Left navigation sidebar
        DashboardLayout.jsx # Shell for /dashboard/* routes
      ui/
        Loader.jsx
        ErrorMessage.jsx

    pages/
      LandingPage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      OrderPage.jsx
      dashboard/
        NumbersPage.jsx
        VoicePage.jsx
        SmsPage.jsx
```

### Routing Design (React Router v6)

Routes are defined in `src/App.jsx`:

- `/` – `LandingPage`
- `/login` – `LoginPage`
- `/register` – `RegisterPage`
- `/dashboard/*` – Protected area, uses `DashboardLayout`
  - `/dashboard` → `NumbersPage` (index)
  - `/dashboard/numbers` → `NumbersPage`
  - `/dashboard/voice` → `VoicePage`
  - `/dashboard/sms` → `SmsPage`
- `/order` – `OrderPage` (protected; reads query params)

Authentication guard is implemented via a `RequireAuth` component in `App.jsx` using:
- Redux selector: `state.auth.token`
- React Router `<Navigate />` with `location.state.from` to round-trip to the original path after login.

### Redux Flow

#### Store

Configured in `src/app/store.js`:

```js
export const store = configureStore({
  reducer: {
    auth: authReducer,
    numbers: numbersReducer,
    voice: voiceReducer,
    sms: smsReducer,
    notifications: notificationsReducer,
  },
});
```

`src/app/hooks.js` exposes `useAppDispatch` and `useAppSelector` hooks.

#### Auth Slice (`features/auth/authSlice.js`)

- Persists token and user in `localStorage` (`voip_token`, `voip_user`).
- Exposes async thunks:
  - `login({ emailOrUsername, password })`
  - `register({ username, email, password })`
  - `fetchCurrentUser()` – `GET /api/auth/me`
- Provides selectors:
  - `selectCurrentUser`
  - `selectIsAuthenticated`
  - `selectAuthStatus`
  - `selectAuthError`
- Handles logout:
  - Clears Redux state, `localStorage`, and API auth header.

#### Numbers Slice (`features/numbers/numbersSlice.js`)

Manages phone number–related state:

- `countries` – from `GET /api/numbers/countries`
- `availableNumbers` – from `GET /api/numbers/search?countryCode=...`
- `myNumbers` – from `GET /api/numbers/mine`
- Async thunks:
  - `fetchCountries()`
  - `searchNumbers(countryCode)`
  - `fetchMyNumbers()`
  - `orderNumber({ phoneNumber, countryCode, monthlyCost })`
- `NumbersPage` uses this slice to:
  - Load country list on mount.
  - Search for numbers.
  - View and refresh owned numbers.
  - Navigate to `/order?...` for confirmation.

#### Voice Slice (`features/voice/voiceSlice.js`)

Handles call logs and new call initiation:

- State:
  - `logs`, `loadingLogs`, `calling`, `error`
- Async thunks:
  - `fetchCallLogs()` → `GET /api/voice/logs`
  - `initiateCall({ from, to })` → `POST /api/voice/call`
- `VoicePage`:
  - Displays dialpad and from-number input.
  - Shows call logs in a table.

#### SMS Slice (`features/sms/smsSlice.js`)

Manages SMS contacts and conversations:

- State:
  - `contacts`, `currentContact`, `conversation`, `loadingContacts`, `loadingConversation`, `sending`, `error`
- Async thunks:
  - `fetchContacts()` → `GET /api/sms/contacts`
  - `fetchConversation(contact)` → `GET /api/sms/conversation?contact=...`
  - `sendSms({ from, to, text })` → `POST /api/sms/send`
- Reducers:
  - `setCurrentContact(contact)`
- `SmsPage`:
  - Lists contacts.
  - Loads thread for selected contact.
  - Sends SMS and appends message to the conversation.

#### Notifications Slice (`features/notifications/notificationsSlice.js`)

Tracks notification feed:

- State:
  - `items`, `loading`, `error`
- Async thunks:
  - `fetchNotifications({ unread })` → `GET /api/notifications?unread=true|false`
  - `markNotificationRead(id)` → `PATCH /api/notifications/:id/read`
- Selectors:
  - `selectNotifications`
  - `selectUnreadCount`

`Header.jsx` shows a notification button with a badge for unread count and dropdown listing the most recent notifications.

### API Client

`src/services/apiClient.js` centralizes backend communication:

- Computes `API_BASE_URL` from:
  - `VITE_API_BASE_URL` env, or
  - `window.location.origin` (falls back to `http://localhost:5000/api`).
- Handles:
  - JSON requests/responses with error normalization.
  - Auth header (`Authorization: Bearer <token>`).
  - Token + user persistence in `localStorage`.
- Exposes specific API helpers used by slices:
  - `login`, `register`, `getMe`
  - `getCountries`, `searchNumbers`, `orderNumber`, `getMyNumbers`
  - `initiateCall`, `getCallLogs`
  - `getContacts`, `getConversation`, `sendSms`
  - `getNotifications`, `markNotificationRead`

---

## Backend Integration & Refactoring

### Core API Endpoints

The backend continues to expose:

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Numbers**
  - `GET /api/numbers/countries`
  - `GET /api/numbers/search?countryCode=US`
  - `POST /api/numbers/order`
  - `GET /api/numbers/mine`
- **Voice**
  - `POST /api/voice/call`
  - `GET /api/voice/logs`
- **SMS**
  - `POST /api/sms/send`
  - `GET /api/sms/contacts`
  - `GET /api/sms/conversation?contact=+15551234567`
- **Notifications**
  - `GET /api/notifications`
  - `GET /api/notifications?unread=true`
  - `PATCH /api/notifications/:id/read`
- **Webhooks (Telnyx)**
  - `POST /webhooks/voice`
  - `POST /webhooks/sms`

The new React + Redux frontend calls these endpoints via `apiClient.js` and thunks.

### CORS & Client Origin

`backend/server.js` now derives allowed origins from `CLIENT_ORIGIN`:

```env
# backend/.env.example
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5000
```

The list is comma-separated, and CORS middleware allows:

- Frontend dev server (Vite) at `http://localhost:5173`.
- Backend static hosting at `http://localhost:5000` (if serving built assets).

### SPA Hosting

`server.js` now supports serving the bundled React app:

```js
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const hasFrontendDist = fs.existsSync(frontendDist);

if (hasFrontendDist) {
  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
```

- When the frontend is built via `npm run build` in `frontend/`, the `dist/` output is served by the backend in production.
- Non-API routes are delegated to React Router (client-side routing).

### Error Handling & Logging

- A centralized error handler is added at `backend/src/middleware/errorHandler.js`.
- `server.js` wires it as the last middleware:

```js
// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global error handler
app.use(errorHandler);
```

- Controllers continue to perform domain-specific try/catch and log Telnyx or DB errors with `console.error`.
- Any unhandled errors in route handlers will bubble into the central error handler and return a consistent JSON `{ message }` structure.

---

## Running the Updated Stack

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MongoDB, JWT, and Telnyx values
npm install
npm run dev
```

The backend starts at `http://localhost:5000`.

### Frontend (dev mode)

```bash
cd frontend
npm install
npm run dev
```

Open the Vite dev server (default): `http://localhost:5173`

Thanks to the Vite dev proxy (`vite.config.js`), any `/api/*` calls are forwarded to the backend at `http://localhost:5000`.

### Frontend (production build + backend hosting)

```bash
cd frontend
npm install
npm run build   # produces frontend/dist

cd ../backend
npm install
NODE_ENV=production npm start
```

The backend will serve the compiled SPA from `../frontend/dist`.

- Browse to `http://localhost:5000/` for the React app.
- Client-side routing handles `/login`, `/register`, `/dashboard/*`, `/order`, etc.

---

## Summary of Key Changes

- Migrated from static HTML + vanilla JS to a **React 18 SPA** with:
  - React Router v6 for routing
  - Redux Toolkit for global state
  - Centralized API client and token handling
- Kept the original frontend as `frontend/legacy` for reference.
- Updated backend to:
  - Support SPA hosting (`frontend/dist`)
  - Use stricter, configurable CORS
  - Provide a global error handler and a consistent JSON error contract
- Added ESLint, Prettier, and TypeScript configuration to improve maintainability and future-proof the codebase.


