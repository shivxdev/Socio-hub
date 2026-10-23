/**
 * NGO Community Solution - Shared Types Contract
 * Conforms strictly to docs/00_READ_FIRST_AND_SHARED_CONTRACT.md
 */

export type UserRole = 'community' | 'admin' | 'volunteer';

export type TaskCategory =
  | 'medical'
  | 'food'
  | 'education'
  | 'infrastructure'
  | 'emergency'
  | 'other';

export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'active'
  | 'completion_submitted'
  | 'verified'
  | 'rejected'
  | 'cancelled';

export interface UserProfile {
  id: string; // Firebase UID
  display_name: string;
  email: string;
  role: UserRole;
  skills: string[];
  service_locations: string[];
  is_available: boolean;
  active_task_count: number;
  phone?: string;
  department?: string;
  avatar_url?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  location: string | null;
  skills_required: string[];
  resources_required: string[];
  status: TaskStatus;
  assigned_to: string | null;
  assigned_user?: UserProfile | null;
  deadline: string | null; // ISO-8601 UTC
  is_overdue: boolean;
  created_by: string; // Firebase UID
  created_at: string; // ISO-8601 UTC
  updated_at: string; // ISO-8601 UTC
  case_id?: string;
  accountable_department?: string;
  supporting_departments?: string[];
  blocker_reason?: string | null;
  completion_note?: string | null;
  completion_evidence_urls?: string[];
  completion_submitted_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
}

export interface AIAnalysisRequest {
  description: string;
  image_base64?: string | null;
  image_mime_type?: string | null;
}

export interface AIAnalysisResult {
  summary: string;
  category: TaskCategory;
  suggested_priority: Priority;
  skills_required: string[];
  resources_required: string[];
  missing_information: string[];
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  location: string | null;
  skills_required: string[];
  resources_required: string[];
  deadline: string | null;
}

export interface CompletionSubmission {
  note: string;
  evidence_urls: string[];
}

export interface TaskFeedback {
  rating: number; // 1-5
  comment?: string;
}

export interface APIErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}
