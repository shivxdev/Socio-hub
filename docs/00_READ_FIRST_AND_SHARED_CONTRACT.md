# NGO Community Solution — Shared Contract for Antigravity

## Purpose
This is the single source of truth for all four team members. Read it before prompting Antigravity to generate or modify code. Every member must follow the same names, data types, API URLs, task statuses, and function signatures. Do not independently rename or redesign these contracts.

## Project summary
Build an AI-assisted NGO coordination platform that turns community reports into managed tasks, suggests categories/priorities/skills/resources using Gemma 4 through the Gemini API, assigns eligible helpers using deterministic backend rules, tracks execution, and records admin-verified outcomes and community feedback.

## Agreed technology stack
- Frontend: React + Vite + TypeScript
- Backend: Python + FastAPI
- Database: SQLite + SQLAlchemy
- Authentication: Firebase Authentication; frontend sends Firebase ID token to backend
- AI: Gemma 4 accessed through the Gemini API
- API format: JSON over HTTP
- API base path: `/api/v1`
- Backend development port: `8000`
- Frontend development port: Vite default `5173`
- Database file: `backend/data/ngo_community.db` (ensure the folder is created by setup code)
- Use UTC ISO-8601 timestamps in API responses, e.g. `2026-10-23T10:00:00Z`. Store timestamps consistently and document any SQLite timezone handling.

## Critical integration rules
1. **Do not invent new field names, endpoint URLs, status values, enum values, or function signatures.**
2. Use the exact contracts below. If a change is genuinely necessary, propose it to the whole team first and update this file before changing code.
3. Frontend calls the backend only. It must not connect directly to SQLite or call Gemini directly.
4. Only the backend calls the AI service and assignment service.
5. AI output is a suggestion. The backend validates it and an admin reviews/approves it. AI must not directly assign volunteers, authenticate users, alter permissions, or mark tasks verified.
6. Never hardcode API keys or Firebase service credentials. Use environment variables and `.env.example`; never commit `.env`.
7. Do not silently add features outside the agreed MVP. Mark future-scope integrations separately.
8. Do not rewrite or reformat another member's files without discussing it first.
9. Use mock data or dependency injection so each module can be tested independently.
10. Keep error response shape consistent.

## User roles
Use these exact role strings:
- `community`
- `admin`
- `volunteer`

A user profile has:
- `id`: string (Firebase UID)
- `display_name`: string
- `email`: string
- `role`: one of `community`, `admin`, `volunteer`
- `skills`: array of strings; may be empty
- `service_locations`: array of strings; may be empty
- `is_available`: boolean
- `active_task_count`: integer, calculated or kept in sync by backend

Never trust a role supplied by the frontend. The backend obtains the authenticated UID from the verified Firebase ID token and loads the role from the local user profile. For development, provide a clearly labelled local mock-auth mode only if the team explicitly enables it; it must not be enabled in production.

## Shared enums
### Problem/task categories
Use lowercase strings:
- `medical`
- `food`
- `education`
- `infrastructure`
- `emergency`
- `other`

### Priority
- `high`
- `medium`
- `low`

AI can suggest a priority. Admin review and backend policy determine the final task priority. For safety-critical reports, require human review; do not let the model make emergency decisions by itself.

### Task status lifecycle
Use only:
- `pending` — task created and waiting for assignment or reassignment
- `assigned` — a helper has been selected and assignment recorded; awaiting response
- `accepted` — assigned helper accepted the task
- `active` — work has started
- `completion_submitted` — helper submitted completion evidence
- `verified` — admin verified the outcome; terminal success state
- `rejected` — assignment was rejected; transient state before returning to `pending`
- `cancelled` — admin cancelled the task with a reason

Do not use `completed`, `done`, `in_progress`, `open`, or other alternatives. UI labels may be friendlier, but API values must stay exactly as above. An overdue flag is a boolean (`is_overdue`) and does not replace status.

## Core data contracts

### Problem analysis request
`POST /api/v1/ai/analyze`
```json
{
  "description": "Our village school needs books and notebooks.",
  "image_base64": null,
  "image_mime_type": null
}
```
`description` is required string. Image fields are optional and may be null. Image support must only be enabled if the selected Gemma 4 model/API endpoint supports the chosen image input method.

