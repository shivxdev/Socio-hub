/**
 * Page 4 — Departments & Groups
 * Functional organizational coordination, capacity tracking, detail tabs (Overview, Tasks, People, Resources),
 * and cross-department referral workflow.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Department } from '../../types/admin';
import { Task } from '../../types/shared';
import { LoadingState } from '../../components/admin/LoadingState';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import {
  Building2,
  Users,
  CheckSquare,
  AlertTriangle,
  ArrowRightLeft,
  Package,
  Layers,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { MOCK_VOLUNTEERS, MOCK_RESOURCES } from '../../mocks/adminData';

export const Departments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected department for deep detail view
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(searchParams.get('dept') || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'people' | 'resources' | 'referrals'>('overview');

  // Referral action dialog
  const [referralDialog, setReferralDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    referralId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsRes, tasksRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getTasks(),
      ]);
      setDepartments(deptsRes.data);
      setTasks(tasksRes.data);
      if (!selectedDeptId && deptsRes.data.length > 0) {
        setSelectedDeptId(deptsRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  if (loading) return <LoadingState message="Loading department workloads..." />;
  if (!selectedDept) return null;

  const deptTasks = tasks.filter((t) => t.accountable_department === selectedDept.name);
  const deptVolunteers = MOCK_VOLUNTEERS.filter((v) => v.department_name === selectedDept.name || v.department_id === selectedDept.id);
  const deptResources = MOCK_RESOURCES.filter((r) => r.department_name === selectedDept.name || r.department_id === selectedDept.id);

  const capacityPct = Math.round((selectedDept.current_workload / selectedDept.declared_capacity) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Departments & Groups Coordination
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Workload balancing, capacity declaration, cross-department handoffs, and resource allocation.
          </p>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDept.id;
          const pct = Math.round((dept.current_workload / dept.declared_capacity) * 100);

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className="socio-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                borderWidth: isSelected ? '2px' : '1px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>{dept.name}</span>
                  {dept.is_overloaded ? (
                    <span className="badge badge-high" style={{ fontSize: '10.5px' }}>Overloaded</span>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Normal</span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  Lead: <strong style={{ color: '#0f172a' }}>{dept.lead_name}</strong> • Members: {dept.member_count}
                </div>

                {/* Capacity Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Capacity Utilization</span>
                    <span style={{ fontWeight: 700, color: pct > 90 ? '#ef4444' : '#0284c7' }}>
                      {dept.current_workload} / {dept.declared_capacity} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: '100%',
                        backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
                <span>{dept.open_tasks_count} Open Tasks</span>
                <span>{dept.active_volunteers} Active Volunteers</span>
                {dept.pending_referrals_count > 0 && (
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                    {dept.pending_referrals_count} Referrals
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Department Detail Workspace */}
      <div className="socio-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Building2 size={20} className="text-sky-600" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{selectedDept.name}</h3>
              {selectedDept.is_overloaded ? (
                <span className="badge badge-high" style={{ fontSize: '11px' }}>Capacity Overloaded</span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '11px' }}>Capacity Normal</span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>
              Lead: {selectedDept.lead_name} ({selectedDept.lead_email}) • Area: {selectedDept.service_area}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate('/admin/tasks')}
              className="btn btn-secondary btn-sm"
            >
              <CheckSquare size={14} /> Assign Task
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
          {[
            { id: 'overview', label: 'Overview & Capacity' },
            { id: 'tasks', label: `Assigned Tasks (${deptTasks.length})` },
            { id: 'people', label: `Team & Volunteers (${deptVolunteers.length})` },
            { id: 'resources', label: `Department Resources (${deptResources.length})` },
            { id: 'referrals', label: `Cross-Dept Referrals (${selectedDept.pending_referrals_count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 12px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#0284c7' : '#64748b',
                backgroundColor: activeTab === tab.id ? '#e0f2fe' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Declared Capacity</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {selectedDept.declared_capacity} concurrent tasks
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Configured maximum work capacity before triggering auto-routing referrals.
              </p>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Current Utilization</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: capacityPct > 90 ? '#ef4444' : '#0284c7', marginTop: '2px' }}>
                {capacityPct}% Load
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {selectedDept.current_workload} active or in-progress tasks currently handled.
              </p>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Overdue Work</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: selectedDept.overdue_count > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                {selectedDept.overdue_count} tasks
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Tasks exceeding deadline that require administrative escalation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No active tasks currently assigned to this department.
                    </td>
                  </tr>
                ) : (
                  deptTasks.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>#{t.id}</td>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td>{t.assigned_user?.display_name || 'Unassigned'}</td>
                      <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'None'}</td>
                      <td>
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'people' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {deptVolunteers.map((v) => (
              <div key={v.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.display_name}</div>
                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>{v.qualification_level} Level</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Skills: {v.skills.join(', ')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Workload: {v.active_tasks.length} active tasks • {v.preferred_service_area}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource Item</th>
                  <th>Category</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Safety Min</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptResources.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.category.replace(/_/g, ' ')}</td>
                    <td>{r.on_hand} {r.unit}</td>
                    <td>{r.reserved} {r.unit}</td>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{r.available} {r.unit}</td>
                    <td>{r.minimum_threshold} {r.unit}</td>
                    <td>
                      <span className={`badge ${r.status === 'in_stock' ? 'badge-success' : 'badge-high'}`} style={{ fontSize: '10.5px' }}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#92400e', fontSize: '13.5px' }}>
                  Incoming Referral: Village A Water Contamination Surveillance
                </span>
                <PriorityBadge priority="high" size="sm" />
              </div>
              <p style={{ fontSize: '12.5px', color: '#78350f', marginBottom: '10px' }}>
                From: Field Operations → To: {selectedDept.name}. Requesting emergency water quality test kits and disease symptom surveillance following handpump valve severance.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() =>
                    setReferralDialog({
                      isOpen: true,
                      title: 'Accept Referral',
                      message: `Accept cross-department referral from Field Operations into ${selectedDept.name}.`,
                    })
                  }
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 size={13} /> Accept Referral
                </button>
                <button
                  onClick={() =>
                    setReferralDialog({
                      isOpen: true,
                      title: 'Decline Referral',
                      message: `Decline referral due to capacity constraints. Department lead must state mandatory operational justification.`,
                    })
                  }
                  className="btn btn-secondary btn-sm"
                >
                  <XCircle size={13} /> Decline with Reason
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={referralDialog.isOpen}
        title={referralDialog.title}
        message={referralDialog.message}
        onConfirm={() => setReferralDialog({ ...referralDialog, isOpen: false })}
        onCancel={() => setReferralDialog({ ...referralDialog, isOpen: false })}
      />
    </div>
  );
};
