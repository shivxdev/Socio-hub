# Member 3 — Database, Authentication & Smart Assignment (Antigravity Work Notes)

## Goal
Implement persistent data models, Firebase token verification integration, user-role resolution, and deterministic volunteer/helper matching. Follow `00_READ_FIRST_AND_SHARED_CONTRACT.md` exactly.

## Ownership
You own the database models/connection/initialization, user profile persistence, auth verification helper, and assignment logic. Coordinate interfaces with Member 2, who owns API route orchestration. Do not independently rename schemas or statuses.

## Database setup
- Use SQLite at `backend/data/ngo_community.db`.
- Use SQLAlchemy models and a session/dependency pattern suitable for FastAPI.
- Create the data directory automatically.
- Provide initialization/migration guidance. Do not silently drop the database at app startup.
- Store UTC timestamps consistently.
- Use integer primary keys for tasks and string Firebase UIDs for users.
- Avoid storing secrets in the database or source code.

## Required entities
### UserProfile
- `id`: string Firebase UID, primary key
- `display_name`: string
- `email`: string
- `role`: `community` | `admin` | `volunteer`
- `skills`: list of strings (choose JSON column or normalized related table and document it)
- `service_locations`: list of strings
- `is_available`: boolean
- `active_task_count`: integer or calculated count
- timestamps as appropriate

### Task
Use the shared task response fields:
- `id`: integer primary key
- `title`: string
- `description`: string
- `category`: shared category enum
- `priority`: shared priority enum
- `location`: nullable string
- `skills_required`: list of strings
- `resources_required`: list of strings
- `status`: shared TaskStatus enum
- `assigned_to`: nullable Firebase UID
- `deadline`: nullable datetime
- `is_overdue`: boolean, preferably computed from deadline and current status/time
- `created_by`: Firebase UID
- `created_at`, `updated_at`: timestamps
- Include internal assignment reason/history as needed, but do not change the public contract without approval.

### Completion evidence
Store:
- task ID
- submitting volunteer UID
- note
- evidence URLs or documented evidence references
- submission timestamp
Only authorized assigned volunteer can submit evidence for the task at the appropriate state.

### Feedback
Store:
- task ID
- submitting community user UID
- rating integer 1–5
- optional comment
- created timestamp
Ensure the task is verified and the user is authorized to submit feedback.

### Assignment/rejection history
Track assignments and rejection history sufficiently to avoid immediate reassignment to the same rejecting volunteer and support auditability. Keep implementation proportionate to MVP.

## Authentication integration
- Firebase Authentication is used by the frontend to sign in.
- Frontend sends `Authorization: Bearer <firebase_id_token>`.
- Implement `verify_firebase_token(id_token: str) -> VerifiedIdentity` using the supported Firebase Admin SDK setup.
- Implement `get_current_user_profile(uid: str) -> UserProfile | None`.
- Keep service-account credentials out of source control; document required environment variables and secure local setup.
- The backend must get UID from the verified token, then load role from local profile.
- Never trust a `role`, `created_by`, or `assigned_to` value supplied by the frontend.
- If a safe development mock-auth path is needed, make it explicitly opt-in and impossible to enable accidentally in production.

## Smart assignment logic
Implement:
`select_best_candidate(task: Task, candidates: list[UserProfile], excluded_user_ids: set[str] | None = None) -> AssignmentResult | None`

Selection policy:
1. Filter out users who are not volunteers, are unavailable, exceed configured workload, or fail required qualification/safety rules.
2. Prefer candidates matching both location and skills.
3. If none, consider skill matches.
4. Then consider location matches, but never bypass necessary qualifications or safety requirements.
5. Category-relevant fallback is last and must not assign high-risk work to unqualified helpers.
6. Enforce `MAX_ACTIVE_TASKS = 2` as a configurable limit unless the team explicitly approves a change.
7. Exclude `excluded_user_ids`, especially a volunteer who just rejected this task.
8. Return a candidate plus a clear assignment reason; if no eligible candidate exists, return `None`.
9. Do not have this module call Gemini. Assignment must be deterministic, explainable backend logic.

Document how location matching works for MVP (for example, normalized service-location strings) and how skill matching is performed (for example, case-insensitive exact/normalized terms). Avoid claiming geospatial matching unless actually implemented.

## Required function contracts
- `select_best_candidate(task: Task, candidates: list[UserProfile], excluded_user_ids: set[str] | None = None) -> AssignmentResult | None`
- `verify_firebase_token(id_token: str) -> VerifiedIdentity`
- `get_current_user_profile(uid: str) -> UserProfile | None`
- `create_task(task_data: TaskCreate, created_by: str) -> Task`
- `get_task_by_id(task_id: int) -> Task | None`
- `transition_task_status(task: Task, new_status: TaskStatus, actor: UserProfile) -> Task`

Agree exact shared types and import paths with Member 2. If an import cycle appears, propose a shared schemas module rather than changing function signatures.

## Work plan
1. Define shared enums/types with Member 2.
2. Configure SQLAlchemy engine, session, and database initialization.
3. Implement user and task models.
4. Implement completion evidence, feedback, and assignment/rejection history storage.
5. Implement Firebase token verification and profile lookup.
6. Implement task persistence helpers.
7. Implement deterministic assignment matching and assignment reason.
8. Write unit tests for matching levels, workload limits, rejection exclusion, and no-match cases.
9. Document environment setup and database reset/seed instructions (never reset automatically).
10. Provide Member 2 with exact import paths and usage examples.

## Independent testing
- Database initializes without deleting existing data.
- Create/read task tests pass.
- Enum values match the shared contract exactly.
- Invalid role or missing profile is handled safely.
- Firebase token verification is not bypassed in production.
- Skills/location matching behaves predictably.
- Unavailable and over-capacity helpers are excluded.
- Rejected helper is excluded from immediate retry.
- No candidate results in task staying pending.

## Antigravity prompt
Read `00_READ_FIRST_AND_SHARED_CONTRACT.md` first. You are Member 3, responsible for SQLAlchemy/SQLite persistence, user profiles, Firebase token verification and profile lookup, completion evidence/feedback persistence, assignment history, and deterministic smart assignment. Implement the exact model fields, enum values, and function signatures in the shared contract. Use `MAX_ACTIVE_TASKS = 2` as a configurable setting. Assignment must not call AI; it must follow the specified matching waterfall and enforce qualification/safety rules. Coordinate import paths with Member 2. Do not edit frontend or Gemma service. Add unit tests and document environment variables. Do not change the shared contract without team approval.
