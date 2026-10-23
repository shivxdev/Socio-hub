"""
Deterministic Smart Volunteer Assignment Engine.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md and 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md.

Deterministic rules:
1. Filter out users who are not volunteers, are unavailable, exceed workload (MAX_ACTIVE_TASKS = 2),
   are in excluded_user_ids (e.g. recently rejected), or fail critical safety/qualification checks.
2. Prefer candidates matching both location and skills (location_and_skills).
3. If none, consider candidates matching skills (skills_only).
4. Then consider location matches (location_only), enforcing safety constraints.
5. Category-relevant fallback (category_fallback) for non-high-risk tasks only.
6. Return candidate with audit reason, or None if no eligible helper is available.
"""
import os
from typing import Sequence
from app.models.task import Task
from app.models.user import UserProfile
from app.schemas.assignment import AssignmentResult
from app.schemas.enums import ProblemCategory, UserRole
from app.schemas.user import UserProfileResponse

# Configurable active task limit (default 2)
DEFAULT_MAX_ACTIVE_TASKS = 2
MAX_ACTIVE_TASKS = int(os.getenv("MAX_ACTIVE_TASKS", str(DEFAULT_MAX_ACTIVE_TASKS)))

# High-risk categories that strictly require matching skills/qualifications
HIGH_RISK_CATEGORIES = {
    ProblemCategory.MEDICAL.value,
    ProblemCategory.EMERGENCY.value,
}


def normalize_term(term: str) -> str:
    """Normalize a string term for predictable case-insensitive matching."""
    return term.strip().lower()


def get_matching_skills(candidate_skills: list[str] | None, required_skills: list[str] | None) -> list[str]:
    """Returns normalized list of matching skills between candidate and task requirements."""
    if not candidate_skills or not required_skills:
        return []
    cand_set = {normalize_term(s) for s in candidate_skills if s and s.strip()}
    matches = []
    for req in required_skills:
        req_norm = normalize_term(req)
        if not req_norm:
            continue
        # Direct match or substring match
        if any(req_norm == c or req_norm in c or c in req_norm for c in cand_set):
            matches.append(req)
    return matches


def get_matching_locations(candidate_locations: list[str] | None, task_location: str | None) -> list[str]:
    """Returns matching locations between candidate service areas and task location."""
    if not candidate_locations or not task_location:
        return []
    loc_norm = normalize_term(task_location)
    if not loc_norm:
        return []
    matches = []
    for cand_loc in candidate_locations:
        c_norm = normalize_term(cand_loc)
        if not c_norm:
            continue
        # Exact match or regional/city substring match
        if c_norm == loc_norm or c_norm in loc_norm or loc_norm in c_norm:
            matches.append(cand_loc)
    return matches


def select_best_candidate(
    task: Task,
    candidates: Sequence[UserProfile],
    excluded_user_ids: set[str] | None = None,
    max_active_tasks: int | None = None,
) -> AssignmentResult | None:
    """
    Selects the best eligible volunteer candidate based on deterministic waterfall rules.
    Signature required by shared contract:
    select_best_candidate(task: Task, candidates: list[UserProfile], excluded_user_ids: set[str] | None = None) -> AssignmentResult | None
    """
    workload_limit = max_active_tasks if max_active_tasks is not None else MAX_ACTIVE_TASKS
    excluded = excluded_user_ids or set()

    # Step 1: Filter out ineligible candidates
    eligible: list[UserProfile] = []
    for user in candidates:
        # Must have volunteer role
        if str(user.role).lower() != UserRole.VOLUNTEER.value:
            continue
        # Must be available
        if not user.is_available:
            continue
        # Must not exceed workload capacity
        if (user.active_task_count or 0) >= workload_limit:
            continue
        # Must not be in exclusion set (e.g. volunteer who rejected this task)
        if user.id in excluded:
            continue
        eligible.append(user)

    if not eligible:
        return None

    task_category = str(task.category).lower()
    is_high_risk = task_category in HIGH_RISK_CATEGORIES
    task_skills = task.skills_required or []
    task_loc = task.location or ""

    # CRITICAL SAFETY RULE: High-risk medical and emergency tasks require verified skills.
    # If required qualifications cannot be established (empty skills), return no candidate.
    if is_high_risk and not task_skills:
        return None

    # Waterfall Level 1: Location AND Skills match
    level1_candidates = []
    for user in eligible:
        matched_skills = get_matching_skills(user.skills or [], task_skills)
        matched_locs = get_matching_locations(user.service_locations or [], task_loc)
        # If task requires skills, candidate must have matched skills
        has_skills = bool(matched_skills) if task_skills else True
        has_loc = bool(matched_locs) if task_loc else True
        # For high-risk, matched_skills is strictly mandatory
        if is_high_risk and not matched_skills:
            continue
        if has_skills and has_loc and (matched_skills or matched_locs):
            level1_candidates.append((user, matched_skills, matched_locs))

    if level1_candidates:
        # Sort by: lowest active_task_count, then highest matched skills count
        level1_candidates.sort(
            key=lambda x: (x[0].active_task_count or 0, -len(x[1]), -len(x[2]))
        )
        best_user, matched_skills, matched_locs = level1_candidates[0]
        return AssignmentResult(
            candidate=UserProfileResponse.model_validate(best_user),
            match_level="location_and_skills",
            reason=f"Matched both required skills ({len(matched_skills)}) and service location '{task_loc}'.",
            matched_skills=matched_skills,
            matched_locations=matched_locs,
        )

    # Waterfall Level 2: Skills-only match
    if task_skills:
        level2_candidates = []
        for user in eligible:
            matched_skills = get_matching_skills(user.skills or [], task_skills)
            if matched_skills:
                level2_candidates.append((user, matched_skills))

        if level2_candidates:
            level2_candidates.sort(
                key=lambda x: (x[0].active_task_count or 0, -len(x[1]))
            )
            best_user, matched_skills = level2_candidates[0]
            return AssignmentResult(
                candidate=UserProfileResponse.model_validate(best_user),
                match_level="skills_only",
                reason=f"Matched required skills: {', '.join(matched_skills)}.",
                matched_skills=matched_skills,
                matched_locations=[],
            )

    # Waterfall Level 3: Location-only match
    # CRITICAL SAFETY RULE: Never assign high-risk tasks (medical, emergency) by location alone!
    if task_loc and not is_high_risk:
        level3_candidates = []
        for user in eligible:
            matched_locs = get_matching_locations(user.service_locations or [], task_loc)
            if matched_locs:
                level3_candidates.append((user, matched_locs))

        if level3_candidates:
            level3_candidates.sort(
                key=lambda x: (x[0].active_task_count or 0, -len(x[1]))
            )
            best_user, matched_locs = level3_candidates[0]
            return AssignmentResult(
                candidate=UserProfileResponse.model_validate(best_user),
                match_level="location_only",
                reason=f"Matched service location '{task_loc}' for non-high-risk task.",
                matched_skills=[],
                matched_locations=matched_locs,
            )

    # Waterfall Level 4: Category-relevant fallback (for low/medium risk only)
    # Strictly prohibited for medical or emergency tasks
    if not is_high_risk:
        # Select available volunteer with lowest workload
        sorted_eligible = sorted(eligible, key=lambda u: u.active_task_count or 0)
        best_user = sorted_eligible[0]
        return AssignmentResult(
            candidate=UserProfileResponse.model_validate(best_user),
            match_level="category_fallback",
            reason=f"Category fallback for '{task_category}' task: available volunteer with lowest workload.",
            matched_skills=[],
            matched_locations=[],
        )

    # No eligible candidate found under safety and qualification constraints
    return None
