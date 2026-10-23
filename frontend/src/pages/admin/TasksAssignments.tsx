/**
 * Page 3 — Tasks & Assignments: Full Operations Management
 * Features both Kanban Board and Table/List views across all 7 operational columns mapped to backend statuses,
 * detailed task drawer with completion evidence review, assignment controls, and verification workflow.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Task, TaskStatus } from '../../types/shared';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { LoadingState } from '../../components/admin/LoadingState';
import { EmptyState } from '../../components/admin/EmptyState';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import {
  Kanban,
  List,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  ShieldAlert,
  FileCheck,
  Building,
  User,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { MOCK_VOLUNTEERS } from '../../mocks/adminData';

// 7 display columns mapped to backend statuses
const KANBAN_COLUMNS = [
  { id: 'needs_verification', label: 'Needs Verification', match: (t: Task) => t.status === 'pending' && !t.assigned_to },
  { id: 'ready_for_assignment', label: 'Ready for Assignment', match: (t: Task) => t.status === 'pending' },
  { id: 'assigned', label: 'Assigned', match: (t: Task) => t.status === 'assigned' || t.status === 'accepted' },
  { id: 'in_progress', label: 'In Progress', match: (t: Task) => t.status === 'active' && !t.blocker_reason && !t.is_overdue },
  { id: 'blocked', label: 'Blocked / Overdue', match: (t: Task) => (t.status === 'active' && (Boolean(t.blocker_reason) || t.is_overdue)) || t.status === 'rejected' },
  { id: 'awaiting_verification', label: 'Completed — Awaiting Verification', match: (t: Task) => t.status === 'completion_submitted' },
  { id: 'verified_closed', label: 'Verified Closed', match: (t: Task) => t.status === 'verified' },
];

export const TasksAssignments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { onOpenCreateTask } = useOutletContext<{ onOpenCreateTask: () => void }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Selected task for detailed inspection and lifecycle actions
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Assign Volunteer modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'verify' | 'cancel' | 'reopen';
    taskId?: number;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: 'verify',
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTasks();
      setTasks(res.data);
      if (selectedTask) {
        const updated = res.data.find((t) => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.id).includes(searchQuery) ||
      (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleActionConfirm = async (reason?: string) => {
    if (!confirmDialog.taskId) return;

    if (confirmDialog.action === 'verify') {
      await adminApi.verifyTask(confirmDialog.taskId, reason || 'Verified delivery evidence');
    } else if (confirmDialog.action === 'cancel') {
      await adminApi.cancelTask(confirmDialog.taskId, reason || 'Cancelled by administrator');
    }

    setConfirmDialog({ ...confirmDialog, isOpen: false });
    await loadTasks();
  };

  const handleAssignVolunteer = async () => {
    if (!selectedTask || !selectedVolunteerId) return;
    await adminApi.assignTask(selectedTask.id, selectedVolunteerId);
    setShowAssignModal(false);
    setSelectedVolunteerId('');
    await loadTasks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Tasks & Volunteer Assignments
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Full lifecycle task orchestrator: Assignment → Field Execution → Evidence Submission → Admin Verification.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                color: viewMode === 'kanban' ? '#0f172a' : '#64748b',
              }}
            >
              <Kanban size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? '#0f172a' : '#64748b',
              }}
            >
              <List size={14} /> List
            </button>
          </div>

          <button onClick={onOpenCreateTask} className="btn btn-primary btn-sm">
            <Plus size={14} /> Create Task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by ID, title, or location..."
            className="input-field"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field"
          style={{ width: '140px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Categories</option>
          <option value="emergency">Emergency</option>
          <option value="medical">Medical</option>
          <option value="food">Food</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="education">Education</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="input-field"
          style={{ width: '130px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading tasks from backend..." />
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View with 7 Operational Columns */
        <div
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '16px',
            minHeight: '520px',
          }}
        >
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(col.match);
            return (
              <div
                key={col.id}
                style={{
                  width: '290px',
                  minWidth: '290px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>{col.label}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7' }}>#{t.id}</span>
                          <PriorityBadge priority={t.priority} size="sm" />
                        </div>

                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {t.title}
                        </h4>

                        {t.blocker_reason && (
                          <div style={{ padding: '4px 8px', backgroundColor: '#fef2f2', borderRadius: '4px', color: '#b91c1c', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> {t.blocker_reason}
                          </div>
                        )}

                        <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div>Dept: <strong>{t.accountable_department || 'General'}</strong></div>
                          <div>Assignee: <strong>{t.assigned_user?.display_name || 'Unassigned'}</strong></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                          <span>{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</span>
                          <StatusBadge status={t.status} size="sm" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="socio-card" style={{ padding: '0' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Title</th>
                  <th>Priority</th>
                  <th>Accountable Department</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id} onClick={() => setSelectedTask(t)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{t.location || 'Location unassigned'}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} size="sm" />
                    </td>
                    <td>{t.accountable_department || 'Field Ops'}</td>
                    <td style={{ color: t.assigned_user ? '#0f172a' : '#94a3b8' }}>
                      {t.assigned_user?.display_name || 'Unassigned'}
                    </td>
                    <td style={{ color: t.is_overdue ? '#ef4444' : '#64748b', fontWeight: t.is_overdue ? 700 : 400 }}>
                      {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Open'}
                    </td>
                    <td>
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11.5px' }}
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details Inspection & Action Drawer/Modal */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>Task #{selectedTask.id}</span>
                  <PriorityBadge priority={selectedTask.priority} size="sm" />
                  <StatusBadge status={selectedTask.status} size="sm" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{selectedTask.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Case Ref: {selectedTask.case_id || 'Direct Admin Task'} • Created: {new Date(selectedTask.created_at).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Description & Location */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Task Instructions & Scope
                </h4>
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedTask.description}
                </p>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  <strong>Target Location:</strong> {selectedTask.location || 'Not specified'}
                </div>
              </div>

              {/* Departments & Assignee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <div>
                  <div style={{ color: '#64748b' }}>Accountable Department:</div>
                  <strong style={{ color: '#0f172a' }}>{selectedTask.accountable_department || 'Field Operations'}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Assigned Volunteer:</div>
                  <strong style={{ color: selectedTask.assigned_user ? '#0284c7' : '#ef4444' }}>
                    {selectedTask.assigned_user?.display_name || 'None (Awaiting Assignment)'}
                  </strong>
                </div>
              </div>

              {/* Resources required */}
              {selectedTask.resources_required.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Required Resources & Inventory
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedTask.resources_required.map((r, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: '12px' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Evidence (Critical for Admin Verification) */}
              {selectedTask.completion_note && (
                <div style={{ backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                    <FileCheck size={16} /> Submitted Completion Evidence
                  </div>
                  <p style={{ fontSize: '13px', color: '#064e3b', marginBottom: '10px' }}>
                    "{selectedTask.completion_note}"
                  </p>

                  {selectedTask.completion_evidence_urls && selectedTask.completion_evidence_urls.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#065f46', marginBottom: '6px' }}>
                        Attached Photographs / Receipts:
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {selectedTask.completion_evidence_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt="Evidence"
                              style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #a7f3d0' }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Blocker alert */}
              {selectedTask.blocker_reason && (
                <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12.5px' }}>
                  <strong>Reported Operational Blocker:</strong> {selectedTask.blocker_reason}
                </div>
              )}

              {/* Verification Stamp */}
              {selectedTask.status === 'verified' && (
                <div style={{ backgroundColor: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #6ee7b7', color: '#047857', fontSize: '12px' }}>
                  ✓ <strong>Outcome Verified:</strong> Closed by {selectedTask.verified_by || 'Admin'} at {selectedTask.verified_at}
                </div>
              )}
            </div>

            {/* Admin Lifecycle Actions */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAssignModal(true)}
                className="btn btn-secondary btn-sm"
              >
                <UserCheck size={14} /> {selectedTask.assigned_to ? 'Reassign Volunteer' : 'Assign Volunteer'}
              </button>

              {selectedTask.status === 'completion_submitted' && (
                <button
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Verify Task Outcome',
                      message: `Are you satisfied with the completion evidence for Task #${selectedTask.id}? This will record the verified outcome and close the task.`,
                      action: 'verify',
                      taskId: selectedTask.id,
                    })
                  }
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle2 size={14} /> Verify Completion
                </button>
              )}

              {selectedTask.status !== 'cancelled' && selectedTask.status !== 'verified' && (
                <button
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Cancel Task',
                      message: `Cancel Task #${selectedTask.id}. State policy requires a recorded operational reason.`,
                      action: 'cancel',
                      taskId: selectedTask.id,
                    })
                  }
                  className="btn btn-danger btn-sm"
                >
                  <XCircle size={14} /> Cancel Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Assignment Modal */}
      {showAssignModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Assign Volunteer to Task #{selectedTask.id}</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Deterministic match based on verified skills and service area</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {MOCK_VOLUNTEERS.map((vol) => (
                <label
                  key={vol.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: selectedVolunteerId === vol.id ? '#f0f9ff' : '#ffffff',
                    border: selectedVolunteerId === vol.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="volunteerSelection"
                      checked={selectedVolunteerId === vol.id}
                      onChange={() => setSelectedVolunteerId(vol.id)}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{vol.display_name}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {vol.qualification_level} • Skills: {vol.skills.join(', ')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#0284c7' }}>
                        {vol.preferred_service_area} • Workload: {vol.active_tasks.length}/2 tasks
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Available</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button disabled={!selectedVolunteerId} onClick={handleAssignVolunteer} className="btn btn-primary btn-sm">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.action === 'cancel'}
        requireReason={confirmDialog.action === 'cancel'}
        confirmLabel={confirmDialog.action === 'cancel' ? 'Confirm Cancellation' : 'Verify'}
        onConfirm={handleActionConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};
