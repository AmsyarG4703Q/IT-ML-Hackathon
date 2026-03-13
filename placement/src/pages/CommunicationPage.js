import React, { useState, useRef, useEffect } from 'react';
import {
  FiMic, FiMicOff, FiRefreshCw, FiCheck, FiAlertCircle,
  FiTrendingUp, FiMessageSquare, FiClock, FiZap
} from 'react-icons/fi';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';

/* ── Prompts ─────────────────────────────────────────────── */
const PROMPTS = [
  { id: 1, label: 'Self Introduction',      text: 'Tell me about yourself — your background, skills, and what you are looking for in your next role.' },
  { id: 2, label: 'Strengths & Weaknesses', text: 'What are your greatest strengths? Also, describe one weakness and how you are actively working to improve it.' },
  { id: 3, label: 'Why This Company?',      text: 'Why do you want to work at this company, and why are you the best fit for this position?' },
  { id: 4, label: 'Problem-Solving',        text: 'Describe a challenging problem you faced in a project and walk me through how you solved it step by step.' },
  { id: 5, label: 'Teamwork & Leadership',  text: 'Tell me about a time you worked in a team under pressure. What was your role and what was the outcome?' },
  { id: 6, label: 'Career Goals',           text: 'Where do you see yourself five years from now, and how does this role align with your long-term career goals?' },
  { id: 7, label: 'Free Practice',          text: 'Speak freely on any topic for at least 60 seconds. Focus on clarity and confidence.' },
];

const FILLERS = ['um','uh','like','basically','literally','actually','you know','i mean','sort of','kind of','right','okay','so yeah','well'];

/* ── Analysis ───────────────────────────────────────────── */
function analyzeTranscript(text, durationSec) {
  if (!text || text.trim().length < 5) return null;
  const words  = text.trim().split(/\s+/).filter(Boolean);
  const wc     = words.length;
  const sents  = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  const wpm    = durationSec > 5 ? Math.round((wc / durationSec) * 60) : 0;
  const lc     = text.toLowerCase();
  const fillerHits = {};
  let totalFillers = 0;
  FILLERS.forEach(f => {
    const n = (lc.match(new RegExp(`\\b${f}\\b`, 'gi')) || []).length;
    if (n > 0) { fillerHits[f] = n; totalFillers += n; }
  });
  const pace       = !wpm ? 60 : Math.max(0, Math.min(100, Math.round(100 - Math.abs(wpm - 130) * 0.75)));
  const fillerScore= Math.max(0, 100 - totalFillers * 12);
  const vocabulary = Math.min(100, Math.round((unique.size / Math.max(wc, 1)) * 180));
  const fluency    = sents.length > 1 ? Math.min(100, Math.round((sents.length / (wc / 20)) * 80)) : 50;
  const confidence = Math.round(pace * 0.25 + fillerScore * 0.35 + vocabulary * 0.25 + fluency * 0.15);
  return { wordCount: wc, wpm, sentences: sents.length, uniqueWords: unique.size, totalFillers, fillerHits, pace, fillerScore, vocabulary, fluency, confidence, text };
}

