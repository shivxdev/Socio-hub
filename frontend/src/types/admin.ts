/**
 * Admin Workspace Operational Types
 * Derived from Blueprint PDF and Admin Workspace Requirements
 */
import { TaskCategory, Priority, TaskStatus, Task, UserProfile } from './shared';

export interface CommunityCase {
  id: string; // e.g. "SR-00042"
  short_title: string;
  original_description: string;
  source_type: 'paper_survey' | 'field_report' | 'community_form' | 'csv_import' | 'partner_submission';
  source_reference: string;
  received_at: string;
  submitter_name: string;
  location_name: string;
  coordinates?: [number, number];
  estimated_affected_people: number | null;
  status: 'under_admin_review' | 'verified_need' | 'clarification_requested' | 'task_created' | 'rejected';
  
  // AI Classification
  ai_category: TaskCategory;
  ai_subcategory: string;
  suggested_department: string;
  supporting_departments: string[];
  ai_summary: string;
  ai_confidence_score?: number; // 0-100 if supplied by model/evaluation
  missing_information: string[];
  related_case_ids: string[];
  
  // Priority Assessment
  calculated_priority: Priority;
  priority_score: number; // 0-100 backend score
  priority_factors: string[];
  escalation_triggered: boolean;
  
  // Recommended Actions
  recommended_actions: string[];
  action_checklist: string[];
  potential_risks: string[];
  
  // Resource requirements
  required_skills: string[];
  resource_needs: {
    item: string;
    quantity: number | null;
    unit: string;
    available_stock?: number;
    shortage?: boolean;
  }[];
  
  // Linked tasks
  linked_task_ids: number[];
  
  // Audit trail
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  priority_override_reason?: string | null;
}

export interface Department {
  id: string;
  name: string;
  lead_name: string;
  lead_email: string;
  lead_avatar?: string;
  service_area: string;
  member_count: number;
  active_volunteers: number;
  declared_capacity: number; // maximum concurrent tasks
  current_workload: number; // active + in-progress tasks
  open_tasks_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
  pending_referrals_count: number;
  resource_shortages_count: number;
  is_overloaded: boolean;
  can_accept_tasks: boolean;
  category_rules: TaskCategory[];
}

export interface DepartmentReferral {
  id: string;
  case_id?: string;
  task_id?: number;
  from_department: string;
  to_department: string;
  reason: string;
  requested_at: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'declined' | 'escalated';
  response_reason?: string;
}

export interface VolunteerManagementProfile extends UserProfile {
  qualification_level: 'Basic' | 'Intermediate' | 'Specialist' | 'Lead';
  department_id?: string;
  department_name?: string;
  availability_schedule: {
    days: string[];
    hours_per_week: number;
  };
  preferred_service_area: string;
  safeguarding_verified: boolean;
  training_completed: string[];
  active_tasks: Task[];
  completed_tasks_count: number;
  declined_assignments_count: number;
  declined_reasons: { task_id: number; reason: string; timestamp: string }[];
  distance_band?: string; // e.g. "Within 5 km"
}

export interface ResourceInventoryItem {
  id: string;
  name: string;
  category: 'medical_supplies' | 'food_ration' | 'education_kits' | 'equipment_tools' | 'vehicles' | 'water_sanitation';
  department_id: string;
  department_name: string;
  unit: string;
  on_hand: number;
  reserved: number;
  unavailable: number;
  available: number; // on_hand - reserved - unavailable
  minimum_threshold: number;
  storage_location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reorder_placed';
  last_reconciled_at: string;
  expiry_date?: string | null;
}

export interface ResourceMovementRecord {
  id: string;
  resource_id: string;
  resource_name: string;
  task_id?: number;
  movement_type: 'reservation' | 'issue_handover' | 'return_reconcile' | 'restock' | 'adjustment_loss';
  quantity: number;
  actor_name: string;
  timestamp: string;
  notes: string;
}

export interface NeedsAttentionItem {
  id: string;
  type: 'case' | 'task' | 'referral' | 'resource_shortage' | 'completion_verification';
  reference_id: string; // Case ID or Task ID
  title: string;
  priority: Priority;
  responsible_department: string;
  owner_or_assignee: string | null;
  age_or_deadline: string;
  status_label: string;
  recommended_action: string;
  urgency_rank: number;
}

export interface AIOperationsBriefing {
  generated_at: string;
  timeframe: string;
  executive_snapshot: {
    new_reports: number;
    verified_needs: number;
    critical_cases: number;
    open_tasks: number;
    overdue_tasks: number;
    tasks_closed: number;
    volunteer_capacity_pct: number;
  };
  hotspots: {
    location: string;
    unresolved_count: number;
    primary_category: TaskCategory;
  }[];
  volunteer_capacity_constraints: string[];
  inventory_shortages: string[];
  decisions_needed: {
    id: string;
    title: string;
    type: 'case_approval' | 'referral_acceptance' | 'resource_authorization' | 'verification_review';
    urgency: 'critical' | 'high' | 'medium';
    deadline: string;
  }[];
  recommended_actions: {
    rank: number;
    title: string;
    evidence: string;
    responsible_role: string;
    urgency: Priority;
    suggested_step: string;
  }[];
}

export interface AuditEventRecord {
  id: string;
  actor: string;
  actor_role: string;
  action: string;
  entity_type: 'case' | 'task' | 'resource' | 'volunteer' | 'department' | 'setting';
  entity_id: string;
  timestamp: string;
  before_value?: string | null;
  after_value?: string | null;
  reason?: string | null;
  related_case_id?: string | null;
  related_task_id?: number | null;
  trace_id?: string;
}

export interface KPISummary {
  total_community_needs: number;
  total_community_needs_trend: string;
  unresolved_needs: number;
  unresolved_needs_trend: string;
  high_priority_cases: number;
  high_priority_cases_trend: string;
  active_tasks: number;
  active_tasks_trend: string;
  available_volunteers: number;
  available_volunteers_trend: string;
  resource_shortages: number;
  resource_shortages_trend: string;
}

export interface DateRangeOption {
  label: string;
  value: '7d' | '30d' | '90d' | 'all';
}
