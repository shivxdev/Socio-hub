/**
 * Page 8 — Analytics & Impact Measurement
 * Strict distinction between tasks completed, needs resolved, people reached, and lasting social impact.
 */
import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  HeartHandshake,
  Download,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<'30d' | '90d' | 'all'>('30d');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = () => {
    setExportNotice('Export requested: CSV operational impact report downloaded.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Analytics & Social Impact Measurement
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Audited operational performance, volunteer response velocity, and long-term community outcome tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleExport} className="btn btn-secondary btn-sm">
            <Download size={14} /> Export Operational Report
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{ padding: '10px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '12.5px', fontWeight: 600 }}>
          {exportNotice}
        </div>
      )}

      {/* Critical Policy Distinctions Banner */}
      <div style={{ padding: '12px 16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12.5px', color: '#0369a1', lineHeight: 1.5 }}>
        <strong>Measurement Standard:</strong> Socio-hub separates operational activity metrics (tasks executed) from verified humanitarian outcomes (people sustainably reached and recurring needs resolved). Task completion does not equate to verified social impact without independent beneficiary feedback.
      </div>

      {/* Operational Response Velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="socio-card">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Report-to-Review Velocity</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>2.4 hrs</div>
          <span style={{ fontSize: '11.5px', color: '#10b981' }}>-45 min from last month</span>
        </div>

        <div className="socio-card">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Verification-to-Assign</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>1.8 hrs</div>
          <span style={{ fontSize: '11.5px', color: '#10b981' }}>94% volunteer match rate</span>
        </div>

        <div className="socio-card">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Task Resolution Time</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>26.5 hrs</div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Median execution duration</span>
        </div>

        <div className="socio-card">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Overdue Work Rate</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>4.2%</div>
          <span style={{ fontSize: '11.5px', color: '#f59e0b' }}>2 tasks currently delayed</span>
        </div>
      </div>

      {/* Social Outcome Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        <div className="socio-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Verified Community Reach
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            2,450+
          </div>
          <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
            Individuals directly supported through food kits, clean water restoration, and primary healthcare.
          </p>

          <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Sitapur Water Point: <strong>1,250 residents reached</strong></div>
            <div>Ward 12 Slum Inundation: <strong>320 families sheltered</strong></div>
            <div>Kalyanpur School: <strong>85 students equipped</strong></div>
          </div>
        </div>

        <div className="socio-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Volunteer Assignment Efficiency
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0284c7', letterSpacing: '-0.02em' }}>
            96.2%
          </div>
          <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
            Assignment acceptance rate across all five operating departments with zero qualification breaches.
          </p>

          <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Workload Cap Adherence: <strong>100% (&lt;= 2 active tasks)</strong></div>
            <div>Safeguarding Coverage: <strong>82% fully verified</strong></div>
            <div>Avg Active Hours/Volunteer: <strong>18 hrs/week</strong></div>
          </div>
        </div>

        <div className="socio-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Beneficiary Satisfaction Score
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.02em' }}>
            4.85 / 5.0
          </div>
          <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
            Derived from post-intervention community ratings submitted after admin verification.
          </p>

          <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Timeliness Rating: <strong>4.9 / 5</strong></div>
            <div>Volunteer Demeanor: <strong>5.0 / 5</strong></div>
            <div>Resource Quality: <strong>4.7 / 5</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
