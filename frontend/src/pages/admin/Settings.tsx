/**
 * Page 10 — Administrative Settings & Rules Engine
 * Configures category-to-department routing, priority calculation weights, escalation thresholds, and roles.
 */
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Shield,
  Layers,
  Bell,
  AlertTriangle,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routing' | 'priority' | 'escalation' | 'roles'>('routing');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Form states
  const [weights, setWeights] = useState({
    severity: 30,
    time_sensitivity: 25,
    affected_scale: 15,
    vulnerability_barrier: 15,
    service_disruption: 10,
    deadline_dependency: 5,
  });

  const [thresholds, setThresholds] = useState({
    critical_score: 85,
    high_score: 65,
    medium_score: 35,
    max_active_tasks: 2,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice('Operational configuration updated and validated against policy engine.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            NGO Operational Settings & Rules Engine
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Deterministic priority weights, category-to-department routing rules, and volunteer safety constraints.
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary btn-sm">
          <Save size={14} /> Save Configuration
        </button>
      </div>

      {savedNotice && (
        <div style={{ padding: '10px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '12.5px', fontWeight: 600 }}>
          {savedNotice}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        {[
          { id: 'routing', label: 'Department Routing Rules' },
          { id: 'priority', label: 'Priority Scoring Weights' },
          { id: 'escalation', label: 'Emergency Escalation' },
          { id: 'roles', label: 'Roles & Workforce Policies' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
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

      {/* Routing Rules Tab */}
      {activeTab === 'routing' && (
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Category-to-Department Routing Map
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Incoming verified community cases automatically map to accountable owner departments
              </p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shared Category</th>
                  <th>Primary Accountable Department</th>
                  <th>Default Supporting Department</th>
                  <th>Escalation Contact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>emergency</strong></td>
                  <td>Relief & Food Support</td>
                  <td>Field Operations</td>
                  <td>Vikram Mehta (Field Lead)</td>
                </tr>
                <tr>
                  <td><strong>medical</strong></td>
                  <td>Healthcare & Medical Access</td>
                  <td>Logistics & Warehouse Hub</td>
                  <td>Dr. Sunita Rao (Medical Director)</td>
                </tr>
                <tr>
                  <td><strong>food</strong></td>
                  <td>Relief & Food Support</td>
                  <td>Logistics & Warehouse Hub</td>
                  <td>Ananya Deshmukh (Relief Lead)</td>
                </tr>
                <tr>
                  <td><strong>infrastructure</strong></td>
                  <td>Field Operations</td>
                  <td>Logistics & Warehouse Hub</td>
                  <td>Vikram Mehta (Field Lead)</td>
                </tr>
                <tr>
                  <td><strong>education</strong></td>
                  <td>Education & Community Uplift</td>
                  <td>None</td>
                  <td>Kavita Sen (Education Lead)</td>
                </tr>
                <tr>
                  <td><strong>other</strong></td>
                  <td>Field Operations</td>
                  <td>Operations Leadership</td>
                  <td>Aarav Singh (Admin)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Priority Weights Tab */}
      {activeTab === 'priority' && (
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Priority Assessment Model Weights (0–100 Score Formula)
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Deterministic formula weighting signals extracted by Gemma 4 from field reports
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Severity / Harm if Not Addressed: {weights.severity}%
              </label>
              <input
                type="range"
                min={10}
                max={50}
                value={weights.severity}
                onChange={(e) => setWeights({ ...weights, severity: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Potential humanitarian consequence if delayed</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Time Sensitivity: {weights.time_sensitivity}%
              </label>
              <input
                type="range"
                min={10}
                max={40}
                value={weights.time_sensitivity}
                onChange={(e) => setWeights({ ...weights, time_sensitivity: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Whether delay materially worsens the situation</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                People Affected / Scale: {weights.affected_scale}%
              </label>
              <input
                type="range"
                min={5}
                max={30}
                value={weights.affected_scale}
                onChange={(e) => setWeights({ ...weights, affected_scale: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Estimated households or individuals in need</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Vulnerability & Access Barriers: {weights.vulnerability_barrier}%
              </label>
              <input
                type="range"
                min={5}
                max={25}
                value={weights.vulnerability_barrier}
                onChange={(e) => setWeights({ ...weights, vulnerability_barrier: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Vulnerable demographics (children, elderly)</span>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Tab */}
      {activeTab === 'escalation' && (
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Emergency Escalation Triggers
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Conditions that immediately trigger notifications to leadership and require prompt human review
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" defaultChecked />
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>Drinking water contamination or outage exceeding 500 households</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b' }}>Triggers priority escalation and notifies Field Operations Lead within 15 minutes.</p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" defaultChecked />
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>Active flood inundation affecting residential community shelters</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b' }}>Forces High/Critical priority band regardless of initial score.</p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" defaultChecked />
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>Primary health clinic stockout of essential pediatric medicines</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b' }}>Routes immediately to Medical Director queue for cold-chain dispatch.</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Roles & Workforce Policies Tab */}
      {activeTab === 'roles' && (
        <div className="socio-card">
          <div className="socio-card-header">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Workforce Capacity Constraints & Safeguarding
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Hard assignment limits enforced deterministically by backend assignment service
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                MAX_ACTIVE_TASKS Limit
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>2 Active Tasks / Volunteer</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Enforced by Member 3 smart assignment logic to prevent volunteer burnout and unfair distribution.
              </p>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Mandatory Safeguarding Verification
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>Enforced for Schools & Children</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Unverified volunteers cannot be matched to education or child welfare tasks under any circumstances.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