### AI analysis response
```json
{
  "summary": "A school needs books and notebooks.",
  "category": "education",
  "suggested_priority": "medium",
  "skills_required": ["community coordination"],
  "resources_required": ["books", "notebooks"],
  "missing_information": []
}
```
- `summary`: string
- `category`: one of the shared categories
- `suggested_priority`: one of the shared priorities
- `skills_required`: array of strings
- `resources_required`: array of strings
- `missing_information`: array of strings

AI output is untrusted. Validate JSON shape, types, allowed enum values, maximum lengths, and empty/missing fields. Return a controlled error or safe fallback if invalid. Do not fabricate details absent from the report.

### Create task request
`POST /api/v1/tasks`
```json
{
  "title": "Provide school supplies",
  "description": "A school needs books and notebooks.",
  "category": "education",
  "priority": "medium",
  "location": "Village/specific service area",
  "skills_required": ["community coordination"],
  "resources_required": ["books", "notebooks"],
  "deadline": null
}
```
- `title`: string, required, 3–120 characters
- `description`: string, required
- `category`: shared category enum
- `priority`: shared priority enum
- `location`: string, optional or null if unknown
- `skills_required`: array of strings
- `resources_required`: array of strings
- `deadline`: ISO-8601 datetime string or null
The backend creates a task with `status = "pending"`, an ID, timestamps, and `created_by` derived from the authenticated user. Do not accept `created_by`, `assigned_to`, `status`, or admin role from an untrusted request body.

### Task response
```json
{
  "id": 101,
  "title": "Provide school supplies",
  "description": "A school needs books and notebooks.",
  "category": "education",
  "priority": "medium",
  "location": "Village/specific service area",
  "skills_required": ["community coordination"],
  "resources_required": ["books", "notebooks"],
  "status": "pending",
  "assigned_to": null,
  "deadline": null,
  "is_overdue": false,
  "created_by": "firebase-uid",
  "created_at": "2026-10-23T10:00:00Z",
  "updated_at": "2026-10-23T10:00:00Z"
}
```
- `id`: integer in API JSON (database primary key)
- `assigned_to`: string Firebase UID or null
- `created_by`: string Firebase UID
- `deadline`: datetime string or null
- `is_overdue`: boolean
- timestamps: UTC ISO-8601 strings

### Completion evidence
`POST /api/v1/tasks/{task_id}/completion`
```json
{
  "note": "Supplies delivered to the school.",
  "evidence_urls": ["https://example.invalid/evidence/receipt.jpg"]
}
```
- `note`: string
- `evidence_urls`: array of strings; may be empty if admin policy permits
- Do not assume an evidence URL is genuine just because it is submitted. Admin verifies it.
- File upload/storage can be added later; for MVP accept links or a clearly documented simple evidence method.

### Feedback
`POST /api/v1/tasks/{task_id}/feedback`
```json
{
  "rating": 5,
  "comment": "The assistance met our needs."
}
```
- `rating`: integer 1–5
- `comment`: string, optional or empty
- Feedback should be allowed only after the task is `verified` and from an authorized community user associated with the request.

