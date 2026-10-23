/**
 * Page 5 — Volunteers: Workforce Management
 * Comprehensive directory, qualification tracking, safeguarding verification, workload balancing, and profile inspection.
 */
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { VolunteerManagementProfile } from '../../types/admin';
import { LoadingState } from '../../components/admin/LoadingState';
import { EmptyState } from '../../components/admin/EmptyState';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import {
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  Award,
  Filter,
} from 'lucide-react';

export const Volunteers: React.FC = () => {
  const [volunteers, setVolunteers] = useState<VolunteerManagementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerManagementProfile | null>(null);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVolunteers();
      setVolunteers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch =
      searchQuery === '' ||
      v.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.preferred_service_area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = filterDepartment === 'all' || v.department_name === filterDepartment;
    const matchesAvail =
      filterAvailability === 'all' ||
      (filterAvailability === 'available' && v.is_available) ||
      (filterAvailability === 'assigned' && v.active_tasks.length > 0);

    return matchesSearch && matchesDept && matchesAvail;
  });

  // Overview metrics
  const totalCount = volunteers.length;
  const availableCount = volunteers.filter((v) => v.is_available && v.active_tasks.length < 2).length;
  const assignedCount = volunteers.filter((v) => v.active_tasks.length > 0).length;
  const safeguardingVerifiedCount = volunteers.filter((v) => v.safeguarding_verified).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
          Volunteers: Workforce Management & Deployment
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Verified skill registries, workload caps (max 2 tasks), safeguarding compliance, and assignment audit histories.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="socio-card" style={{ padding: '14px 18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Workforce</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{totalCount}</div>
          <span style={{ fontSize: '11.5px', color: '#0284c7' }}>Registered field helpers</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Immediately Available</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{availableCount}</div>
          <span style={{ fontSize: '11.5px', color: '#10b981' }}>Under workload limit (&lt;2 tasks)</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Currently Assigned</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{assignedCount}</div>
          <span style={{ fontSize: '11.5px', color: '#3b82f6' }}>Active in field interventions</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Safeguarding Verified</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>{safeguardingVerifiedCount}</div>
          <span style={{ fontSize: '11.5px', color: '#8b5cf6' }}>Child safety & background checked</span>
        </div>
      </div>

      {/* Main Split: Directory and Profile Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedVolunteer ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Directory Table */}
        <div className="socio-card" style={{ padding: '16px' }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by volunteer name, skill, or service area..."
                className="input-field"
                style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
              />
            </div>

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="input-field"
              style={{ width: '140px', height: '34px', fontSize: '12px' }}
            >
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="assigned">Currently Assigned</option>
            </select>
          </div>

          {loading ? (
            <LoadingState message="Loading volunteer workforce directory..." />
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Volunteer Name</th>
                    <th>Qualification</th>
                    <th>Verified Skills</th>
                    <th>Workload</th>
                    <th>Safeguarding</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map((vol) => {
                    const isSelected = selectedVolunteer?.id === vol.id;
                    return (
                      <tr
                        key={vol.id}
                        onClick={() => setSelectedVolunteer(vol)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0f9ff' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{vol.display_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{vol.preferred_service_area}</div>
                        </td>
                        <td>
                          <span className="badge badge-low" style={{ fontSize: '11px' }}>
                            {vol.qualification_level}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                            {vol.skills.slice(0, 2).map((s, i) => (
                              <span key={i} className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                                {s}
                              </span>
                            ))}
                            {vol.skills.length > 2 && (
                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>+{vol.skills.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: vol.active_tasks.length >= 2 ? '#ef4444' : '#0284c7' }}>
                              {vol.active_tasks.length}/2 tasks
                            </span>
                            {vol.active_tasks.length >= 2 && (
                              <span className="badge badge-high" style={{ fontSize: '9.5px', padding: '1px 4px' }}>Capped</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {vol.safeguarding_verified ? (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              <ShieldCheck size={14} /> Verified
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>Pending</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVolunteer(vol);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11.5px' }}
                          >
                            <Eye size={13} /> Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Volunteer Profile Inspection */}
        {selectedVolunteer && (
          <div className="socio-card" style={{ padding: '22px', borderTop: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{selectedVolunteer.display_name}</span>
                  <span className="badge badge-low" style={{ fontSize: '11px' }}>{selectedVolunteer.qualification_level}</span>
                  {selectedVolunteer.safeguarding_verified && (
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      <ShieldCheck size={12} /> Safeguarding Cleared
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  ID: {selectedVolunteer.id} • Dept: {selectedVolunteer.department_name || 'Field Operations'}
                </div>
              </div>
              <button onClick={() => setSelectedVolunteer(null)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '68vh', overflowY: 'auto' }}>
              {/* Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} className="text-slate-500" />
                  <span>{selectedVolunteer.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} className="text-slate-500" />
                  <span>{selectedVolunteer.phone || 'Protected Contact'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} className="text-slate-500" />
                  <span>{selectedVolunteer.preferred_service_area}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} className="text-slate-500" />
                  <span>{selectedVolunteer.availability_schedule.hours_per_week} hrs/week committed</span>
                </div>
              </div>

              {/* Verified Skills */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Verified Skills & Certifications
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedVolunteer.skills.map((s, i) => (
                    <span key={i} className="badge badge-low" style={{ fontSize: '12px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Training Courses Completed */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Training Records & Modules
                </h4>
                <ul style={{ paddingLeft: '18px', fontSize: '12.5px', color: '#475569' }}>
                  {selectedVolunteer.training_completed.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Current Active Tasks */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Current Active Assignments ({selectedVolunteer.active_tasks.length}/2 Workload Limit)
                </h4>
                {selectedVolunteer.active_tasks.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No active tasks. Available for deployment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedVolunteer.active_tasks.map((t) => (
                      <div key={t.id} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>#{t.id}: {t.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Open'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past History & Declined Reasons */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Completed Tasks: <strong>{selectedVolunteer.completed_tasks_count} interventions</strong></span>
                  <span>Declined Tasks: <strong>{selectedVolunteer.declined_assignments_count} records</strong></span>
                </div>
                {selectedVolunteer.declined_reasons.length > 0 && (
                  <div style={{ padding: '8px', backgroundColor: '#fffbeb', borderRadius: '6px', color: '#92400e', fontSize: '11.5px', marginTop: '6px' }}>
                    <strong>Last Decline Reason:</strong> {selectedVolunteer.declined_reasons[0].reason} ({new Date(selectedVolunteer.declined_reasons[0].timestamp).toLocaleDateString()})
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
