/**
 * Page 1 — Admin Overview Dashboard
 * Organization-wide operations command center answering all 8 strategic operational questions.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { StatCard } from '../../components/admin/StatCard';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { LoadingState } from '../../components/admin/LoadingState';
import { ErrorState } from '../../components/admin/ErrorState';
import {
  FileText,
  AlertOctagon,
  Clock,
  Users,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  KPISummary,
  Department,
  NeedsAttentionItem,
  AIOperationsBriefing,
} from '../../types/admin';
import { Task } from '../../types/shared';
import { MOCK_NEEDS_ATTENTION, MOCK_ACTIVITY_FEED, MOCK_ACTIVITY_CHART } from '../../mocks/adminData';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { onOpenCreateTask } = useOutletContext<{ onOpenCreateTask: () => void }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [briefing, setBriefing] = useState<AIOperationsBriefing | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, deptsRes, tasksRes, briefingRes] = await Promise.all([
        adminApi.getKpiSummary(),
        adminApi.getDepartments(),
        adminApi.getTasks(),
        adminApi.getAIBriefing(),
      ]);

      setKpi(kpiRes.data);
      setDepartments(deptsRes.data);
      setTasks(tasksRes.data);
      setBriefing(briefingRes.data);
      setIsMockMode(kpiRes.isMock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <LoadingState message="Connecting to NGO Operations Command Center..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />;
  if (!kpi) return null;

  const chartData = MOCK_ACTIVITY_CHART[chartPeriod];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Welcome Banner matching reference UI */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '20px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Good Morning, Aarav! 👋
            </h2>
            {isMockMode && (
              <span className="badge badge-medium" style={{ fontSize: '11px' }}>
                Offline Demo Mode
              </span>
            )}
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Here is your live operational overview across all departments, community cases, and field teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/needs-reports')} className="btn btn-secondary btn-sm">
            <FileText size={14} /> Review Reports
          </button>
          <button onClick={onOpenCreateTask} className="btn btn-primary btn-sm">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* A. Six KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Community Needs"
          value={kpi.total_community_needs}
          description="Total cases recorded across sources"
          trend={kpi.total_community_needs_trend}
          icon={Layers}
          iconColor="#0284c7"
          iconBg="#e0f2fe"
          onClick={() => navigate('/admin/needs-reports')}
        />
        <StatCard
          title="Unresolved Needs"
          value={kpi.unresolved_needs}
          description="Verified needs awaiting completion"
          trend={kpi.unresolved_needs_trend}
          icon={AlertOctagon}
          iconColor="#f59e0b"
          iconBg="#fef3c7"
          onClick={() => navigate('/admin/needs-reports?status=verified_need')}
        />
        <StatCard
          title="High-Priority Cases"
          value={kpi.high_priority_cases}
          description="In configured critical/high band"
          trend={kpi.high_priority_cases_trend}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBg="#fee2e2"
          badge="Urgent"
          onClick={() => navigate('/admin/needs-reports?priority=high')}
        />
        <StatCard
          title="Active Tasks"
          value={kpi.active_tasks}
          description="Interventions currently in progress"
          trend={kpi.active_tasks_trend}
          icon={Clock}
          iconColor="#3b82f6"
          iconBg="#dbeafe"
          onClick={() => navigate('/admin/tasks?status=active')}
        />
        <StatCard
          title="Available Volunteers"
          value={kpi.available_volunteers}
          description="Eligible & active for assignment"
          trend={kpi.available_volunteers_trend}
          icon={Users}
          iconColor="#10b981"
          iconBg="#d1fae5"
          onClick={() => navigate('/admin/volunteers?available=true')}
        />
        <StatCard
          title="Resource Shortages"
          value={kpi.resource_shortages}
          description="Items below safety threshold"
          trend={kpi.resource_shortages_trend}
          icon={Package}
          iconColor="#8b5cf6"
          iconBg="#ede9fe"
          onClick={() => navigate('/admin/resources?status=low_stock')}
        />
      </div>

      {/* Grid: Activity Chart & AI Briefing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* B. NGO Activity Chart */}
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>NGO Activity & Verification Velocity</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Comparing incoming reports, verified needs, and verified tasks</p>
            </div>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: chartPeriod === p ? '#ffffff' : 'transparent',
                    color: chartPeriod === p ? '#0284c7' : '#64748b',
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Accessible SVG Multi-Bar Activity Chart */}
          <div style={{ padding: '10px 0 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              {chartData.map((item, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Reports received */}
                    <div
                      title={`Reports: ${item.reports}`}
                      style={{
                        width: '30%',
                        maxWidth: '16px',
                        height: `${Math.min(item.reports * 4, 140)}px`,
                        backgroundColor: '#93c5fd',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    {/* Needs verified */}
                    <div
                      title={`Verified Needs: ${item.needs}`}
                      style={{
                        width: '30%',
                        maxWidth: '16px',
                        height: `${Math.min(item.needs * 4, 140)}px`,
                        backgroundColor: '#0284c7',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    {/* Tasks completed */}
                    <div
                      title={`Tasks Completed: ${item.tasks}`}
                      style={{
                        width: '30%',
                        maxWidth: '16px',
                        height: `${Math.min(item.tasks * 4, 140)}px`,
                        backgroundColor: '#10b981',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '6px' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '14px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#93c5fd', borderRadius: '2px' }} />
                Reports Ingested
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }} />
                Needs Verified
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                Tasks Closed
              </span>
            </div>
          </div>
        </div>

        {/* E. AI Operations Briefing */}
        {briefing && (
          <div className="socio-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="socio-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a' }}>AI Operations Briefing</h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Factual synthesis based on validated database records</span>
                </div>
              </div>
              <span className="badge badge-ai" style={{ fontSize: '11px' }}>Decision Support</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Snapshot metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Hotspot Areas</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{briefing.hotspots.length} Clusters</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Capacity Load</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{briefing.executive_snapshot.volunteer_capacity_pct}% Utilized</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Decisions Pending</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e11d48' }}>{briefing.decisions_needed.length} Action Items</div>
                </div>
              </div>

              {/* Ranked recommendations */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ranked Administrative Suggestions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {briefing.recommended_actions.map((rec) => (
                    <div
                      key={rec.rank}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          #{rec.rank}. {rec.title}
                        </span>
                        <PriorityBadge priority={rec.urgency} size="sm" />
                      </div>
                      <p style={{ color: '#475569', fontSize: '12px', marginBottom: '4px' }}>{rec.evidence}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0284c7', fontWeight: 600, fontSize: '11.5px' }}>
                        <span>Role: {rec.responsible_role}</span>
                        <span>{rec.suggested_step}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D. Needs Attention Queue */}
      <div className="socio-card">
        <div className="socio-card-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Needs Immediate Attention</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>
              Prioritized queue of critical unreviewed cases, overdue tasks, blockers, and resource shortages
            </p>
          </div>
          <button onClick={() => navigate('/admin/tasks')} className="btn btn-secondary btn-sm">
            View All Tasks <ArrowRight size={14} />
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / Ref</th>
                <th>Issue / Task</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Owner / Lead</th>
                <th>Age / Deadline</th>
                <th>Status</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_NEEDS_ATTENTION.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: '#0284c7' }}>{item.reference_id}</td>
                  <td style={{ fontWeight: 600, maxWidth: '280px' }}>{item.title}</td>
                  <td>
                    <PriorityBadge priority={item.priority} size="sm" />
                  </td>
                  <td>{item.responsible_department}</td>
                  <td style={{ color: '#64748b' }}>{item.owner_or_assignee || 'Unassigned'}</td>
                  <td style={{ color: item.age_or_deadline.includes('Overdue') ? '#ef4444' : '#64748b', fontWeight: item.age_or_deadline.includes('Overdue') ? 700 : 500 }}>
                    {item.age_or_deadline}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>{item.status_label}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                      {item.recommended_action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* C. Department Workload */}
      <div className="socio-card">
        <div className="socio-card-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Department Workload & Capacity</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>
              Monitoring declared capacity, active workload utilization, and capacity flags
            </p>
          </div>
          <button onClick={() => navigate('/admin/departments')} className="btn btn-secondary btn-sm">
            Manage Departments <ChevronRight size={14} />
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Department Lead</th>
                <th>Open Tasks</th>
                <th>In Progress</th>
                <th>Overdue</th>
                <th>Capacity Limit</th>
                <th>Utilization</th>
                <th>Referrals</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const utilPct = Math.round((dept.current_workload / dept.declared_capacity) * 100);
                return (
                  <tr
                    key={dept.id}
                    onClick={() => navigate(`/admin/departments?dept=${dept.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{dept.name}</td>
                    <td style={{ color: '#64748b' }}>{dept.lead_name}</td>
                    <td>{dept.open_tasks_count}</td>
                    <td>{dept.in_progress_count}</td>
                    <td style={{ color: dept.overdue_count > 0 ? '#ef4444' : '#64748b', fontWeight: dept.overdue_count > 0 ? 700 : 400 }}>
                      {dept.overdue_count}
                    </td>
                    <td>{dept.declared_capacity} tasks</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(utilPct, 100)}%`,
                              height: '100%',
                              backgroundColor: utilPct > 90 ? '#ef4444' : utilPct > 70 ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{utilPct}%</span>
                      </div>
                    </td>
                    <td>
                      {dept.pending_referrals_count > 0 ? (
                        <span className="badge badge-medium" style={{ fontSize: '11px' }}>{dept.pending_referrals_count} Pending</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </td>
                    <td>
                      {dept.is_overloaded ? (
                        <span className="badge badge-high" style={{ fontSize: '11px' }}>Overloaded</span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>Accepting Tasks</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Recent Tasks & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* G. Recent Tasks Table */}
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Recent Operational Tasks</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Latest interventions dispatched to field teams</p>
            </div>
            <button onClick={() => navigate('/admin/tasks')} className="btn btn-secondary btn-sm">
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => navigate('/admin/tasks')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7' }}>#{t.id}</span>
                    <PriorityBadge priority={t.priority} size="sm" />
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{t.title}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Assignee: {t.assigned_user?.display_name || 'Unassigned'} • Dept: {t.accountable_department || 'Field'}
                  </span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            ))}
          </div>
        </div>

        {/* F. Recent Activity Feed */}
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Operational Activity Stream</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Audit trail of actions taken across the platform</p>
            </div>
            <button onClick={() => navigate('/admin/audit')} className="btn btn-secondary btn-sm">
              Audit Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_ACTIVITY_FEED.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Activity size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {act.actor} <span style={{ fontWeight: 400, color: '#475569' }}>{act.action}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {act.reason}
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.affected_record}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