### Standard error response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": []
  }
}
```
Use meaningful codes such as `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_STATUS_TRANSITION`, `AI_SERVICE_ERROR`, and `INTERNAL_ERROR`.

## Required API endpoints
All URLs begin with `/api/v1`.

### Health
- `GET /health` — public health check; returns `{"status":"ok"}`

### Current user
- `GET /users/me` — returns authenticated user's profile.

### AI
- `POST /ai/analyze` — authenticated community/admin user; accepts analysis request; returns AI analysis response.

### Tasks
- `POST /tasks` — authenticated community/admin user creates a task; default status `pending`.
- `GET /tasks` — returns tasks the caller is permitted to see. Admin may see all; volunteer sees assigned tasks; community user sees own requests. Document filters if implemented.
- `GET /tasks/{task_id}` — returns one task if caller has permission.
- `PATCH /tasks/{task_id}` — admin updates approved editable fields such as title, description, category, priority, location, deadline. Do not allow arbitrary status or assignment changes through this generic endpoint.
- `POST /tasks/{task_id}/assign` — admin-triggered or backend-controlled assignment; runs deterministic matching and records `assigned_to` and status `assigned`.
- `POST /tasks/{task_id}/accept` — assigned volunteer accepts; status becomes `accepted`.
- `POST /tasks/{task_id}/reject` — assigned volunteer rejects with a reason; status goes through `rejected` then back to `pending`, and the rejecting volunteer should be excluded from immediate retry for that task.
- `POST /tasks/{task_id}/start` — assigned volunteer starts work; status becomes `active`.
- `POST /tasks/{task_id}/completion` — assigned volunteer submits note/evidence; status becomes `completion_submitted`.
- `POST /tasks/{task_id}/verify` — admin verifies outcome; status becomes `verified`.
- `POST /tasks/{task_id}/cancel` — admin cancels with a reason; status becomes `cancelled`.
- `POST /tasks/{task_id}/feedback` — authorized community user submits feedback after verification.
- `GET /analytics/summary` — admin-only aggregate counts and metrics.

For endpoint details not specified here, follow REST conventions and document the exact request/response schema before frontend integration. Do not invent incompatible variations.

## Shared Python function names
Use these names unless the team approves a change:
- `analyze_community_problem(description: str, image_base64: str | None = None, image_mime_type: str | None = None) -> AIAnalysisResult`
- `select_best_candidate(task: Task, candidates: list[UserProfile], excluded_user_ids: set[str] | None = None) -> AssignmentResult | None`
- `create_task(task_data: TaskCreate, created_by: str) -> Task`
- `get_task_by_id(task_id: int) -> Task | None`
- `transition_task_status(task: Task, new_status: TaskStatus, actor: UserProfile) -> Task`
- `verify_firebase_token(id_token: str) -> VerifiedIdentity`
- `get_current_user_profile(uid: str) -> UserProfile | None`

These may be methods or functions, but keep their names, input meaning, and return meaning consistent. Define shared types/schemas in the backend and import them rather than duplicating definitions.

## Assignment rules
1. Reject ineligible candidates: wrong role, unavailable, or not permitted/qualified for the task.
2. Prefer candidates matching both location and required skills.
3. If none, consider candidates matching skills.
4. Then consider location matches, but never bypass required qualifications or safety restrictions.
5. Category-based fallback is last and must not assign high-risk work to unqualified helpers.
6. Consider workload; the project notes mention a proposed maximum of two active tasks per helper. Implement as configuration `MAX_ACTIVE_TASKS = 2`, unless the team explicitly changes it.
7. Store an assignment reason for auditability, e.g. `location_and_skills_match`.
8. Do not repeatedly assign the same task to a helper who just rejected it.
9. If no eligible helper exists, leave the task `pending` and return a clear response.

## Security and reliability
- Backend verifies Firebase ID tokens. Frontend must send `Authorization: Bearer <firebase_id_token>`.
- Enforce role and task ownership checks on every protected endpoint.
- Never expose API keys or service-account private keys to frontend code.
- Never trust `role`, `created_by`, `assigned_to`, or verification claims supplied by a client.
- AI output cannot override backend validation or admin review.
- Do not store sensitive personal information that is not required.
- Validate evidence URLs and escape user-generated content when displaying it.
- Add timeouts and useful error messages for Gemini API failures.
- Provide `.env.example` with variable names but no real secrets.

## Definition of done for integration
The team can demonstrate this end-to-end flow:
1. Community user submits a problem.
2. AI suggests structured analysis.
3. Admin reviews and creates/approves a task.
4. Assignment engine chooses an eligible volunteer or leaves it pending.
5. Volunteer accepts, starts, and submits completion evidence.
6. Admin verifies the outcome.
7. Community user submits feedback.
8. Admin analytics show task totals/statuses and resolution information.

## Required instruction to every Antigravity agent
“Read `00_READ_FIRST_AND_SHARED_CONTRACT.md` first. Treat it as the source of truth. Do not rename or change shared endpoint URLs, JSON fields, enum values, data types, status values, or function names. Work only on your assigned module. Before editing a shared file or changing a contract, explain the proposed change and wait for team approval. Add tests and document assumptions. Do not claim an integration is working unless you have run and reported the relevant test.”
