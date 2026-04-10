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

- React
- React Router
- Axios
- Recharts

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

Optional frontend environment variable (only needed if your API is not on localhost:5000):

REACT_APP_API_URL=http://localhost:5000/api

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
npm start

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

### Frontend (`frontend/package.json`)

- npm start: Run frontend in development mode
- npm run build: Build production frontend

## Auth Notes

- JWT token is stored in localStorage as `f1_token`
- User info is stored in localStorage as `f1_user`
- Frontend auto-redirects to login on HTTP 401 responses

## Deployment

- Backend includes `vercel.json` for Vercel Node deployment
- Ensure production environment variables are configured in your deployment provider

## License

For educational use.
