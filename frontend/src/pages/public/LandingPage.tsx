/**
 * Socio-hub Public Landing Page
 * Matches top-left section of the reference UI design.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Cpu,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid #f1f5f9',
          padding: '0 32px',
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
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Socio-hub
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '14px', fontWeight: 600, color: '#475569' }} className="hidden md:flex">
          <span style={{ color: '#0284c7', cursor: 'pointer' }}>Home</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/report')}>Report Need</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/volunteer')}>Volunteers</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/overview')}>Operations</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/login')} className="btn btn-secondary btn-sm">
            Sign In
          </button>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
            Operations Command <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px auto' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#d97706',
              backgroundColor: '#fef3c7',
              padding: '4px 12px',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            Together We Can Make a Difference
          </span>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '18px',
            }}
          >
            Stronger Communities. <br />
            <span style={{ color: '#d97706' }}>Brighter Tomorrows.</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
            Socio-hub connects community needs with the right NGO resources, verified volunteers, and accountable department routing — faster, smarter, and with audited real-world impact.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/report')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
              Report a Community Need
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
              Admin Operations Command
            </button>
          </div>
        </div>

        {/* 4 Feature Pillars matching reference UI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '60px' }}>
          <div className="socio-card" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Report a Need</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Share real-time community needs from your area with privacy-first geocoding.
            </p>
          </div>

          <div className="socio-card" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Smart Allocation</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              AI-assisted structuring with Gemma 4, constraint matching, and stock reservation.
            </p>
          </div>

          <div className="socio-card" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Volunteer Network</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Matched by verified skills, geographic vicinity, and strict workload caps.
            </p>
          </div>

          <div className="socio-card" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Track Impact</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Admin-verified outcomes with verifiable completion evidence and citizen ratings.
            </p>
          </div>
        </div>

        {/* Our Impact Row matching reference UI */}
        <div className="socio-card" style={{ padding: '32px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Our Verified Impact</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Real support. Lasting change.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>1,250+</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>People Helped</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>320+</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Volunteers Active</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>85+</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Communities Served</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed' }}>12+</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Districts Covered</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
