# VOIP Service Dashboard

Full-stack VOIP dashboard built with:

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

```bash
cd backend
cp .env.example .env
# Edit .env with your real values
npm install
npm run dev
```

4. Open the app in your browser:

- `http://localhost:5000/` – Landing
- `http://localhost:5000/login.html` – Login
- `http://localhost:5000/register.html` – Register
- `http://localhost:5000/dashboard.html` – Admin dashboard
