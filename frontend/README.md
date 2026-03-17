# StudyPlanner Frontend

This directory contains the React frontend for StudyPlanner.

For the full project overview, backend setup, testing instructions, deployment notes, and coursework report sections, see the root README:

- [README.md](d:/Study_Planner_GroupBS/README.md)

## Frontend Commands

From `frontend/`:

```powershell
npm install
npm run dev
npm run build
npm test
```

## Environment Variables

Create a local `.env` file if you need to override the API target:

```env
VITE_API_BASE_URL=https://3097028z.pythonanywhere.com/api
VITE_API_TIMEOUT_MS=7000
```

The API client is centralised in:

- [src/services/api.ts](d:/Study_Planner_GroupBS/frontend/src/services/api.ts)

It handles authentication, plans, tasks, schedule, dashboard, and summary requests.
