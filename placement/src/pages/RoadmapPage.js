import React, { useEffect, useState } from 'react';
import {
  FiChevronDown, FiChevronRight, FiClock, FiMessageSquare,
  FiCode, FiLayers, FiVideo, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { getRoadmap } from '../services/api';
import Navbar from '../components/Navbar';

const COLORS = ['#2d6bef','#7c3aed','#06b6d4','#00b86b','#f59e0b'];

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(0);

  useEffect(() => {
    getRoadmap()
      .then(r => setRoadmap(r.data))
      .catch(() => setError('Failed to load roadmap. Ensure backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 14px' }} />
          <div className="muted" style={{ fontSize: 13 }}>Generating your roadmap…</div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page fade-up">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div className="h1">Learning Roadmap</div>
            <div className="body muted" style={{ marginTop: 4 }}>
              Target: <strong style={{ color: 'var(--accent)' }}>{roadmap?.target_role || 'Software Engineer'}</strong>
              &ensp;·&ensp;{roadmap?.total_duration || '14 weeks'} total
            </div>
          </div>

          {error && <div className="alert alert-error"><FiAlertCircle size={13} /> {error}</div>}

          {/* Timeline */}
          <div style={{ marginBottom: 28 }}>
            <div className="h3" style={{ marginBottom: 12 }}>Phase Timeline</div>
            <div style={{ position: 'relative' }}>
              {/* Track line */}
              <div style={{ position: 'absolute', left: 13, top: 20, bottom: 20, width: 1, background: 'var(--border)', zIndex: 0 }} />

              {(roadmap?.phases || []).map((phase, i) => {
                const color = COLORS[i % COLORS.length];
                const isOpen = open === i;
                return (
                  <div key={i} style={{ position: 'relative', paddingLeft: 40, marginBottom: 10 }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: 6, top: 12,
                      width: 16, height: 16, borderRadius: '50%',
                      background: color, zIndex: 1,
                      boxShadow: `0 0 0 3px var(--bg), 0 0 0 4px ${color}44`,
                    }} />

                    {/* Card */}
                    <div
                      className="card card-hover"
                      style={{ cursor: 'pointer', padding: '12px 18px', borderLeft: `3px solid ${color}` }}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono)', minWidth: 60 }}>
                            Phase {phase.phase}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{phase.title}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="flex items-center gap-2 caption muted">
                            <FiClock size={11} /> {phase.duration}
                          </span>
                          {isOpen ? <FiChevronDown size={14} style={{ color: 'var(--text-3)' }} /> : <FiChevronRight size={14} style={{ color: 'var(--text-3)' }} />}
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                          <div className="h3" style={{ marginBottom: 10 }}>Tasks</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {phase.tasks.map((task, j) => (
                              <div key={j} className="flex items-start gap-6">
                                <div style={{
                                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                  background: `${color}18`, border: `1.5px solid ${color}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <FiCheck size={9} style={{ color }} />
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom panels */}
          <div className="grid g2" style={{ marginBottom: 20 }}>
            {/* Mock Interviews */}
            <div className="card">
              <div className="flex items-center gap-4" style={{ marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiVideo size={13} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="h2">Mock Interview Plan</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(roadmap?.mock_interview_plan || []).map((step, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <span className="badge badge-blue" style={{ flexShrink: 0, marginTop: 2, fontFamily: 'var(--font-mono)' }}>W{i + 1}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{step.replace(/^Week \d+: /, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication */}
            {roadmap?.communication_improvement?.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-4" style={{ marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--yellow-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiMessageSquare size={13} style={{ color: 'var(--yellow)' }} />
                  </div>
                  <div className="h2">Communication Tips</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roadmap.communication_improvement.map((tip, i) => (
                    <div key={i} className="flex items-start gap-6">
                      <FiChevronRight size={13} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid g2">
            {/* Skill Gap Tasks */}
            {roadmap?.skill_gap_tasks?.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-4" style={{ marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiCode size={13} style={{ color: 'var(--green)' }} />
                  </div>
                  <div className="h2">Skill Gap Targets</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {roadmap.skill_gap_tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-6">
                      <FiCheck size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coding Practice */}
            <div className="card">
              <div className="flex items-center gap-4" style={{ marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiLayers size={13} style={{ color: 'var(--cyan)' }} />
                </div>
                <div className="h2">Coding Practice</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { cadence: 'Daily',   tip: 'Solve 2–3 LeetCode problems (easy/medium)' },
                  { cadence: 'Weekly',  tip: 'Join one LeetCode or Codeforces contest' },
                  { cadence: 'Monthly', tip: 'Complete one full DSA topic (trees, DP…)' },
                  { cadence: 'Project', tip: 'Build a mini project applying new skills' },
                ].map(({ cadence, tip }) => (
                  <div key={cadence} className="flex items-start gap-6">
                    <span className="badge" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', flexShrink: 0, marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{cadence}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
