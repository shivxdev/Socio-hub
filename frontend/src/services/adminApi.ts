/**
 * Admin API Service
 * Handles communication with FastAPI backend endpoints (/api/v1/...)
 * with transparent, clearly labeled mock fallback when offline or endpoints are pending.
 */
import { apiRequest, ApiError } from './apiClient';
import { Task, CreateTaskRequest, UserProfile, AIAnalysisResult } from '../types/shared';
import {
  CommunityCase,
  Department,
  VolunteerManagementProfile,
  ResourceInventoryItem,
  ResourceMovementRecord,
  AuditEventRecord,
  AIOperationsBriefing,
  KPISummary,
} from '../types/admin';
import {
  MOCK_KPI_SUMMARY,
  MOCK_COMMUNITY_CASES,
  MOCK_TASKS,
  MOCK_DEPARTMENTS,
  MOCK_VOLUNTEERS,
  MOCK_RESOURCES,
  MOCK_RESOURCE_MOVEMENTS,
  MOCK_AI_BRIEFING,
  MOCK_AUDIT_LOG,
} from '../mocks/adminData';

// In-memory state for development demo mode so interactive mutations (e.g. creating tasks, approving cases, reallocating) persist during session
let inMemoryTasks: Task[] = [...MOCK_TASKS];
let inMemoryCases: CommunityCase[] = [...MOCK_COMMUNITY_CASES];
let inMemoryDepartments: Department[] = [...MOCK_DEPARTMENTS];
let inMemoryResources: ResourceInventoryItem[] = [...MOCK_RESOURCES];
let inMemoryAuditLog: AuditEventRecord[] = [...MOCK_AUDIT_LOG];

