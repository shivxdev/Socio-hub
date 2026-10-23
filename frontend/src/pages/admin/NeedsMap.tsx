/**
 * Page 7 — Geographic Community Needs Map
 * Spatial visualization of community cases, hotspot clusters, privacy masking, and linked task drawers.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_COMMUNITY_CASES } from '../../mocks/adminData';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import {
  MapPin,
  Layers,
  Filter,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CommunityCase } from '../../types/admin';

export const NeedsMap: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<CommunityCase | null>(MOCK_COMMUNITY_CASES[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [privacyMasking, setPrivacyMasking] = useState<boolean>(true);

  const filteredCases = MOCK_COMMUNITY_CASES.filter((c) => {
    const matchesCat = filterCategory === 'all' || c.ai_category === filterCategory;
    const matchesPri = filterPriority === 'all' || c.calculated_priority === filterPriority;
    return matchesCat && matchesPri;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Geographic Needs Map & Spatial Intelligence
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Location clusters, accessibility barriers, and spatial resource routing with PII protection.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '6px' }}>
            <input
              type="checkbox"
              checked={privacyMasking}
              onChange={(e) => setPrivacyMasking(e.target.checked)}
            />
            <Shield size={14} className="text-emerald-600" />
            <span>Beneficiary Privacy Masking</span>
          </label>
        </div>
      </div>

      {/* Map + Side Drawer Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        {/* Visual Map Canvas / Prototype */}
        <div className="socio-card" style={{ padding: '0', position: 'relative', overflow: 'hidden', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          {/* Map Filters Overlay */}
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Map Filters:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field"
              style={{ width: '130px', height: '30px', fontSize: '11.5px', padding: '2px 8px' }}
            >
              <option value="all">All Categories</option>
              <option value="emergency">Emergency</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="medical">Medical</option>
              <option value="food">Food</option>
              <option value="education">Education</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field"
              style={{ width: '120px', height: '30px', fontSize: '11.5px', padding: '2px 8px' }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Stylized Interactive Map Surface */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#e2e8f0',
              backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #f8fafc 1.5px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Sector Labels */}
            <div style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
              Sitapur Rural Sector
            </div>
            <div style={{ position: 'absolute', top: '45%', left: '48%', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
              Lucknow Urban Core (Ward 12)
            </div>
            <div style={{ position: 'absolute', bottom: '20%', right: '25%', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
              Barabanki Kiln Cluster
            </div>

            {/* Simulated Case Pins */}
            {filteredCases.map((c, i) => {
              const isSelected = selectedCase?.id === c.id;
              // Deterministic screen positions for realistic map prototype
              const positions = [
                { top: '25%', left: '26%' },
                { top: '48%', left: '50%' },
                { top: '28%', left: '32%' },
                { top: '70%', left: '74%' },
                { top: '65%', left: '18%' },
              ];
              const pos = positions[i % positions.length];

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    zIndex: isSelected ? 20 : 5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      border: `2px solid ${c.calculated_priority === 'high' ? '#ef4444' : '#0284c7'}`,
                      fontSize: '11.5px',
                      fontWeight: 700,
                    }}
                  >
                    <MapPin size={13} style={{ color: c.calculated_priority === 'high' ? '#ef4444' : '#0284c7' }} />
                    <span>{c.id}</span>
                  </div>
                </div>
              );
            })}

            {/* Map Legend */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                High / Critical Need
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                Standard Priority
              </span>
            </div>
          </div>
        </div>

        {/* Selected Map Case Inspector */}
        {selectedCase ? (
          <div className="socio-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>{selectedCase.id}</span>
                <PriorityBadge priority={selectedCase.calculated_priority} size="sm" />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {selectedCase.short_title}
              </h3>

              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                  {privacyMasking ? 'Approximated Privacy Protected Zone:' : 'Exact GPS Location:'}
                </div>
                <div>{selectedCase.location_name}</div>
                {privacyMasking && (
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                    ✓ Exact beneficiary GPS coordinates obscured per NGO Safeguarding Policy v3.
                  </div>
                )}
              </div>

              <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5, marginBottom: '14px' }}>
                {selectedCase.ai_summary}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div>Accountable Department: <strong>{selectedCase.suggested_department}</strong></div>
                <div>Affected Population: <strong>~{selectedCase.estimated_affected_people || 'Unknown'} people</strong></div>
                <div>Required Skills: <strong>{selectedCase.required_skills.join(', ')}</strong></div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/admin/needs-reports')}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                <Eye size={14} /> Open Full Case Intelligence
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
