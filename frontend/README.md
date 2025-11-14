# VOIP Dashboard Frontend

Simple HTML + Tailwind CSS + Bootstrap frontend that talks to the Node/Express backend.

## Pages

- `index.html` – Landing page
- `login.html` – Login
- `register.html` – Registration
- `dashboard.html` – Admin dashboard (phone numbers, voice, SMS)
- `order.html` – Phone number order confirmation

The backend serves this folder as static files by default.

To develop locally, start the backend:

```bash
cd backend
npm install
npm run dev
```

Then open:

- `http://localhost:3000/` for the landing page
- `http://localhost:3000/login.html` etc.
