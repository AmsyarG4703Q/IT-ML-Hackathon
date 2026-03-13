import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { register as registerApi } from '../services/api';

export default function SignupPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await registerApi({ name: form.name, email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ position: 'fixed', top: 18, right: 18 }}>
        {isDark ? <FiEye size={13} /> : <FiEyeOff size={13} />}
        {isDark ? 'Light' : 'Dark'}
      </button>

      <div className="auth-card fade-up">
        <div className="auth-brand">
          <div className="auth-logo"><FiZap size={22} /></div>
          <div className="auth-title">Create your account</div>
          <div className="auth-sub">Start your placement preparation journey</div>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Full name</label>
            <div className="input-wrap">
              <FiUser className="input-icon-left" />
              <input className="input input-icon w-full" type="text" placeholder="Rahul Sharma"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          </div>

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
                type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} required />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(s => !s)}>
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label">Confirm password</label>
            <div className="input-wrap">
              <FiLock className="input-icon-left" />
              <input className="input input-icon w-full" type="password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
