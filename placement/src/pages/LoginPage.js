import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login as loginApi } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.profile_complete ? '/dashboard' : '/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-sm"
        style={{ position: 'fixed', top: 18, right: 18 }}
      >
        {isDark ? <FiEye size={13} /> : <FiEyeOff size={13} />}
        {isDark ? 'Light' : 'Dark'}
      </button>

      <div className="auth-card fade-up">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo"><FiZap size={22} /></div>
          <div className="auth-title">Welcome back</div>
          <div className="auth-sub">Sign in to your PlacementAI account</div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email address</label>
            <div className="input-wrap">
              <FiMail className="input-icon-left" />
              <input className="input input-icon w-full" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="input-wrap">
              <FiLock className="input-icon-left" />
              <input className="input input-icon w-full" style={{ paddingRight: 36 }}
                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} required />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(s => !s)}>
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="divider-text" style={{ margin: '16px 0', fontSize: 11 }}>OR</div>

        <button
          onClick={() => setForm({ email: 'arjun@example.com', password: 'password123' })}
          className="btn btn-ghost btn-full"
          style={{ fontSize: 13 }}
        >
          <FiZap size={13} /> Use Demo Account
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
