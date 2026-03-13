import React, { useState, useEffect, useMemo } from 'react';
import { FiExternalLink, FiCheck, FiFilter, FiSearch, FiCode, FiTarget } from 'react-icons/fi';
import { getProfile } from '../services/api';
import { PROBLEMS, TOPICS, ROLE_TOPICS, getProblemsForRole } from '../data/neetcode150';
import Navbar from '../components/Navbar';

const DIFF_COLOR = { Easy: 'var(--green)', Medium: 'var(--yellow)', Hard: 'var(--red)' };
const DIFF_BG    = { Easy: 'var(--green-dim)', Medium: 'var(--yellow-dim)', Hard: 'var(--red-dim)' };

const STORAGE_KEY = 'placement_solved';

function loadSolved() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveSolved(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function CodingPage() {
  const [role, setRole] = useState('Software Engineer');
  const [topicFilter, setTopicFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [solved, setSolved] = useState(loadSolved);
  const [loading, setLoading] = useState(true);

  // Load user's role from profile
  useEffect(() => {
    getProfile()
      .then(r => { if (r.data?.target_role) setRole(r.data.target_role); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Problems filtered by role first, then UI filters
  const roleProblems = useMemo(() => getProblemsForRole(role), [role]);
  const roleTopics = useMemo(() => ['All', ...TOPICS.filter(t => roleProblems.some(p => p.topic === t))], [roleProblems]);

  const visible = useMemo(() => {
    return roleProblems.filter(p => {
      if (topicFilter !== 'All' && p.topic !== topicFilter) return false;
      if (diffFilter !== 'All' && p.diff !== diffFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [roleProblems, topicFilter, diffFilter, search]);

  const toggleSolved = (id) => {
    setSolved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSolved(next);
      return next;
    });
  };

  // Stats
  const total = roleProblems.length;
  const solvedCount = roleProblems.filter(p => solved.has(p.id)).length;
  const easy = roleProblems.filter(p => p.diff === 'Easy').length;
  const medium = roleProblems.filter(p => p.diff === 'Medium').length;
  const hard = roleProblems.filter(p => p.diff === 'Hard').length;
  const easySolved = roleProblems.filter(p => p.diff === 'Easy' && solved.has(p.id)).length;
  const medSolved  = roleProblems.filter(p => p.diff === 'Medium' && solved.has(p.id)).length;
  const hardSolved = roleProblems.filter(p => p.diff === 'Hard' && solved.has(p.id)).length;
  const pct = total ? Math.round(solvedCount / total * 100) : 0;

  const roleOptions = Object.keys(ROLE_TOPICS);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page fade-up">

          {/* Header */}
          <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
            <div>
              <div className="h1">Coding Practice</div>
              <div className="body muted" style={{ marginTop: 3 }}>
                NeetCode 150 — filtered for your target role
              </div>
            </div>
            {/* Role Selector */}
            <div className="flex items-center gap-4">
              <FiTarget size={14} style={{ color: 'var(--text-3)' }} />
              <select
                className="input"
                style={{ width: 220, fontSize: 13 }}
                value={role}
                onChange={e => { setRole(e.target.value); setTopicFilter('All'); }}
              >
                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Progress Cards */}
          <div className="grid g4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total',  count: `${solvedCount}/${total}`, pct, color: 'var(--accent)', bg: 'var(--accent-dim)' },
              { label: 'Easy',   count: `${easySolved}/${easy}`,   pct: easy ? Math.round(easySolved/easy*100) : 0,   color: 'var(--green)',  bg: 'var(--green-dim)' },
              { label: 'Medium', count: `${medSolved}/${medium}`,  pct: medium ? Math.round(medSolved/medium*100) : 0, color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
              { label: 'Hard',   count: `${hardSolved}/${hard}`,   pct: hard ? Math.round(hardSolved/hard*100) : 0,   color: 'var(--red)',    bg: 'var(--red-dim)' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <span className="h3">{s.label}</span>
                  <span className="mono" style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.count}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <div className="caption muted" style={{ marginTop: 5 }}>{s.pct}% complete</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card card-sm" style={{ marginBottom: 14 }}>
            <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
              {/* Search */}
              <div className="input-wrap flex-1" style={{ minWidth: 180 }}>
                <FiSearch className="input-icon-left" />
                <input className="input input-icon w-full" placeholder="Search problems…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-4">
                <FiFilter size={13} style={{ color: 'var(--text-3)' }} />
                {['All','Easy','Medium','Hard'].map(d => (
                  <button key={d} onClick={() => setDiffFilter(d)}
                    className={`chip ${diffFilter === d ? 'selected' : ''}`}
                    style={{ fontSize: 12 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic filter row */}
            <div className="flex" style={{ flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {roleTopics.map(t => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className={`chip ${topicFilter === t ? 'selected' : ''}`}
                  style={{ fontSize: 11 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', width: 40, color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>PROBLEM</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>TOPIC</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>DIFFICULTY</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>STATUS</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>SOLVE</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No problems match the current filter.</td></tr>
                ) : visible.map((p, i) => {
                  const isSolved = solved.has(p.id);
                  return (
                    <tr key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSolved ? 'var(--green-dim)' : 'transparent',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => { if (!isSolved) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSolved ? 'var(--green-dim)' : 'transparent'; }}
                    >
                      <td style={{ padding: '10px 16px', color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: isSolved ? 'var(--green)' : 'var(--text-1)' }}>
                        {p.title}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className="badge badge-gray" style={{ fontSize: 10, fontWeight: 500 }}>{p.topic}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: DIFF_COLOR[p.diff],
                          background: DIFF_BG[p.diff], padding: '2px 8px', borderRadius: 99
                        }}>{p.diff}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleSolved(p.id)}
                          style={{
                            width: 22, height: 22, borderRadius: 4,
                            border: `1.5px solid ${isSolved ? 'var(--green)' : 'var(--border)'}`,
                            background: isSolved ? 'var(--green)' : 'transparent',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                          title="Mark solved"
                        >
                          {isSolved && <FiCheck size={12} color="#fff" />}
                        </button>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                          Open <FiExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', background: 'var(--bg-subtle)' }}>
              Showing {visible.length} of {total} problems for <strong style={{ color: 'var(--accent)' }}>{role}</strong>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
