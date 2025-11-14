# VOIP Dashboard Backend

Node.js + Express backend for the VOIP service dashboard with:

- MongoDB (Mongoose) for persistence
- Telnyx REST API integration for:
  - Searching and ordering phone numbers
  - Initiating voice calls
  - Sending and receiving SMS
- JWT authentication
- Simple notifications system

## Quick Start

```bash
cd backend
cp .env.example .env
# Edit .env with your Mongo URI, JWT secret and Telnyx credentials

npm install
npm run dev
```

The server will start on the port defined in `.env` (default: `5000`).

The backend also serves the static frontend from the `../frontend` folder for convenience.
