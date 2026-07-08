# F1 Management System

Full-stack Formula 1 race and team management application with:

- Role-based authentication (admin and user)
- Team, driver, race, standing, staff, and race history modules
- React frontend + Node.js/Express backend + MongoDB

## Project Structure

- backend: Express API, MongoDB models, auth, seed script
- frontend: React application with admin and user dashboards

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- express-validator

### Frontend

- React 18
- Vite (build tooling / dev server)
- React Router
- Axios
- Recharts (charts)
- Framer Motion (animation)

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or cloud)

## Environment Variables

Create a `.env` file inside `backend` with the following values:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development

Frontend environment variable (see `frontend/.env.example`):

In development you normally don't need to set anything — Vite proxies `/api`
to `http://localhost:5000` (configured in `frontend/vite.config.js`), so the
app and API share one origin. For production, point the frontend at your
deployed backend:

VITE_API_URL=https://YOUR-BACKEND-DOMAIN.vercel.app/api

## Installation

Install backend dependencies:

cd backend
npm install

Install frontend dependencies:

cd ../frontend
npm install

## Run the App

Open two terminals.

Terminal 1 (backend):

cd backend
npm run dev

Terminal 2 (frontend):

cd frontend
npm run dev

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Seed the Database

From `backend`:

npm run seed

This creates sample data and default users:

- Admin: admin@f1management.com / admin123
- User: user@f1management.com / user123

## Main API Routes

Base URL: /api

- /auth
- /teams
- /drivers
- /races
- /standings
- /team-staff
- /race-history
- /health

## Scripts

### Backend (`backend/package.json`)

- npm start: Start server with Node
- npm run dev: Start server with nodemon
- npm run seed: Seed sample data
- npm test: Run the Jest + supertest test suite (uses an in-memory MongoDB)

### Frontend (`frontend/package.json`)

- npm run dev: Start the Vite dev server (http://localhost:3000)
- npm run build: Build the production bundle into `frontend/dist`
- npm run preview: Preview the production build locally
- npm test: Run the Vitest + Testing Library unit tests

## Auth Notes

- JWT token is stored in localStorage as `f1_token`
- User info is stored in localStorage as `f1_user`
- Frontend auto-redirects to login on HTTP 401 responses

## Deployment

- Backend includes `vercel.json` for Vercel Node deployment
- Frontend is deployed to GitHub Pages by `.github/workflows/ci.yml` on pushes to `main`.
  Set the repo variable `VITE_API_URL` (Settings → Secrets and variables → Actions →
  Variables) to your deployed backend URL so the built frontend talks to it.
- The Express backend is a server and cannot run on GitHub Pages — host it separately.
- Ensure production environment variables are configured in your deployment provider

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

- Backend: `npm ci` + a syntax check across all source files (+ `npm test` when present)
- Frontend: `npm ci` + `npm run build` (+ `npm test` when present)
- On `main`, the frontend is then built and deployed to GitHub Pages

## License

For educational use.
