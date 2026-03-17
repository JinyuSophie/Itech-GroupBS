###**StudyPlanner – Frontend**###

StudyPlanner is a web application that helps students organise their study workload by creating study plans, managing tasks, and generating weekly schedules. The system allows users to break large academic goals into manageable tasks and monitor their progress over time.


###**Features**###

The application provides the following core functionality:

**User authentication**
	•	Register a new account
	•	Login and logout
	•	Session validation

**Study plan management**
	•	Create and manage multiple study plans
	•	Update or delete existing plans

**Task management**
	•	Add tasks to study plans
	•	Set deadlines and estimated effort
	•	Update task status

**Scheduling**
	•	Generate a weekly study schedule
	•	View planned tasks for the current week

**Dashboard**
	•	Overview of progress
	•	Today’s tasks and upcoming deadlines

**Weekly summary**
	•	Overview of productivity for the week


###**Tech Stack**###

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn-ui (component library)
- React Router (client-side routing)
- React Hook Form (form management)
- TanStack React Query (server-state caching)

**Backend (To Be Connected):**


###**Project Structure**###

src/
 ├── components/   # Reusable UI components
 ├── contexts/     # React context providers
 ├── hooks/        # Custom React hooks
 ├── lib/          # Utility functions
 ├── pages/        # Application pages
 ├── services/     # API service layer
 ├── types/        # TypeScript interfaces
 ├── test/         # Unit tests
 ├── App.tsx
 └── main.tsx      # App entry point

 The API communication is centralised in:
 src/services/api.ts
 **This file handles all requests to the backend including authentication, study plans, tasks, schedules, dashboard data, and summaries.


###**Running the Project**###

Install dependencies:
npm install

Start the development server:
npm run dev

Build the project:
npm run build

Run tests:
npm test


The app is fully responsive and mobile-first:
- **Mobile** (`<768px`): Hamburger menu opens a slide-over sidebar
- **Tablet** (`768px–1024px`): Compact sidebar visible
- **Desktop** (`>1024px`): Full sidebar navigation


###**Testing**###

The project includes automated tests using Vitest.

Tests cover key features such as:
	•	authentication
	•	protected routes
	•	study plan creation
	•	task updates and deletion
	•	dashboard loading
	•	weekly scheduling
	•	summary generation


###**Contributors**###

Group BS
University of Glasgow
	•	Jinyu Fu - Frontend
	•	Xinyu Liu - Documentations
	•	Yuxin Zhang - Backend


**Last Updated:** 4th March 2026
