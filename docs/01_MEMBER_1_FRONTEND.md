# Member 1 — Frontend & User Experience (Antigravity Work Notes)

## Goal
Build the React + Vite + TypeScript user interface for the NGO Community Solution. Work independently with mock API responses until the FastAPI endpoints are available. Follow `00_READ_FIRST_AND_SHARED_CONTRACT.md` exactly.

## Ownership
You own `frontend/`. Do not edit backend route logic, SQLAlchemy models, assignment logic, or the Gemma service. If an endpoint or field seems missing, ask the team; do not invent a different contract.

## Required user journeys
### 1. Community
- Sign in through Firebase Authentication.
- Open a problem-reporting form.
- Enter a description and optional location.
- Optionally attach an image only if the team has implemented supported image upload/input.
- Call `POST /api/v1/ai/analyze` to preview AI suggestions.
- Allow the user/admin workflow to review suggestions; never present AI priority as an unquestionable decision.
- Submit an approved task using `POST /api/v1/tasks`.
- Show the user's own requests and current status.
- After a task reaches `verified`, allow eligible community user to submit feedback using `POST /api/v1/tasks/{task_id}/feedback`.

### 2. Admin
- Dashboard with totals and statuses.
- List/search/filter tasks where supported by backend.
- Open task detail, review description and AI suggestions.
- Create/adjust task fields using agreed endpoints.
- Trigger assignment with `POST /api/v1/tasks/{task_id}/assign`.
- Review completion note/evidence.
- Verify outcome with `POST /api/v1/tasks/{task_id}/verify`.
- Cancel task only through `POST /api/v1/tasks/{task_id}/cancel`.
- Show analytics from `GET /api/v1/analytics/summary`.

### 3. Volunteer
- View tasks assigned to the authenticated volunteer.
- Accept via `POST /api/v1/tasks/{task_id}/accept`.
- Reject via `POST /api/v1/tasks/{task_id}/reject`, with a reason if the backend schema requires it.
- Start via `POST /api/v1/tasks/{task_id}/start`.
- Submit completion note and evidence via `POST /api/v1/tasks/{task_id}/completion`.
- See clear status and deadline information.

## Recommended pages/components
- `LoginPage`
- `CommunityDashboard`
- `ReportProblemPage`
- `TaskListPage`
- `TaskDetailPage`
- `AdminDashboard`
- `AdminTaskReviewPage`
- `VolunteerDashboard`
- `FeedbackForm`
- shared `StatusBadge`, `PriorityBadge`, `TaskCard`, `LoadingState`, `ErrorMessage`, `EmptyState`, `ConfirmDialog`

Keep the UI simple, responsive, accessible, and usable on a phone. Use a consistent design system and avoid duplicated page-specific components.

## API client requirements
Create one central API client, for example `frontend/src/services/apiClient.ts`.
- Base URL from `VITE_API_BASE_URL`; `.env.example` may set `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
- Attach Firebase ID token as `Authorization: Bearer <token>` to protected calls.
- Parse the shared error shape:
  `{ "error": { "code": "...", "message": "...", "details": [] } }`
- Do not call Gemini directly from React. Do not put `GEMINI_API_KEY` in any `VITE_` variable.
- Define TypeScript types matching the shared contract. Use exact enum strings and field names.

## Required TypeScript types
Use names consistent with the backend contract:
- `UserRole = "community" | "admin" | "volunteer"`
- `TaskCategory = "medical" | "food" | "education" | "infrastructure" | "emergency" | "other"`
- `Priority = "high" | "medium" | "low"`
- `TaskStatus = "pending" | "assigned" | "accepted" | "active" | "completion_submitted" | "verified" | "rejected" | "cancelled"`
- `AIAnalysisResult`
- `Task`
- `UserProfile`
Do not use alternate API values such as `completed`, `in_progress`, or `done`.

## Work plan
1. Set up React + Vite + TypeScript and routing.
2. Create shared types and mock data matching the shared contract.
3. Build all role-specific pages with mock data.
4. Add form validation and loading/error/empty states.
5. Implement the centralized API client and Firebase token attachment.
6. Replace mocks endpoint-by-endpoint when backend routes are ready.
7. Add frontend tests for key forms, role-specific views, and status rendering.
8. Test responsive layout and accessibility.
9. Document how to run the frontend and which backend endpoints it expects.

## Independent testing
- Frontend can run using mock data without a live backend.
- Forms reject empty required fields and invalid values.
- Status/priority labels map correctly to the exact shared enum values.
- Failed API calls show a useful message and allow retry.
- No secret API keys are bundled into frontend code.

## Antigravity prompt
Read `00_READ_FIRST_AND_SHARED_CONTRACT.md` first. You are Member 1, responsible only for the React + Vite + TypeScript frontend in `frontend/`. Build the community reporting, admin task management, volunteer task dashboard, task detail, feedback, and analytics UI. Use the exact API URLs, JSON field names, enum values, status values, and TypeScript types from the shared contract. Build against mock data first. Centralize API calls in `src/services/apiClient.ts`; use `VITE_API_BASE_URL` and attach Firebase ID tokens as Bearer tokens for protected endpoints. Never call Gemini directly from the browser or expose secrets. Do not edit backend/database/AI files. If a contract appears insufficient, document the issue and ask before changing it. Add tests and a README section for frontend setup.
