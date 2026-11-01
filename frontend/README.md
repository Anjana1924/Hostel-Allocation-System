# Hostel Allocation System

MERN-stack web app (MongoDB, Express, React, Node) for allocating hostel beds to students.

## Hostel layout

| Hostel | Type  | Floors | Rooms / floor | Beds / room | Total beds |
|--------|-------|--------|---------------|-------------|------------|
| A      | Girls | 4      | 28            | 4           | 448        |
| B      | Boys  | 4      | 28            | 4           | 448        |
| C      | Boys  | 4      | 28            | 4           | 448        |
| D      | Boys  | 4      | 28            | 4           | 448        |

## Run the backend

Requires MongoDB running locally, or a MongoDB Atlas connection string.

```bash
cd backend
cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
npm install
npm run dev
```

API runs on http://localhost:5000

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173