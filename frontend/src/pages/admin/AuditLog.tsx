/**
 * Page 9 — Activity & Audit Log
 * Append-only immutable administrative audit trail displaying actors, timestamps, before/after values, reasons, and trace IDs.
 */
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { AuditEventRecord } from '../../types/admin';
import { LoadingState } from '../../components/admin/LoadingState';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLog();
      setLogs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      searchQuery === '' ||
      l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.related_case_id && l.related_case_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = filterAction === 'all' || l.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesEntity = filterEntity === 'all' || l.entity_type === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Activity & Administrative Audit Log
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Append-only legal record of all approvals, status transitions, priority overrides, and stock reservations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '6px' }}>
          <Shield size={14} /> Read-Only Audit Protection Active
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, case ID, reason, or action..."
            className="input-field"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="input-field"
          style={{ width: '160px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Action Types</option>
          <option value="OVERRIDE">Priority Overrides</option>
          <option value="RESERVATION">Stock Reservations</option>
          <option value="ASSIGNMENT">Task Assignments</option>
          <option value="VERIFICATION">Outcome Verifications</option>
          <option value="CASE">Case Decisions</option>
        </select>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="input-field"
          style={{ width: '140px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Entities</option>
          <option value="case">Community Cases</option>
          <option value="task">Tasks</option>
          <option value="resource">Resources</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="socio-card" style={{ padding: '0' }}>
        {loading ? (
          <LoadingState message="Connecting to secure audit ledger..." />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Actor & Role</th>
                  <th>Action Event</th>
                  <th>Entity Target</th>
                  <th>Before → After State</th>
                  <th>Operational Justification</th>
                  <th>Trace ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.actor}</div>
                      <span className="badge badge-neutral" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                        {log.actor_role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>
                        {log.entity_type.toUpperCase()} #{log.entity_id}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {log.before_value || log.after_value ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{log.before_value}</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{log.after_value}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Event recorded</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#334155', maxWidth: '280px' }}>
                      {log.reason || 'Standard operational transition'}
                    </td>
                    <td style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {log.trace_id || 'trc_local'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
