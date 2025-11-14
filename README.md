# New Vision of VOIP Service Dashboard - SongPad

Dashboard built with:

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** HTML + Tailwind CSS + Bootstrap
- **Telecom:** Telnyx REST APIs for numbers, voice, and SMS

## Structure

- `backend/` – API server, authentication, Telnyx integration, MongoDB models.
- `frontend/` – Static HTML/JS/CSS dashboard that calls the backend.

## Getting Started

1. Start MongoDB (e.g. `mongodb://localhost:27017`).
2. Configure Telnyx (API key, connection ID, messaging profile).
3. Configure environment:

## Backend

```bash
cd backend
cp .env.example .env
```

# Fill in MONGO_URI, JWT_SECRET, Telnyx keys, etc.

```bash
npm install
npm run dev
```

Backend runs at http://localhost:3000

## Frontend – development (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

All /api/* requests are proxied to http://localhost:3000 via vite.config.js.


## Frontend – production build served by backend

```bash
cd frontend
npm install
npm run build          # outputs to frontend/dist

cd ../backend
npm install
NODE_ENV=production npm start
```

Open http://localhost:3000/
 – the backend serves the built React SPA, and React Router handles all client-side routes.


## Documentation

I also added ARCHITECTURE.md at the project root, with:

Folder hierarchy

Redux flow

Routing design

API mappings & backend integration details

Dev vs production setup