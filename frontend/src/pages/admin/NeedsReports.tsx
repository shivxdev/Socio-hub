/**
 * Page 2 — Needs & Reports: AI Intelligence Center
 * Consolidates incoming reports, spreadsheet imports, and comprehensive 9-section individual case intelligence reports.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { CommunityCase } from '../../types/admin';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { LoadingState } from '../../components/admin/LoadingState';
import { EmptyState } from '../../components/admin/EmptyState';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import {
  FileText,
  Search,
  Upload,
  Sparkles,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Users,
  Package,
  Building,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { MOCK_VOLUNTEERS } from '../../mocks/adminData';

export const NeedsReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cases, setCases] = useState<CommunityCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'all');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all');

  // Selected case for Individual Case Intelligence Report view
  const [selectedCase, setSelectedCase] = useState<CommunityCase | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any[] | null>(null);

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'approve' | 'reject' | 'clarify';
    caseId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: 'approve',
  });

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCases();
      setCases(res.data);
      // If a case was already selected, update it
      if (selectedCase) {
        const updated = res.data.find((c) => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || c.ai_category === filterCategory;
    const matchesPriority = filterPriority === 'all' || c.calculated_priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // Inbox counters
  const newReportsCount = cases.filter((c) => c.status === 'under_admin_review').length;
  const verifiedNeedsCount = cases.filter((c) => c.status === 'verified_need').length;
  const missingInfoCount = cases.filter((c) => c.missing_information.length > 0).length;
  const criticalCount = cases.filter((c) => c.calculated_priority === 'high' || c.escalation_triggered).length;

  const handleCaseActionConfirm = async (reason?: string) => {
    if (!confirmModal.caseId) return;

    if (confirmModal.action === 'approve') {
      await adminApi.updateCaseStatus(confirmModal.caseId, 'verified_need', reason);
    } else if (confirmModal.action === 'reject') {
      await adminApi.updateCaseStatus(confirmModal.caseId, 'rejected', reason);
    } else if (confirmModal.action === 'clarify') {
      await adminApi.updateCaseStatus(confirmModal.caseId, 'clarification_requested', reason);
    }

    setConfirmModal({ ...confirmModal, isOpen: false });
    await loadCases();
  };

  // Simulated CSV Import Workflow
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      setImportPreviewData([
        { row: 1, title: 'Medical kit shortage at Subcenter B', category: 'medical', location: 'Sitapur Block 3', status: 'Valid' },
        { row: 2, title: 'Drinking water pipeline ruptured', category: 'infrastructure', location: 'Village A', status: 'Potential Duplicate of SR-00042' },
        { row: 3, title: 'Blanket request for shelter', category: 'emergency', location: '', status: 'Missing Location Error' },
        { row: 4, title: 'Daily meal support for migrant labor', category: 'food', location: 'Barabanki', status: 'Valid' },
      ]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Needs & Reports: AI Intelligence Center
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Consolidating multi-channel community submissions with Gemma 4 extraction and human verification.
          </p>
        </div>

        <button onClick={() => setShowImportModal(true)} className="btn btn-secondary btn-sm">
          <Upload size={14} /> Import Spreadsheet (CSV/XLSX)
        </button>
      </div>

      {/* A. Inbox Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>New Submissions</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {newReportsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#0284c7' }}>Awaiting initial review</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Verified Needs</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {verifiedNeedsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#10b981' }}>Ready for task creation</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Data Quality Queue</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {missingInfoCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#f59e0b' }}>Missing essential fields</span>
        </div>

        <div className="socio-card" style={{ padding: '14px 18px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Critical Human Review</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
            {criticalCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#ef4444' }}>Escalation triggered</span>
        </div>
      </div>

      {/* Main Content Area: Master-Detail Split or Full Table */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCase ? '1fr 1.35fr' : '1fr', gap: '20px' }}>
        {/* B. Searchable Report Table */}
        <div className="socio-card" style={{ padding: '16px' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter cases by title, ID, or village..."
                  className="input-field"
                  style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
                style={{ width: '130px', height: '34px', fontSize: '12px' }}
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
                style={{ width: '120px', height: '34px', fontSize: '12px' }}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingState message="Loading community case reports..." />
          ) : filteredCases.length === 0 ? (
            <EmptyState
              title="No reports match your filters"
              description="Adjust your search query or clear the filter dropdowns to view all community cases."
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterPriority('all');
                setFilterStatus('all');
              }}
            />
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Problem Title</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0f9ff' : undefined,
                        }}
                      >
                        <td style={{ fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>{c.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.short_title}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{c.location_name}</div>
                        </td>
                        <td>
                          <PriorityBadge priority={c.calculated_priority} size="sm" />
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                            {c.ai_category}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              c.status === 'verified_need'
                                ? 'badge-success'
                                : c.status === 'under_admin_review'
                                ? 'badge-medium'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '11px' }}
                          >
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(c);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <Eye size={13} /> Inspect
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

        {/* D. Comprehensive Individual Case Intelligence Report (9 Sections) */}
        {selectedCase ? (
          <div className="socio-card" style={{ padding: '22px', borderTop: '4px solid #0284c7' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>{selectedCase.id}</span>
                  <PriorityBadge priority={selectedCase.calculated_priority} size="sm" />
                  <span className="badge badge-ai" style={{ fontSize: '11px' }}>
                    <Sparkles size={11} /> Gemma 4 Analyzed
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>{selectedCase.short_title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Location: {selectedCase.location_name} • Est. Affected: {selectedCase.estimated_affected_people || 'Unknown'} people
                </span>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                Close View
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* 1. Case Summary */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  1. Original Submission & Provenance
                </h4>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{selectedCase.original_description}"</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span>Source: <strong>{selectedCase.source_reference}</strong></span>
                    <span>Type: <strong>{selectedCase.source_type}</strong></span>
                    <span>Submitter: <strong>{selectedCase.submitter_name}</strong></span>
                    <span>Received: <strong>{new Date(selectedCase.received_at).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* 2. AI Classification */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  2. AI Structured Classification & Department Proposal
                </h4>
                <div style={{ padding: '12px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe', fontSize: '12.5px' }}>
                  <p style={{ color: '#4c1d95', marginBottom: '8px' }}>
                    <strong>AI Summary:</strong> {selectedCase.ai_summary}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#5b21b6' }}>
                    <div>Category: <strong>{selectedCase.ai_category} ({selectedCase.ai_subcategory})</strong></div>
                    <div>Accountable Dept: <strong>{selectedCase.suggested_department}</strong></div>
                    <div>Supporting Depts: <strong>{selectedCase.supporting_departments.join(', ') || 'None required'}</strong></div>
                    <div>Confidence: <strong>{selectedCase.ai_confidence_score ? `${selectedCase.ai_confidence_score}% (Model confidence)` : 'Uncalibrated'}</strong></div>
                  </div>

                  {selectedCase.missing_information.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', color: '#92400e', fontSize: '12px' }}>
                      <strong>Missing Inputs:</strong> {selectedCase.missing_information.join('; ')}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Priority Assessment */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  3. Deterministic Priority & Urgency Evidence
                </h4>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Calculated Urgency Score: <strong>{selectedCase.priority_score}/100</strong></span>
                    <PriorityBadge priority={selectedCase.calculated_priority} size="sm" />
                  </div>
                  <ul style={{ paddingLeft: '18px', color: '#475569', fontSize: '12px' }}>
                    {selectedCase.priority_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4. Recommended Actions & Checklist */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  4. Recommended Action Plan & Operational Risks
                </h4>
                <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Action Checklist:</div>
                  <ul style={{ paddingLeft: '18px', color: '#334155', fontSize: '12px', marginBottom: '8px' }}>
                    {selectedCase.action_checklist.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  {selectedCase.potential_risks.length > 0 && (
                    <div style={{ color: '#b91c1c', fontSize: '12px' }}>
                      <strong>Identified Risks:</strong> {selectedCase.potential_risks.join(' ')}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Resources and Capacity */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  5. Resource Requirements & Stock Feasibility
                </h4>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCase.resource_needs.map((res, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>• {res.item}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Req: {res.quantity || 'TBD'} {res.unit}</span>
                          {res.shortage ? (
                            <span className="badge badge-high" style={{ fontSize: '10.5px' }}>Shortage</span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Available</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Volunteer Candidate Matching */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  6. Top Ranked Eligible Volunteer Candidates
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {MOCK_VOLUNTEERS.slice(0, 2).map((v) => (
                    <div
                      key={v.id}
                      style={{
                        padding: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{v.display_name}</span>{' '}
                        <span style={{ color: '#64748b' }}>({v.qualification_level})</span>
                        <div style={{ fontSize: '11px', color: '#0284c7' }}>
                          Skills Match: {v.skills.join(', ')} • {v.distance_band || 'Local'}
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        Eligible
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Routing Plan */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  7. Department Routing & Referrals
                </h4>
                <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  Accountable Department: <strong>{selectedCase.suggested_department}</strong>
                  <div style={{ color: '#64748b', marginTop: '2px' }}>
                    Referral Status: Pending Department Lead acceptance upon case verification.
                  </div>
                </div>
              </div>

              {/* 8. Admin Decisions (Explicit Consequential Actions) */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  8. Administrative Actions & Review Decisions
                </h4>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Confirm Case Verification',
                        message: `Are you sure you want to verify Case ${selectedCase.id}? This will confirm the case and permit task creation.`,
                        action: 'approve',
                        caseId: selectedCase.id,
                      })
                    }
                    className="btn btn-primary btn-sm"
                  >
                    <CheckCircle2 size={14} /> Verify Need
                  </button>

                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Request Clarification from Submitter',
                        message: `Return Case ${selectedCase.id} to submitter for missing information.`,
                        action: 'clarify',
                        caseId: selectedCase.id,
                      })
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    <Send size={14} /> Request Clarification
                  </button>

                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Reject Community Case',
                        message: `Reject Case ${selectedCase.id}. A mandatory operational justification must be recorded in the audit log.`,
                        action: 'reject',
                        caseId: selectedCase.id,
                      })
                    }
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle size={14} /> Reject Case
                  </button>

                  <button
                    onClick={() => {
                      navigate('/admin/tasks');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <PlusCircle size={14} /> Create Task from Case
                  </button>
                </div>
              </div>

              {/* 9. Audit and Follow-up */}
              <div style={{ fontSize: '11.5px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <strong>Audit Status:</strong> Case logged at {new Date(selectedCase.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                {selectedCase.reviewed_by ? ` Reviewed by ${selectedCase.reviewed_by} at ${selectedCase.reviewed_at}` : ' Pending initial administrative sign-off.'}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* C. CSV/XLSX Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Spreadsheet Data Import Workflow</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Upload partner or survey files (.csv, .xlsx). Row-level validation and provenance retention.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreviewData(null);
                  setImportFileName(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', marginBottom: '16px' }}>
              <Upload size={32} style={{ color: '#0284c7', margin: '0 auto 10px auto' }} />
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileSelected}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                Select CSV or XLSX File
              </label>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                {importFileName ? `Selected: ${importFileName}` : 'Supports UTF-8 CSV, Excel (.xlsx)'}
              </div>
            </div>

            {importPreviewData && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>Import Preview & Row Validation</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>2 Valid • 1 Warning • 1 Error</span>
                </div>

                <div className="data-table-container">
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Problem Title</th>
                        <th>Location</th>
                        <th>Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.map((row, i) => (
                        <tr key={i}>
                          <td>#{row.row}</td>
                          <td>{row.title}</td>
                          <td>{row.location || '<Missing>'}</td>
                          <td>
                            {row.status.includes('Valid') ? (
                              <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Valid</span>
                            ) : row.status.includes('Duplicate') ? (
                              <span className="badge badge-medium" style={{ fontSize: '10.5px' }}>{row.status}</span>
                            ) : (
                              <span className="badge badge-high" style={{ fontSize: '10.5px' }}>{row.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                * Mock import preview: Backend parsing API will execute in production.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreviewData(null);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={!importPreviewData}
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreviewData(null);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Confirm & Ingest 2 Valid Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.action === 'reject'}
        requireReason={confirmModal.action === 'reject' || confirmModal.action === 'clarify'}
        confirmLabel={confirmModal.action === 'reject' ? 'Reject Case' : 'Confirm'}
        onConfirm={handleCaseActionConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};
