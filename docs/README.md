# StudyPlanner

StudyPlanner is a full-stack study planning application built with a React frontend and a Django backend API. The system allows users to register, log in, create study plans, manage tasks, generate schedules, and review weekly progress through an interactive dashboard.

## Architecture

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn-ui, React Router
- Backend: Django, SQLite, session-based authentication, JSON API endpoints
- Deployment:
  - Frontend: Vercel
  - Backend: PythonAnywhere

This structure aligns with the coursework requirement that the application may use a modern frontend framework while treating Django as an API backend.

## Core Features

- User authentication:
  - Register
  - Login
  - Logout
  - Session validation
- Study plan management:
  - Create, read, update, and delete study plans
- Task management:
  - Create, read, update, and delete tasks
  - Update task status
- Scheduling:
  - Generate initial task schedules
  - Add schedule entries
  - Auto-reschedule unfinished work
- Progress tracking:
  - Record actual effort through progress logs
  - Display dashboard and weekly summary data

## Repository Structure

```text
backend/
  manage.py
  planner/
  studyplanner/

frontend/
  src/
  package.json
```

Key files:

- Frontend app shell: [frontend/src/App.tsx](d:/Study_Planner_GroupBS/frontend/src/App.tsx)
- Frontend API layer: [frontend/src/services/api.ts](d:/Study_Planner_GroupBS/frontend/src/services/api.ts)
- Backend models: [backend/planner/models.py](d:/Study_Planner_GroupBS/backend/planner/models.py)
- Backend views: [backend/planner/views.py](d:/Study_Planner_GroupBS/backend/planner/views.py)
- Backend tests: [backend/planner/tests.py](d:/Study_Planner_GroupBS/backend/planner/tests.py)

## Local Development

### Backend

From `backend/`:

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver
```

The backend runs on `http://127.0.0.1:8000/`.

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

The frontend runs on `http://localhost:8080/` or the Vite port shown in the terminal.

## Environment Configuration

### Frontend

Create a `.env` file in `frontend/` if needed:

```env
VITE_API_BASE_URL=https://3097028z.pythonanywhere.com/api
VITE_API_TIMEOUT_MS=7000
```

For local development, the frontend will default to `http://127.0.0.1:8000/api` when running on localhost.

### Backend

Use `backend/.env.example` as the reference for deployment configuration. Important variables include:

```env
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=3097028z.pythonanywhere.com,127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=https://itech-group-bs.vercel.app,http://localhost:8080,http://127.0.0.1:8080
DJANGO_CSRF_TRUSTED_ORIGINS=https://itech-group-bs.vercel.app,https://3097028z.pythonanywhere.com
DJANGO_SESSION_COOKIE_SAMESITE=None
DJANGO_CSRF_COOKIE_SAMESITE=None
DJANGO_SESSION_COOKIE_SECURE=True
DJANGO_CSRF_COOKIE_SECURE=True
```

## Testing

### Frontend tests

From `frontend/`:

```powershell
npm test
```

Current coverage includes:

- authentication requests
- protected route behaviour
- dashboard loading
- plan creation and listing
- task retrieval, update, and deletion
- weekly schedule and summary loading

### Backend tests

From `backend/`:

```powershell
.\venv\Scripts\python.exe manage.py test
```

Current coverage includes:

- authentication and session creation
- protected endpoint access control
- plan creation and update
- task update behaviour
- dashboard API response shape
- schedule entry and progress log workflows
- user data isolation

## Deployment

### Live URLs

- Frontend: `https://itech-group-bs.vercel.app`
- Backend: `https://3097028z.pythonanywhere.com`

### Deployment checklist

1. Push the latest frontend and backend code to the Git repository.
2. Set `VITE_API_BASE_URL` in Vercel.
3. Update PythonAnywhere environment variables or WSGI config.
4. Reload the PythonAnywhere web app.
5. Verify:
   - `https://3097028z.pythonanywhere.com/api/health/`
   - login/register from the frontend
   - authenticated access to dashboard, plans, and task pages

## Accessibility And Sustainability Evidence

Submission-ready draft sections are provided in:

- [docs/coursework-report-sections.md](d:/Study_Planner_GroupBS/docs/coursework-report-sections.md)

These sections are designed to support the coursework discussion of accessibility and sustainability/performance.
