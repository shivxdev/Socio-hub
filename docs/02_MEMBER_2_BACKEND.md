# Member 2 — FastAPI Backend & Integration (Antigravity Work Notes)

## Goal
Build the FastAPI application that coordinates the frontend, authentication, database, AI analysis, assignment engine, and task lifecycle. You are the integration coordinator, but each member still owns their module. Follow `00_READ_FIRST_AND_SHARED_CONTRACT.md` exactly.

## Ownership
You own backend entrypoint, API routes, request/response schemas, validation, task lifecycle orchestration, error handling, and integration. Coordinate with Member 3 for auth/database/assignment interfaces and Member 4 for AI function signature. Avoid implementing a second version of their logic inside route handlers.

## Required API routes
Implement the exact routes and methods in the shared contract under `/api/v1`:
- `GET /health`
- `GET /users/me`
- `POST /ai/analyze`
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/{task_id}`
- `PATCH /tasks/{task_id}`
- `POST /tasks/{task_id}/assign`
- `POST /tasks/{task_id}/accept`
- `POST /tasks/{task_id}/reject`
- `POST /tasks/{task_id}/start`
- `POST /tasks/{task_id}/completion`
- `POST /tasks/{task_id}/verify`
- `POST /tasks/{task_id}/cancel`
- `POST /tasks/{task_id}/feedback`
- `GET /analytics/summary`

Use FastAPI/Pydantic request and response models. Keep the API schemas in a predictable shared location, e.g. `backend/app/schemas/`. Import shared models rather than copying and subtly changing definitions.

## Backend responsibilities
1. Configure FastAPI, CORS for the local Vite origin, and `/api/v1` router.
2. Validate incoming request payloads and return consistent errors.
3. Resolve current user from verified Firebase token and local profile; never trust a role sent by the browser.
4. Call Member 4's `analyze_community_problem(...)` function for AI analysis.
5. Save tasks through Member 3's database service.
6. Call Member 3's `select_best_candidate(...)` for assignment.
7. Enforce valid task-state transitions and role/ownership permissions.
8. Keep task timestamps and overdue status consistent.
9. Provide analytics summary from actual records, not hardcoded sample totals.
10. Generate OpenAPI docs and document all request/response shapes.

## Task lifecycle rules
- New task: `pending`.
- Assignment success: `assigned`.
- Assigned volunteer accepts: `accepted`.
- Volunteer starts: `active`.
- Volunteer submits note/evidence: `completion_submitted`.
- Admin verifies: `verified`.
- Assignment rejection: briefly record `rejected`, then return task to `pending` and retry assignment excluding the rejecting volunteer.
- Admin cancellation: `cancelled` with a reason.
- Do not permit arbitrary status changes through `PATCH /tasks/{task_id}`.
- A task cannot become `verified` unless an admin verifies it after completion evidence has been submitted.
- If no eligible helper is available, keep task `pending` and return a clear response.
- Admin verification must not be inferred from AI output.

## Permission rules
- `community`: create requests and view own requests; provide feedback on eligible verified tasks associated with their request.
- `volunteer`: view tasks assigned to them; accept/reject/start/submit evidence only for tasks assigned to them and only at valid states.
- `admin`: review/manage all tasks, assign, verify, cancel, and view analytics.
- Verify Firebase ID token on protected endpoints, then fetch role from local user profile.
- Deny requests that fail role or ownership checks.
- For initial development, coordinate a clearly isolated test-auth dependency if needed; never leave insecure auth bypass enabled in production.

## Function contracts to import/use
- `analyze_community_problem(description: str, image_base64: str | None = None, image_mime_type: str | None = None) -> AIAnalysisResult`
- `select_best_candidate(task: Task, candidates: list[UserProfile], excluded_user_ids: set[str] | None = None) -> AssignmentResult | None`
- `create_task(task_data: TaskCreate, created_by: str) -> Task`
- `get_task_by_id(task_id: int) -> Task | None`
- `transition_task_status(task: Task, new_status: TaskStatus, actor: UserProfile) -> Task`
- `verify_firebase_token(id_token: str) -> VerifiedIdentity`
- `get_current_user_profile(uid: str) -> UserProfile | None`

Coordinate exact import paths with Member 3 and Member 4. Do not create duplicate function definitions with incompatible signatures.

## Work plan
1. Create FastAPI app and health route.
2. Define/import shared Pydantic schemas and enums.
3. Configure Firebase auth dependency and role-based authorization.
4. Implement task CRUD endpoints using mocked database service first.
5. Implement task-state transitions and permission checks.
6. Integrate database, AI, and assignment modules.
7. Add consistent exception handlers and validation errors.
8. Implement analytics based on database queries.
9. Add automated API tests for success and failure cases.
10. Document setup, environment variables, API routes, and integration assumptions.

## Independent testing
- App starts and `/health` returns `{"status":"ok"}`.
- OpenAPI schema displays the agreed fields and enum values.
- Invalid payloads are rejected with the standard error format.
- Unauthorized and forbidden operations are rejected.
- Illegal task transitions are rejected.
- AI and assignment modules can be mocked in tests.
- No task is marked verified without evidence submission and admin action.

## Antigravity prompt
Read `00_READ_FIRST_AND_SHARED_CONTRACT.md` first. You are Member 2, responsible for FastAPI routes, Pydantic request/response schemas, task lifecycle orchestration, authorization enforcement, error handling, analytics endpoints, and integration. Implement the exact `/api/v1` endpoints, JSON fields, enum values, task statuses, and function signatures in the shared contract. Coordinate with Member 3 for database/auth/assignment imports and Member 4 for the AI service; do not duplicate their implementations. Frontend is React + Vite and must call these endpoints. Use mocks where dependencies are not ready. Never trust client-supplied role, `created_by`, `assigned_to`, or verification state. Add tests and document any assumption. Do not change the shared contract without team approval.
