"""
Unit tests for deterministic volunteer matching engine and assignment waterfall.
Follows 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md and 00_READ_FIRST_AND_SHARED_CONTRACT.md.
"""
from pathlib import Path
import sys
import unittest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.models.task import Task
from app.models.user import UserProfile
from app.schemas.enums import ProblemCategory, TaskPriority, TaskStatus, UserRole
from app.services.assignment import (
    MAX_ACTIVE_TASKS,
    get_matching_locations,
    get_matching_skills,
    select_best_candidate,
)


class TestVolunteerAssignment(unittest.TestCase):
    def setUp(self):
        # Candidate 1: Both location and skill match for education/books in North District
        self.vol_both = UserProfile(
            id="vol_both",
            display_name="Ben Both",
            email="ben@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["teaching", "book distribution"],
            service_locations=["North District", "Central"],
            is_available=True,
            active_task_count=0,
        )

        # Candidate 2: Skill only match (teaching), located elsewhere
        self.vol_skill_only = UserProfile(
            id="vol_skill",
            display_name="Sara Skill",
            email="sara@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["teaching", "tutoring"],
            service_locations=["South District"],
            is_available=True,
            active_task_count=0,
        )

        # Candidate 3: Location only match (North District), different skills
        self.vol_loc_only = UserProfile(
            id="vol_loc",
            display_name="Leo Loc",
            email="leo@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["driving", "carpentry"],
            service_locations=["North District"],
            is_available=True,
            active_task_count=0,
        )

        # Candidate 4: Available volunteer, no specific skill or location match
        self.vol_generic = UserProfile(
            id="vol_gen",
            display_name="Gina Generic",
            email="gina@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["general assistance"],
            service_locations=["West District"],
            is_available=True,
            active_task_count=0,
        )

        # Standard Education Task
        self.task_edu = Task(
            id=101,
            title="Distribute Books",
            description="School needs books",
            category=ProblemCategory.EDUCATION.value,
            priority=TaskPriority.MEDIUM.value,
            location="North District",
            skills_required=["teaching"],
            resources_required=["books"],
            status=TaskStatus.PENDING.value,
            created_by="user_comm_1",
        )

    # 1. Level 1 Match: Both Location and Skills
    def test_waterfall_level1_location_and_skills(self):
        candidates = [self.vol_generic, self.vol_loc_only, self.vol_skill_only, self.vol_both]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_both")
        self.assertEqual(result.match_level, "location_and_skills")
        self.assertIn("Matched both", result.reason)

    # 2. Level 2 Match: Skills-only when no candidate matches both
    def test_waterfall_level2_skills_only(self):
        candidates = [self.vol_generic, self.vol_loc_only, self.vol_skill_only]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_skill")
        self.assertEqual(result.match_level, "skills_only")

    # 3. Level 3 Match: Location-only for non-high-risk task
    def test_waterfall_level3_location_only(self):
        candidates = [self.vol_generic, self.vol_loc_only]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_loc")
        self.assertEqual(result.match_level, "location_only")

    # 4. Level 4 Match: Category fallback when neither location nor skills match
    def test_waterfall_level4_category_fallback(self):
        candidates = [self.vol_generic]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_gen")
        self.assertEqual(result.match_level, "category_fallback")

    # 5. High-Risk Safety Guard: Medical and emergency tasks CANNOT match on location alone or fallback
    def test_high_risk_safety_guard_medical(self):
        medical_task = Task(
            id=102,
            title="Urgent Clinic First Aid",
            description="Nurse or first responder needed",
            category=ProblemCategory.MEDICAL.value,
            priority=TaskPriority.HIGH.value,
            location="North District",
            skills_required=["nursing", "first aid"],
            status=TaskStatus.PENDING.value,
            created_by="user_comm_1",
        )
        # Even though vol_loc is in North District, he lacks nursing/first aid skills.
        # Fallback candidates also lack medical skills.
        candidates = [self.vol_loc_only, self.vol_generic]
        result = select_best_candidate(medical_task, candidates)
        # Must return None to prevent unqualified personnel from handling high-risk medical tasks
        self.assertIsNone(result)

        # When a qualified medical volunteer is present, they match via skills
        vol_nurse = UserProfile(
            id="vol_nurse",
            display_name="Nancy Nurse",
            email="nancy@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["first aid", "triage"],
            service_locations=["East District"],
            is_available=True,
            active_task_count=0,
        )
        result_with_nurse = select_best_candidate(medical_task, [self.vol_loc_only, vol_nurse])
        self.assertIsNotNone(result_with_nurse)
        self.assertEqual(result_with_nurse.candidate.id, "vol_nurse")
        self.assertEqual(result_with_nurse.match_level, "skills_only")

    # Regression test: High-risk task with empty skills must return None (qualifications cannot be established)
    def test_high_risk_empty_skills_never_matches(self):
        emergency_task_no_skills = Task(
            id=103,
            title="Emergency Evacuation",
            description="Immediate help needed",
            category=ProblemCategory.EMERGENCY.value,
            priority=TaskPriority.HIGH.value,
            location="North District",
            skills_required=[],  # Empty skills!
            status=TaskStatus.PENDING.value,
            created_by="user_comm_1",
        )
        candidates = [self.vol_loc_only, self.vol_both, self.vol_generic]
        result = select_best_candidate(emergency_task_no_skills, candidates)
        self.assertIsNone(result, "High-risk task without verified skills must return None")

    # 6. Workload Cap: MAX_ACTIVE_TASKS = 2
    def test_workload_cap_exclusion(self):
        # vol_both has reached max active tasks (2)
        self.vol_both.active_task_count = 2
        candidates = [self.vol_both, self.vol_skill_only]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        # Must skip vol_both due to workload limit and choose vol_skill
        self.assertEqual(result.candidate.id, "vol_skill")

    # 7. Availability Filter: Unavailable volunteers are excluded
    def test_unavailable_volunteer_exclusion(self):
        self.vol_both.is_available = False
        candidates = [self.vol_both, self.vol_skill_only]
        result = select_best_candidate(self.task_edu, candidates)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_skill")

    # 8. Rejection Exclusion: Volunteer who just rejected this task is excluded
    def test_rejection_exclusion_set(self):
        candidates = [self.vol_both, self.vol_skill_only]
        # Simulate that vol_both just rejected this task
        excluded_ids = {"vol_both"}
        result = select_best_candidate(self.task_edu, candidates, excluded_user_ids=excluded_ids)
        self.assertIsNotNone(result)
        self.assertEqual(result.candidate.id, "vol_skill")

    # 9. Ineligible Roles: Community or Admin users are never assigned tasks
    def test_role_filtering(self):
        admin_user = UserProfile(
            id="admin_1",
            display_name="Boss",
            email="admin@example.com",
            role=UserRole.ADMIN.value,
            skills=["teaching"],
            service_locations=["North District"],
            is_available=True,
            active_task_count=0,
        )
        community_user = UserProfile(
            id="comm_1",
            display_name="Resident",
            email="res@example.com",
            role=UserRole.COMMUNITY.value,
            skills=["teaching"],
            service_locations=["North District"],
            is_available=True,
            active_task_count=0,
        )
        result = select_best_candidate(self.task_edu, [admin_user, community_user])
        self.assertIsNone(result)

    # 10. No Candidates Available: Returns None cleanly
    def test_no_candidates_returns_none(self):
        result = select_best_candidate(self.task_edu, [])
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