export const adminApi = {
  /**
   * Health check to detect if FastAPI backend is online
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await apiRequest<{ status: string }>('/health');
      return res.status === 'ok';
    } catch {
      return false;
    }
  },

  /**
   * Fetch current authenticated user's backend profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/me');
  },

  /**
   * Fetch KPI Summary
   */
  async getKpiSummary(): Promise<{ data: KPISummary; isMock: boolean }> {
    try {
      const data = await apiRequest<KPISummary>('/analytics/summary');
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] /analytics/summary unavailable, using isolated mock data:', err);
      return { data: MOCK_KPI_SUMMARY, isMock: true };
    }
  },

  /**
   * Fetch all tasks (Admin permitted)
   */
  async getTasks(): Promise<{ data: Task[]; isMock: boolean }> {
    try {
      const data = await apiRequest<Task[]>('/tasks');
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] /tasks unavailable, using isolated mock data:', err);
      return { data: inMemoryTasks, isMock: true };
    }
  },

  /**
   * Fetch single task details
   */
  async getTaskById(taskId: number): Promise<{ data: Task; isMock: boolean }> {
    try {
      const data = await apiRequest<Task>(`/tasks/${taskId}`);
      return { data, isMock: false };
    } catch (err) {
      const found = inMemoryTasks.find((t) => t.id === taskId);
      if (!found) throw new ApiError('NOT_FOUND', `Task #${taskId} not found`, 404);
      return { data: found, isMock: true };
    }
  },

  /**
   * Create a new task (POST /api/v1/tasks)
   */
  async createTask(payload: CreateTaskRequest): Promise<{ data: Task; isMock: boolean }> {
    try {
      const data = await apiRequest<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] POST /tasks backend failed, creating in mock store:', err);
      const newTask: Task = {
        id: Math.max(...inMemoryTasks.map((t) => t.id), 100) + 1,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        location: payload.location,
        skills_required: payload.skills_required,
        resources_required: payload.resources_required,
        status: 'pending',
        assigned_to: null,
        deadline: payload.deadline,
        is_overdue: false,
        created_by: 'usr_admin_001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryTasks = [newTask, ...inMemoryTasks];
      return { data: newTask, isMock: true };
    }
  },

  /**
   * Assign a volunteer to a task (POST /api/v1/tasks/{id}/assign)
   */
  async assignTask(taskId: number, volunteerId?: string): Promise<{ data: Task; isMock: boolean }> {
    try {
      const data = await apiRequest<Task>(`/tasks/${taskId}/assign`, {
        method: 'POST',
        body: JSON.stringify(volunteerId ? { volunteer_id: volunteerId } : {}),
      });
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] POST /tasks/assign failed, updating mock store:', err);
      const index = inMemoryTasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new ApiError('NOT_FOUND', 'Task not found', 404);
      
      const volunteer = MOCK_VOLUNTEERS.find((v) => v.id === volunteerId) || MOCK_VOLUNTEERS[0];
      const updated: Task = {
        ...inMemoryTasks[index],
        status: 'assigned',
        assigned_to: volunteer.id,
        assigned_user: volunteer,
        updated_at: new Date().toISOString(),
      };
      inMemoryTasks[index] = updated;

      // Add to audit
      inMemoryAuditLog.unshift({
        id: `aud_${Date.now()}`,
        actor: 'Aarav Singh (Admin)',
        actor_role: 'admin',
        action: 'TASK_ASSIGNMENT',
        entity_type: 'task',
        entity_id: String(taskId),
        timestamp: new Date().toISOString(),
        before_value: 'status: pending',
        after_value: `assigned_to: ${volunteer.display_name}`,
        reason: 'Admin manually confirmed assignment',
        related_task_id: taskId,
      });

      return { data: updated, isMock: true };
    }
  },

  /**
   * Verify completion of a task (POST /api/v1/tasks/{id}/verify)
   */
  async verifyTask(taskId: number, reason: string): Promise<{ data: Task; isMock: boolean }> {
    try {
      const data = await apiRequest<Task>(`/tasks/${taskId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] POST /tasks/verify failed, updating mock store:', err);
      const index = inMemoryTasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new ApiError('NOT_FOUND', 'Task not found', 404);

      const updated: Task = {
        ...inMemoryTasks[index],
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'Aarav Singh (Admin)',
        updated_at: new Date().toISOString(),
      };
      inMemoryTasks[index] = updated;

      inMemoryAuditLog.unshift({
        id: `aud_${Date.now()}`,
        actor: 'Aarav Singh (Admin)',
        actor_role: 'admin',
        action: 'TASK_VERIFICATION',
        entity_type: 'task',
        entity_id: String(taskId),
        timestamp: new Date().toISOString(),
        before_value: 'status: completion_submitted',
        after_value: 'status: verified',
        reason,
        related_task_id: taskId,
      });

      return { data: updated, isMock: true };
    }
  },

  /**
   * Cancel task with mandatory reason (POST /api/v1/tasks/{id}/cancel)
   */
  async cancelTask(taskId: number, reason: string): Promise<{ data: Task; isMock: boolean }> {
    try {
      const data = await apiRequest<Task>(`/tasks/${taskId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return { data, isMock: false };
    } catch (err) {
      console.warn('[adminApi] POST /tasks/cancel failed, updating mock store:', err);
      const index = inMemoryTasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new ApiError('NOT_FOUND', 'Task not found', 404);

      const updated: Task = {
        ...inMemoryTasks[index],
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };
      inMemoryTasks[index] = updated;

      inMemoryAuditLog.unshift({
        id: `aud_${Date.now()}`,
        actor: 'Aarav Singh (Admin)',
        actor_role: 'admin',
        action: 'TASK_CANCELLATION',
        entity_type: 'task',
        entity_id: String(taskId),
        timestamp: new Date().toISOString(),
        before_value: `status: ${inMemoryTasks[index].status}`,
        after_value: 'status: cancelled',
        reason,
        related_task_id: taskId,
      });

      return { data: updated, isMock: true };
    }
  },

  /**
   * Analyze problem via backend AI (POST /api/v1/ai/analyze)
   */
  async analyzeWithAI(description: string): Promise<AIAnalysisResult> {
    return apiRequest<AIAnalysisResult>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  },

  /**
   * Fetch Community Cases (Needs & Reports)
   */
  async getCases(): Promise<{ data: CommunityCase[]; isMock: boolean }> {
    try {
      const data = await apiRequest<CommunityCase[]>('/cases');
      return { data, isMock: false };
    } catch {
      return { data: inMemoryCases, isMock: true };
    }
  },

  /**
   * Update or Approve Case Decisions
   */
  async updateCaseStatus(
    caseId: string,
    status: CommunityCase['status'],
    reason?: string
  ): Promise<{ data: CommunityCase; isMock: boolean }> {
    try {
      const data = await apiRequest<CommunityCase>(`/cases/${caseId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      });
      return { data, isMock: false };
    } catch {
      const index = inMemoryCases.findIndex((c) => c.id === caseId);
      if (index === -1) throw new ApiError('NOT_FOUND', 'Case not found', 404);

      const updated: CommunityCase = {
        ...inMemoryCases[index],
        status,
        reviewed_by: 'Aarav Singh (Admin)',
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === 'rejected' ? reason : undefined,
      };
      inMemoryCases[index] = updated;

      inMemoryAuditLog.unshift({
        id: `aud_${Date.now()}`,
        actor: 'Aarav Singh (Admin)',
        actor_role: 'admin',
        action: `CASE_${status.toUpperCase()}`,
        entity_type: 'case',
        entity_id: caseId,
        timestamp: new Date().toISOString(),
        before_value: `status: ${inMemoryCases[index].status}`,
        after_value: `status: ${status}`,
        reason: reason || 'Admin review completed',
        related_case_id: caseId,
      });

      return { data: updated, isMock: true };
    }
  },

  /**
   * Fetch Departments
   */
  async getDepartments(): Promise<{ data: Department[]; isMock: boolean }> {
    try {
      const data = await apiRequest<Department[]>('/departments');
      return { data, isMock: false };
    } catch {
      return { data: inMemoryDepartments, isMock: true };
    }
  },

  /**
   * Fetch Volunteers Directory
   */
  async getVolunteers(): Promise<{ data: VolunteerManagementProfile[]; isMock: boolean }> {
    try {
      const data = await apiRequest<VolunteerManagementProfile[]>('/volunteers');
      return { data, isMock: false };
    } catch {
      return { data: MOCK_VOLUNTEERS, isMock: true };
    }
  },

  /**
   * Fetch Resources & Inventory
   */
  async getResources(): Promise<{ data: ResourceInventoryItem[]; isMock: boolean }> {
    try {
      const data = await apiRequest<ResourceInventoryItem[]>('/resources');
      return { data, isMock: false };
    } catch {
      return { data: inMemoryResources, isMock: true };
    }
  },

  /**
   * Reserve Stock for a Task
   */
  async reserveResource(
    resourceId: string,
    quantity: number,
    taskId?: number,
    notes?: string
  ): Promise<{ data: ResourceInventoryItem; isMock: boolean }> {
    try {
      const data = await apiRequest<ResourceInventoryItem>(`/resources/${resourceId}/reserve`, {
        method: 'POST',
        body: JSON.stringify({ quantity, task_id: taskId, notes }),
      });
      return { data, isMock: false };
    } catch {
      const index = inMemoryResources.findIndex((r) => r.id === resourceId);
      if (index === -1) throw new ApiError('NOT_FOUND', 'Resource not found', 404);

      const item = inMemoryResources[index];
      if (quantity > item.available) {
        throw new ApiError(
          'INSUFFICIENT_STOCK',
          `Cannot reserve ${quantity} ${item.unit}. Only ${item.available} currently available.`,
          400
        );
      }

      const updatedReserved = item.reserved + quantity;
      const updatedAvailable = item.on_hand - updatedReserved - item.unavailable;
      const updatedStatus =
        updatedAvailable === 0
          ? 'out_of_stock'
          : updatedAvailable < item.minimum_threshold
          ? 'low_stock'
          : 'in_stock';

      const updated: ResourceInventoryItem = {
        ...item,
        reserved: updatedReserved,
        available: updatedAvailable,
        status: updatedStatus,
        last_reconciled_at: new Date().toISOString(),
      };
      inMemoryResources[index] = updated;

      inMemoryAuditLog.unshift({
        id: `aud_${Date.now()}`,
        actor: 'Aarav Singh (Admin)',
        actor_role: 'admin',
        action: 'RESOURCE_RESERVATION',
        entity_type: 'resource',
        entity_id: resourceId,
        timestamp: new Date().toISOString(),
        before_value: `reserved: ${item.reserved}, available: ${item.available}`,
        after_value: `reserved: ${updatedReserved}, available: ${updatedAvailable}`,
        reason: notes || `Reserved ${quantity} ${item.unit} for task #${taskId || 'unlinked'}`,
        related_task_id: taskId,
      });

      return { data: updated, isMock: true };
    }
  },

  /**
   * Fetch Stock Movement History
   */
  async getResourceMovements(): Promise<{ data: ResourceMovementRecord[]; isMock: boolean }> {
    try {
      const data = await apiRequest<ResourceMovementRecord[]>('/resources/movements');
      return { data, isMock: false };
    } catch {
      return { data: MOCK_RESOURCE_MOVEMENTS, isMock: true };
    }
  },

  /**
   * Fetch AI Operations Briefing
   */
  async getAIBriefing(): Promise<{ data: AIOperationsBriefing; isMock: boolean }> {
    try {
      const data = await apiRequest<AIOperationsBriefing>('/reports/operations');
      return { data, isMock: false };
    } catch {
      return { data: MOCK_AI_BRIEFING, isMock: true };
    }
  },

  /**
   * Fetch Audit Log
   */
  async getAuditLog(): Promise<{ data: AuditEventRecord[]; isMock: boolean }> {
    try {
      const data = await apiRequest<AuditEventRecord[]>('/audit/events');
      return { data, isMock: false };
    } catch {
      return { data: inMemoryAuditLog, isMock: true };
    }
  },
};
