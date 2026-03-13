import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import {
  FiRefreshCw, FiExternalLink, FiCode, FiLayers, FiMessageSquare,
  FiTrendingUp, FiAlertCircle, FiChevronRight,
} from 'react-icons/fi';
import { getDashboardData, runAnalysis } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ── Animated SVG Score Ring ── */
function ScoreRing({ score }) {
  const R = 56, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;
  const color = score >= 75 ? '#00b86b' : score >= 50 ? '#2d6bef' : score >= 25 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Developing' : 'Needs Work';
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={150} height={150} viewBox="0 0 150 150">
        <circle cx={75} cy={75} r={R} fill="none" stroke="var(--surface)" strokeWidth={10} />
        <circle cx={75} cy={75} r={R} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={C} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 75 75)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
        <text x={75} y={68} textAnchor="middle" fill="var(--text-1)" fontSize={28} fontWeight={800} fontFamily="Inter,sans-serif">{score}</text>
        <text x={75} y={84} textAnchor="middle" fill="var(--text-3)" fontSize={10} fontFamily="Inter,sans-serif">/100</text>
        <text x={75} y={100} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily="Inter,sans-serif">{label}</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginTop: 2 }}>Placement Readiness</div>
    </div>
  );
}

/* ── Custom Tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{payload[0].value}</div>
    </div>
  );
};

const GAP_COLORS = ['#ef4444','#f59e0b','#2d6bef','#7c3aed','#06b6d4'];

/* ── Quick Action Card ── */
function ActionCard({ icon: Icon, title, subtitle, color, bg, badge, onClick }) {
  return (
    <div onClick={onClick} className="card card-hover" style={{
      cursor: 'pointer', padding: '18px 20px',
      borderTop: `3px solid ${color}`,
    }}>
      <div className="flex justify-between items-start" style={{ marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }} />
        </div>
        {badge && <span className="badge" style={{ background: bg, color }}>{badge}</span>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>{subtitle}</div>
      <div className="flex items-center gap-2" style={{ color, fontSize: 12, fontWeight: 600 }}>
        Start Practice <FiChevronRight size={12} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { setData((await getDashboardData()).data); }
    catch { setError('Could not load dashboard — make sure the backend is running on port 5000.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reanalyze = async () => {
    setReanalyzing(true);
    try { await runAnalysis(); await load(); } catch { setError('Re-analysis failed.'); }
    finally { setReanalyzing(false); }
  };

  if (loading) return (
    <div className="app-shell">
      <Navbar />
      <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 14px' }} />
          <div className="muted" style={{ fontSize: 13 }}>Loading your dashboard…</div>
        </div>
      </main>
    </div>
  );

  const radarData = data?.skill_breakdown
    ? Object.entries(data.skill_breakdown).map(([s, v]) => ({ subject: s.replace(' ', '\n'), value: v, full: 100 }))
    : [];
  const barData = data?.interview_readiness
    ? Object.entries(data.interview_readiness).filter(([k]) => k !== 'overall')
        .map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: v }))
    : [];

  const STATS = [
    { label: 'Languages', value: data?.stats?.languages_known ?? 0, icon: FiCode, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'Technologies', value: data?.stats?.technologies_known ?? 0, icon: FiLayers, color: 'var(--purple)', bg: 'var(--purple-dim)' },
    { label: 'Projects', value: data?.stats?.projects_count ?? 0, icon: FiTrendingUp, color: 'var(--green)', bg: 'var(--green-dim)' },
    { label: 'Communication', value: `${data?.stats?.communication_score ?? 0}/10`, icon: FiMessageSquare, color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
  ];

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page fade-up">

          {/* Header */}
          <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
            <div>
              <div className="h1">
                {data?.profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Hey'}&nbsp;👋
              </div>
              <div className="body muted" style={{ marginTop: 3 }}>
                {data?.profile?.target_role || 'Software Engineer'}
                {data?.profile?.branch ? ` · ${data.profile.branch}` : ''}
                {data?.profile?.graduation_year ? ` · Class of ${data.profile.graduation_year}` : ''}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={reanalyze} disabled={reanalyzing}>
              <FiRefreshCw size={13} style={{ animation: reanalyzing ? 'spin .7s linear infinite' : 'none' }} />
              {reanalyzing ? 'Re-analyzing…' : 'Re-Analyze'}
            </button>
          </div>

          {error && <div className="alert alert-error"><FiAlertCircle size={14} />{error}</div>}

          {/* Stats row */}
          <div className="grid g4" style={{ marginBottom: 20 }}>
            {STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div className="stat-card" key={label}>
                <div className="stat-icon-wrap" style={{ background: bg }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="stat-num mono" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid g2" style={{ marginBottom: 20 }}>
            <ActionCard
              icon={FiCode} title="Coding Practice" color="var(--accent)" bg="var(--accent-dim)"
              badge={`${data?.skill_gaps?.length ? data.skill_gaps.length + ' gaps' : 'Start'}`}
              subtitle={`NeetCode 150 filtered for ${data?.profile?.target_role || 'your role'}. Track your progress problem by problem.`}
              onClick={() => navigate('/coding')}
            />
            <ActionCard
              icon={FiMessageSquare} title="Communication Practice" color="var(--purple)" bg="var(--purple-dim)"
              badge={data?.stats?.communication_score < 7 ? 'Needs Work' : 'Continue'}
              subtitle="Speak your answer aloud — AI analyzes pace, filler words, vocabulary & confidence in real time."
              onClick={() => navigate('/communication')}
            />
          </div>

          {/* Score + Radar */}
          <div className="grid g2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <div>
                  <div className="h2">AI Score</div>
                  <div className="caption muted" style={{ marginTop: 2 }}>Overall placement readiness</div>
                </div>
                <span className="badge" style={{
                  fontSize: 12, padding: '4px 10px',
                  background: data?.score >= 75 ? 'var(--green-dim)' : data?.score >= 50 ? 'var(--accent-dim)' : 'var(--yellow-dim)',
                  color: data?.score >= 75 ? 'var(--green)' : data?.score >= 50 ? 'var(--accent)' : 'var(--yellow)',
                }}>
                  {data?.score >= 75 ? 'Strong' : data?.score >= 50 ? 'Good' : 'Developing'}
                </span>
              </div>
              <ScoreRing score={data?.score || 0} />
              {data?.resume_feedback && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, borderLeft: '3px solid var(--accent)' }}>
                  {data.resume_feedback}
                </div>
              )}
            </div>

            <div className="card">
              <div className="h2" style={{ marginBottom: 4 }}>Skill Breakdown</div>
              <div className="caption muted" style={{ marginBottom: 8 }}>Radar overview across dimensions</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar + Line */}
          <div className="grid g2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="h2" style={{ marginBottom: 4 }}>Interview Readiness</div>
              <div className="caption muted" style={{ marginBottom: 12 }}>Readiness per dimension (0–100)</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={barData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--surface)' }} />
                  <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d6bef" /><stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" fill="url(#bg)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="h2" style={{ marginBottom: 4 }}>Progress Trend</div>
              <div className="caption muted" style={{ marginBottom: 12 }}>Readiness score over time</div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={data?.weekly_progress || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Gaps + Recommended Roles */}
          <div className="grid g2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="h2" style={{ marginBottom: 16 }}>Skill Gaps</div>
              {!(data?.skill_gaps?.length) ? (
                <div className="alert alert-success" style={{ marginBottom: 0 }}>✓ No critical gaps found!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.skill_gaps.map((gap, i) => {
                    const pct = Math.max(10, 100 - i * 14);
                    return (
                      <div key={gap}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{gap}</span>
                          <span className="mono caption" style={{ color: GAP_COLORS[i % GAP_COLORS.length] }}>{pct}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: GAP_COLORS[i % GAP_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div className="h2" style={{ marginBottom: 16 }}>Recommended Roles</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(data?.recommended_roles || []).map((role, i) => (
                  <div key={role} className="flex items-center gap-6" style={{
                    padding: '9px 14px', background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: GAP_COLORS[i % GAP_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{role}</span>
                    {i === 0 && <span className="badge badge-green">Best Match</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Resources */}
          <div className="card">
            <div className="h2" style={{ marginBottom: 16 }}>Learning Resources</div>
            <div className="grid g3">
              {(data?.learning_resources || []).map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="card card-sm card-hover"
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textDecoration: 'none', padding: '12px 14px' }}>
                  <FiExternalLink size={13} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4 }}>{r.title}</div>
                    <span className="badge badge-gray" style={{ marginTop: 5 }}>{r.type}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
