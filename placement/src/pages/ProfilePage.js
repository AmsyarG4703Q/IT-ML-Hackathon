import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUpload, FiPlus, FiX, FiCheck,
  FiChevronRight, FiChevronLeft, FiAlertCircle
} from 'react-icons/fi';
import { createProfile, uploadResume, runAnalysis } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STEPS = ['Personal Info', 'Technical Skills', 'Experience', 'Self Assessment'];
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical', 'Mechanical', 'Civil', 'Other'];
const ROLES = ['Software Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Machine Learning Engineer', 'Mobile Developer', 'Other'];
const LANGUAGES = ['Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript', 'Go', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'R', 'MATLAB', 'Rust'];
const TECHNOLOGIES = ['React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Git'];

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', tech: '' });

  const [form, setForm] = useState({
    name: '', branch: '', graduation_year: '', target_role: '',
    programming_languages: [], technologies: [],
    leetcode_solved: '', hackerrank_stars: '', codeforces_rating: '',
    projects: [], communication_rating: 7,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, item) => setForm(f => ({
    ...f, [k]: f[k].includes(item) ? f[k].filter(i => i !== item) : [...f[k], item]
  }));

  const addProject = () => {
    if (!newProject.name.trim()) return;
    set('projects', [...form.projects, { ...newProject, tech: newProject.tech.split(',').map(t => t.trim()).filter(Boolean) }]);
    setNewProject({ name: '', description: '', tech: '' });
  };

  const handleFile = async file => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a PDF file'); return; }
    setResumeFile(file); setUploading(true);
    try { 
      const r = await uploadResume(file); 
      setResumeSkills(r.data.extracted_skills || []); 
      
      // Auto-populate projects from resume
      if (r.data.extracted_projects && r.data.extracted_projects.length > 0) {
        setForm(f => {
          // Add the extracted projects to the existing ones, avoiding exact duplicates by name
          const existingNames = new Set(f.projects.map(p => p.name.toLowerCase()));
          const newProjects = r.data.extracted_projects.filter(p => !existingNames.has(p.name.toLowerCase()));
          
          return {
            ...f,
            projects: [...f.projects, ...newProjects.map(p => ({
              name: p.name,
              description: p.description,
              tech: [] // We don't extract tech stack per project yet
            }))]
          };
        });
      }
    }
    catch { /* parsing may fail if backend offline */ }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await createProfile({
        ...form,
        coding_platforms: {
          leetcode_solved: parseInt(form.leetcode_solved) || 0,
          hackerrank_stars: parseFloat(form.hackerrank_stars) || 0,
          codeforces_rating: parseInt(form.codeforces_rating) || 0,
        },
        resume_skills: resumeSkills,
        resume_filename: resumeFile?.name || '',
      });
      await runAnalysis();
      updateUser({ profile_complete: true });
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save. Is the backend running?');
    } finally { setLoading(false); }
  };

  /* ── Step indicator ── */
  const Stepper = () => (
    <div className="flex items-center" style={{ marginBottom: 28, gap: 0 }}>
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex col items-center" style={{ gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? 'var(--green)' : i === step ? 'var(--accent)' : 'var(--surface)',
              color: i <= step ? '#fff' : 'var(--text-3)',
              transition: 'all .25s',
            }}>
              {i < step ? <FiCheck size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', color: i === step ? 'var(--accent)' : i < step ? 'var(--green)' : 'var(--text-3)', letterSpacing: '0.02em' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--border)', margin: '0 6px', marginBottom: 18, transition: 'background .3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  /* ── Chip Selector ── */
  const ChipGroup = ({ label, items, field }) => (
    <div className="field">
      <label className="label">{label}</label>
      <div className="flex" style={{ flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
        {items.map(item => (
          <button key={item} type="button"
            className={`chip ${form[field].includes(item) ? 'selected' : ''}`}
            onClick={() => toggle(field, item)}>
            {form[field].includes(item) && <FiCheck size={10} className="chip-check" />}
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const commLabel = ['', 'Very Poor', 'Poor', 'Below Avg', 'Average', 'Fair', 'Good', 'Very Good', 'Great', 'Excellent', 'Expert'][form.communication_rating] || '';
  const commColor = form.communication_rating >= 8 ? 'var(--green)' : form.communication_rating >= 5 ? 'var(--accent)' : 'var(--yellow)';

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="h1">Build Your Profile</div>
            <div className="body muted" style={{ marginTop: 4 }}>
              Complete all steps so our AI can generate your personalized analysis
            </div>
          </div>

          <div className="card">
            <Stepper />

            {error && <div className="alert alert-error"><FiAlertCircle size={14} /> {error}</div>}

            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid g2" style={{ gap: 14 }}>
                  <div className="field">
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Graduation Year</label>
                    <input className="input" type="number" placeholder="2025" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Branch / Department</label>
                  <select className="input" value={form.branch} onChange={e => set('branch', e.target.value)}>
                    <option value="">Select Branch</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Target Job Role</label>
                  <select className="input" value={form.target_role} onChange={e => set('target_role', e.target.value)}>
                    <option value="">Select Target Role</option>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* ── Step 1: Skills ── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <ChipGroup label="Programming Languages" items={LANGUAGES} field="programming_languages" />
                <ChipGroup label="Technologies & Frameworks" items={TECHNOLOGIES} field="technologies" />
                {(form.programming_languages.length + form.technologies.length) > 0 && (
                  <div className="alert alert-info" style={{ marginBottom: 0 }}>
                    ✓ {form.programming_languages.length + form.technologies.length} skills selected
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Experience ── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Coding Platforms */}
                <div>
                  <div className="h3" style={{ marginBottom: 10 }}>Coding Platforms</div>
                  <div className="grid g3" style={{ gap: 12 }}>
                    {[
                      ['leetcode_solved', '🟡 LeetCode Solved', '150'],
                      ['hackerrank_stars', '⭐ HackerRank Stars', '1-5'],
                      ['codeforces_rating', '🔵 Codeforces Rating', '1400'],
                    ].map(([k, l, p]) => (
                      <div className="field" key={k}>
                        <label className="label" style={{ textTransform: 'none', letterSpacing: 0 }}>{l}</label>
                        <input className="input mono" type="number" placeholder={p} value={form[k]} onChange={e => set(k, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <div className="h3" style={{ marginBottom: 10 }}>Projects</div>
                  {form.projects.map((p, i) => (
                    <div key={i} style={{ padding: '10px 14px', marginBottom: 8, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.description}</div>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                          {p.tech.map(t => <span key={t} className="badge badge-blue">{t}</span>)}
                        </div>
                      </div>
                      <button onClick={() => set('projects', form.projects.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: '2px 4px', marginLeft: 8 }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: 14, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input className="input" placeholder="Project name" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} />
                      <input className="input" placeholder="Brief description" value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} />
                      <input className="input" placeholder="Tech stack (comma-separated): React, Node.js, MongoDB" value={newProject.tech} onChange={e => setNewProject(p => ({ ...p, tech: e.target.value }))} />
                      <button onClick={addProject} className="btn btn-ghost btn-sm" style={{ width: 'fit-content' }}>
                        <FiPlus size={13} /> Add Project
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resume */}
                <div>
                  <div className="h3" style={{ marginBottom: 10 }}>Resume (PDF)</div>
                  <input type="file" ref={fileRef} accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                  <div
                    onClick={() => fileRef.current.click()}
                    style={{
                      border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                      padding: '20px', cursor: 'pointer', textAlign: 'center',
                      background: 'var(--bg-subtle)', transition: 'border-color .18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {resumeFile ? (
                      <div>
                        <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓ {resumeFile.name}</div>
                        {uploading && <div className="muted caption" style={{ marginTop: 4 }}>Extracting skills…</div>}
                        {resumeSkills.length > 0 && <div className="caption" style={{ marginTop: 6, color: 'var(--accent)' }}>{resumeSkills.length} skills detected</div>}
                      </div>
                    ) : (
                      <div>
                        <FiUpload size={22} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Click to upload PDF</div>
                        <div className="caption" style={{ marginTop: 3 }}>Skills will be auto-extracted</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Self Assessment ── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div className="field">
                  <label className="label">Communication Skills</label>
                  <div className="flex items-center gap-6" style={{ marginTop: 8 }}>
                    <input type="range" min={1} max={10} value={form.communication_rating}
                      onChange={e => set('communication_rating', parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: commColor, height: 4 }} />
                    <div style={{ minWidth: 90, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: commColor }}>{form.communication_rating}</span>
                      <span className="muted caption"> /10</span>
                      <div style={{ fontSize: 11, color: commColor, fontWeight: 600, marginTop: 2 }}>{commLabel}</div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 18, border: '1px solid var(--border)' }}>
                  <div className="h3" style={{ marginBottom: 12 }}>Profile Summary</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {[
                        ['Name', form.name || '—'],
                        ['Branch', form.branch || '—'],
                        ['Year', form.graduation_year || '—'],
                        ['Target Role', form.target_role || '—'],
                        ['Languages', form.programming_languages.join(', ') || '—'],
                        ['Technologies', form.technologies.join(', ') || '—'],
                        ['Projects', `${form.projects.length} added`],
                        ['LeetCode', `${form.leetcode_solved || 0} solved`],
                        ['Communication', `${form.communication_rating}/10 (${commLabel})`],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '7px 0', color: 'var(--text-3)', fontWeight: 500, width: 130 }}>{k}</td>
                          <td style={{ padding: '7px 0', color: 'var(--text-1)', fontWeight: 500 }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex justify-between" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {step > 0
                ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}><FiChevronLeft size={14} /> Back</button>
                : <div />}
              {step < 3
                ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next <FiChevronRight size={14} /></button>
                : <button className="btn btn-success" onClick={handleSubmit} disabled={loading} style={{ minWidth: 160 }}>
                    {loading ? 'Analyzing…' : '⚡ Analyze My Profile'}
                  </button>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
