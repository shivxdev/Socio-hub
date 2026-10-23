/**
 * Volunteer Dashboard
 * Matches bottom-middle of reference UI ("Hello, Rohan! 👋").
 * Preserves the volunteer workflow without breaking any role contracts.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOCK_TASKS } from '../../mocks/adminData';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import {
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Send,
  Heart,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loginAs } = useAuth();

  const [activeTasks, setActiveTasks] = useState(MOCK_TASKS.filter((t) => t.assigned_to === 'usr_vol_101'));
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleStartTask = (taskId: number) => {
    setActiveTasks(
      activeTasks.map((t) => (t.id === taskId ? { ...t, status: 'active' } : t))
    );
    setSuccessNotice(`Work started on Task #${taskId}. Status updated to active.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    setActiveTasks(
      activeTasks.map((t) =>
        t.id === selectedTaskId
          ? {
              ...t,
              status: 'completion_submitted',
              completion_note: evidenceNote,
              completion_submitted_at: new Date().toISOString(),
            }
          : t
      )
    );
    setEvidenceModalOpen(false);
    setEvidenceNote('');
    setSuccessNotice(`Completion evidence submitted for Task #${selectedTaskId}. Awaiting Admin verification.`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '68px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px',
              padding: '4px',
              backgroundColor: '#0f172a',
            }}
          >
            <div style={{ backgroundColor: '#ef4444', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#f59e0b', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#0ea5e9', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#10b981', borderRadius: '4px' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Socio-hub</span>
          <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Volunteer Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin/overview')} className="btn btn-secondary btn-sm">
            Switch to Admin View
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {currentUser?.display_name || 'Rohan Sharma'}
            </span>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome greeting matching reference UI */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Hello, Rohan! 👋
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Here's what's happening with your volunteer journey today.
          </p>
        </div>

        {successNotice && (
          <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '13px', fontWeight: 600 }}>
            {successNotice}
          </div>
        )}

        {/* 3 Metric Cards matching reference UI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="socio-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>3</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Assigned Tasks</div>
            </div>
          </div>

          <div className="socio-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>2</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>In Progress</div>
            </div>
          </div>

          <div className="socio-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>5</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Completed</div>
            </div>
          </div>
        </div>

        {/* My Assigned Tasks Section matching reference UI */}
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>My Assigned Tasks</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Assigned directly through deterministic volunteer matching</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>#{t.id}</span>
                    <PriorityBadge priority={t.priority} size="sm" />
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{t.title}</h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {t.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Open'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {t.status === 'assigned' && (
                    <button
                      onClick={() => handleStartTask(t.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Play size={13} /> Start Task
                    </button>
                  )}

                  {t.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setEvidenceModalOpen(true);
                      }}
                      className="btn btn-success btn-sm"
                    >
                      <Send size={13} /> Submit Evidence
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Time Makes a Difference Banner matching reference UI */}
        <div style={{ padding: '24px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#92400e' }}>Your time makes a difference!</h4>
            <p style={{ fontSize: '13px', color: '#78350f', marginTop: '2px' }}>
              Thank you for being a part of our NGO mission across rural and urban Uttar Pradesh.
            </p>
          </div>
          <Heart size={28} className="text-amber-500 fill-amber-500" />
        </div>
      </main>

      {/* Completion Evidence Submission Modal */}
      {evidenceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Submit Completion Evidence for Task #{selectedTaskId}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Admin verification is required before this intervention is formally closed.
            </p>

            <form onSubmit={handleSubmitEvidence}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Completion Notes / Field Summary <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Detail the actions taken, items distributed, and beneficiary confirmation..."
                  rows={4}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setEvidenceModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Send to Admin for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
