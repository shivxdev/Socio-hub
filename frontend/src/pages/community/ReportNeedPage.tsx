/**
 * Community Problem Reporting Page
 * Matches bottom-right of the reference UI ("Report a Need").
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { TaskCategory } from '../../types/shared';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Heart,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const ReportNeedPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('emergency');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !title.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate submission of community report
      await new Promise((r) => setTimeout(r, 600));
      setSubmittedCaseId(`SR-000${Math.floor(Math.random() * 900 + 100)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '68px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
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
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Socio-hub</span>
        </div>

        <button onClick={() => navigate('/login')} className="btn btn-secondary btn-sm">
          Admin Login
        </button>
      </header>

      {/* Main Form & Steps Split matching reference UI */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>Report a Need</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Help us understand what your community needs. Your report can make a real difference.
          </p>
        </div>

        {submittedCaseId ? (
          <div className="socio-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Community Report Registered!</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Your case ID is <strong>{submittedCaseId}</strong>. It has entered the Admin Review Queue and will be structured with Gemma 4 before volunteer and resource dispatch.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => navigate('/admin/overview')} className="btn btn-primary">
                View in Admin Workspace
              </button>
              <button onClick={() => setSubmittedCaseId(null)} className="btn btn-secondary">
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px' }}>
            {/* Form */}
            <div className="socio-card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Need Information
              </h3>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="E.g. Clean drinking water needed"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="input-field"
                    >
                      <option value="emergency">Emergency / Disaster</option>
                      <option value="medical">Healthcare & Medical</option>
                      <option value="food">Food & Rations</option>
                      <option value="infrastructure">Water & Infrastructure</option>
                      <option value="education">Education & Youth</option>
                      <option value="other">Other Community Need</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City / Village / Area (e.g. Ward 12, Indira Nagar)"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Description <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us more about the need, how many people are affected, and any urgency..."
                      rows={4}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Upload Images */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Upload Images (optional)
                    </label>
                    <div style={{ padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      <Upload size={24} style={{ color: '#94a3b8', margin: '0 auto 6px auto' }} />
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Click to upload or drag and drop (Max 5 images, 5MB each)
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ height: '42px', fontSize: '14px', marginTop: '8px' }}
                  >
                    {isSubmitting ? 'Registering Report...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>

            {/* What happens next? Sidebar matching reference UI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="socio-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                  What happens next?
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>Your report is received</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        We verify the details and check the location with privacy protection.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>AI Classification</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        We categorize the need and find the right department with Gemma 4.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>Action & Support</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Volunteers and resources are assigned to resolve the community need.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                  <Heart size={16} className="text-red-500 fill-red-500 inline-block mr-1" />
                  Together, we can turn needs into solutions.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