/* ── Score Ring ─────────────────────────────────────────── */
function ScoreRing({ score, label, size = 86 }) {
  const R = size * 0.38, C = 2 * Math.PI * R;
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--accent)' : 'var(--yellow)';
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="var(--surface)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={C} strokeDashoffset={C - (score / 100) * C} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill="var(--text-1)"
          fontSize={size*0.18} fontWeight={800} fontFamily="Inter,sans-serif">{score}</text>
      </svg>
      <div className="caption muted" style={{ marginTop: 3 }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function CommunicationPage() {
  const [prompt,    setPrompt]    = useState(PROMPTS[0]);
  const [recording, setRecording] = useState(false);
  const [liveText,  setLiveText]  = useState('');
  const [report,    setReport]    = useState(null);
  const [elapsed,   setElapsed]   = useState(0);
  const [error,     setError]     = useState('');
  const [supported, setSupported] = useState(true);
  const [sessions,  setSessions]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('comm_sessions_v2') || '[]'); } catch { return []; }
  });

  const recogRef   = useRef(null);
  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const finalRef   = useRef('');   // accumulates final chunks

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
    return () => {
      recogRef.current?.abort();
      clearInterval(timerRef.current);
    };
  }, []);

  /* ── Start ──────────────────────────────────────────────── */
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported. Use Chrome or Edge.'); return; }

    setError(''); setReport(null); setLiveText(''); setElapsed(0);
    finalRef.current = '';

    const sr = new SR();
    sr.continuous      = true;
    sr.interimResults  = true;
    sr.lang            = 'en-US';

    sr.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setLiveText(finalRef.current + interim);
    };

    sr.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone access denied.');
      else if (e.error !== 'no-speech') setError(`Error: ${e.error}`);
    };

    sr.onend = () => {
      // Don't auto-restart — user stopped intentionally
      clearInterval(timerRef.current);
    };

    sr.start();
    recogRef.current = sr;
    startRef.current = Date.now();
    setRecording(true);

    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
  };

  /* ── Stop ───────────────────────────────────────────────── */
  const stopRecording = () => {
    clearInterval(timerRef.current);
    recogRef.current?.stop();
    setRecording(false);

    const duration = Math.floor((Date.now() - startRef.current) / 1000);

    // Small delay to let last SR result fire
    setTimeout(() => {
      const text = finalRef.current.trim();
      if (!text) { setError('No speech detected. Try again.'); return; }

      const result = analyzeTranscript(text, duration);
      setReport(result);
      if (result) {
        const s = { promptLabel: prompt.label, ...result, duration, date: new Date().toISOString() };
        setSessions(prev => {
          const u = [s, ...prev].slice(0, 10);
          localStorage.setItem('comm_sessions_v2', JSON.stringify(u));
          return u;
        });
      }
    }, 400);
  };

  const reset = () => {
    setReport(null); setLiveText(''); setError(''); setElapsed(0);
    finalRef.current = '';
  };

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const radarData = report ? [
    { skill: 'Pace',       value: report.pace        },
    { skill: 'Clarity',    value: report.fillerScore },
    { skill: 'Vocabulary', value: report.vocabulary  },
    { skill: 'Fluency',    value: report.fluency     },
    { skill: 'Confidence', value: report.confidence  },
  ] : [];

  const tips = report ? [
    report.wpm < 90   && { t:'warn', tx:'Speak a bit faster — aim for 110–160 WPM for confident delivery.' },
    report.wpm > 180  && { t:'warn', tx:'You are speaking too fast. Slow down and pause between key points.' },
    report.totalFillers > 4 && { t:'err', tx:`Replace fillers (especially "${Object.keys(report.fillerHits)[0]}") with a confident pause.` },
    report.vocabulary < 50 && { t:'warn', tx:'Vary your vocabulary — avoid repeating the same words.' },
    report.sentences < 4   && { t:'warn', tx:'Elaborate more — use the STAR method: Situation, Task, Action, Result.' },
    report.confidence >= 75 && { t:'ok', tx:'Great delivery! Your answer sounds confident and well-structured.' },
    report.totalFillers === 0 && { t:'ok', tx:'Zero filler words detected — your speech is very clean.' },
    report.wpm >= 110 && report.wpm <= 160 && { t:'ok', tx:'Your speaking pace is ideal for interview settings.' },
  ].filter(Boolean) : [];
  const TIP_BG   = { ok:'var(--green-dim)',  warn:'var(--yellow-dim)', err:'var(--red-dim)' };
  const TIP_ICON = { ok:'✓', warn:'→', err:'⚠' };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page fade-up">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div className="h1">Communication Practice</div>
            <div className="body muted" style={{ marginTop: 3 }}>
              Speak your answer — AI analyzes pace, clarity, vocabulary &amp; confidence
            </div>
          </div>

          {!supported && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <FiAlertCircle size={14} />
              Speech recognition requires <strong>Chrome</strong> or <strong>Edge</strong>.
            </div>
          )}

          <div className="grid g2" style={{ gap: 20 }}>

            {/* ── Left Column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Question Selector */}
              <div className="card card-sm">
                <div className="h3" style={{ marginBottom: 10 }}>Select a Question</div>
                {PROMPTS.map(p => (
                  <button key={p.id}
                    disabled={recording}
                    onClick={() => { setPrompt(p); reset(); }}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                      marginBottom: 5, textAlign: 'left', fontSize: 13, cursor: recording ? 'not-allowed' : 'pointer',
                      background: prompt.id === p.id ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${prompt.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
                      color: prompt.id === p.id ? 'var(--accent)' : 'var(--text-2)',
                      fontWeight: prompt.id === p.id ? 600 : 400,
                      opacity: recording ? .6 : 1, transition: 'all .15s',
                    }}>
                    {prompt.id === p.id && <FiCheck size={11} style={{ marginRight: 5 }} />}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Question Text */}
              <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                <div className="h3" style={{ marginBottom: 8 }}>Your Question</div>
                <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-2)' }}>{prompt.text}</div>
              </div>

              {/* Recorder Card */}
              <div className="card" style={{ textAlign: 'center' }}>

                {/* Timer */}
                <div className="mono" style={{
                  fontSize: 36, fontWeight: 800, letterSpacing: 3, marginBottom: 12,
                  color: recording ? 'var(--red)' : 'var(--text-4)',
                }}>
                  {fmtTime(elapsed)}
                </div>

                {/* Mic Button — pulse div has pointerEvents:none so it never blocks clicks */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                  {recording && (
                    <div style={{
                      position: 'absolute', inset: -14, borderRadius: '50%',
                      background: 'var(--red)', opacity: .12,
                      animation: 'pulse 1.2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={!supported}
                    style={{
                      position: 'relative', zIndex: 1,
                      width: 76, height: 76, borderRadius: '50%', border: 'none',
                      cursor: supported ? 'pointer' : 'not-allowed',
                      background: recording ? 'var(--red)' : 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                      boxShadow: recording
                        ? '0 4px 24px rgba(239,68,68,.45)'
                        : '0 4px 20px rgba(45,107,239,.38)',
                    }}>
                    {recording
                      ? <FiMicOff size={28} color="#fff" />
                      : <FiMic    size={28} color="#fff" />}
                  </button>
                </div>

                {/* Dedicated Stop button — extra reliability */}
                {recording && (
                  <div style={{ marginBottom: 10 }}>
                    <button onClick={stopRecording}
                      style={{
                        padding: '6px 18px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--red)', color: '#fff', border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                      <FiMicOff size={12} /> Stop Recording
                    </button>
                  </div>
                )}

                {/* Status */}
                <div style={{
                  fontSize: 13, fontWeight: recording ? 600 : 400,
                  color: recording ? 'var(--red)' : 'var(--text-3)',
                }}>
                  {recording ? '🔴 Recording… click mic or button to stop' : (report ? '✓ Analysis complete' : 'Click mic to start')}
                </div>

                <div className="flex items-center justify-center gap-4" style={{ marginTop: 8 }}>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>
                    <FiZap size={9} /> Web Speech API
                  </span>
                  <span className="caption muted">Free · No key needed</span>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert alert-error" style={{ marginTop: 14, textAlign: 'left', fontSize: 12 }}>
                    <FiAlertCircle size={13} /> {error}
                  </div>
                )}

                {/* Live Transcript */}
                {(recording || liveText) && (
                  <div style={{
                    marginTop: 16, padding: 14,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', textAlign: 'left',
                    minHeight: 80, maxHeight: 200, overflowY: 'auto',
                  }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <span className="caption" style={{ color: 'var(--text-3)' }}>
                        {recording ? '🎙 Live transcript' : '✓ Final transcript'}
                      </span>
                      {recording && (
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                          background: 'var(--red)', animation: 'pulse 1s infinite',
                        }} />
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {liveText || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Start speaking — text appears here…</span>}
                    </p>
                  </div>
                )}

                {report && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={reset}>
                    <FiRefreshCw size={12} /> Try Again
                  </button>
                )}
              </div>
            </div>

            {/* ── Right Column: Analysis ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!report ? (
                <div className="card" style={{ textAlign: 'center', padding: 52 }}>
                  <FiMessageSquare size={38} style={{ color: 'var(--text-4)', margin: '0 auto 14px' }} />
                  <div className="h2" style={{ color: 'var(--text-3)' }}>Analysis appears here</div>
                  <div className="body muted" style={{ marginTop: 5, fontSize: 13 }}>
                    Select a question → press mic → speak → stop to get your full report
                  </div>
                </div>
              ) : <>

                {/* Score Rings */}
                <div className="card">
                  <div className="h2" style={{ marginBottom: 16 }}>📊 Analysis Report</div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
                    <ScoreRing score={report.confidence}  label="Confidence" />
                    <ScoreRing score={report.pace}        label="Pace" />
                    <ScoreRing score={report.fillerScore} label="Clarity" />
                    <ScoreRing score={report.vocabulary}  label="Vocabulary" />
                  </div>
                </div>

                {/* Radar */}
                <div className="card">
                  <div className="h2" style={{ marginBottom: 4 }}>Skill Radar</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                      <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid g2" style={{ gap: 10 }}>
                  {[
                    { icon: FiClock,        label: 'Words / Min',  val: report.wpm,         color: 'var(--accent)',  note: report.wpm >= 110 && report.wpm <= 160 ? '✓ Ideal' : report.wpm < 80 ? 'Too slow' : 'Too fast' },
                    { icon: FiZap,          label: 'Word Count',   val: report.wordCount,   color: 'var(--purple)', note: `${report.sentences} sentences` },
                    { icon: FiTrendingUp,   label: 'Unique Words', val: report.uniqueWords, color: 'var(--green)',  note: `${Math.round(report.uniqueWords / Math.max(report.wordCount, 1) * 100)}% diversity` },
                    { icon: FiAlertCircle,  label: 'Filler Words', val: report.totalFillers, color: report.totalFillers > 4 ? 'var(--red)' : 'var(--yellow)', note: report.totalFillers === 0 ? 'None ✓' : `"${Object.keys(report.fillerHits)[0]}" top filler` },
                  ].map(s => (
                    <div className="stat-card" key={s.label} style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-4" style={{ marginBottom: 5 }}>
                        <s.icon size={13} style={{ color: s.color }} />
                        <span className="caption" style={{ color: 'var(--text-3)' }}>{s.label}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div className="caption muted" style={{ marginTop: 3 }}>{s.note}</div>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div className="h2" style={{ marginBottom: 12 }}>💡 Personalized Feedback</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-6" style={{
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        background: TIP_BG[tip.t], fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                      }}>
                        <span style={{ flexShrink: 0, marginTop: 2 }}>{TIP_ICON[tip.t]}</span>{tip.tx}
                      </div>
                    ))}
                  </div>
                </div>
              </>}

              {/* Session History */}
              {sessions.length > 0 && (
                <div className="card card-sm">
                  <div className="h3" style={{ marginBottom: 10 }}>Recent Sessions</div>
                  {sessions.slice(0, 6).map((s, i) => (
                    <div key={i} className="flex justify-between items-center" style={{
                      fontSize: 12, padding: '6px 8px', background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-xs)', marginBottom: 5,
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.promptLabel}</span>
                        <span className="muted" style={{ marginLeft: 8 }}>{s.wordCount} words · {s.wpm} WPM</span>
                      </div>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: s.confidence >= 70 ? 'var(--green)' : 'var(--yellow)' }}>
                        {s.confidence}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.1)} }
      `}</style>
    </div>
  );
}
