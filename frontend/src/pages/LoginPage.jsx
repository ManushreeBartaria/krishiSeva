import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ROLE_META = {
  farmer:    { emoji: '🌾', label: 'Farmer',    color: '#22c55e' },
  buyer:     { emoji: '🛒', label: 'Buyer',     color: '#3b82f6' },
  organizer: { emoji: '🏢', label: 'Organizer', color: '#f59e0b' },
  admin:     { emoji: '🛡️', label: 'Admin',     color: '#8b5cf6' },
};

function findUser(role, email, password) {
  const key  = `ks_${role}s`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  return list.find(u => u.email === email && u.password === password) || null;
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const initialRole = params.get('role') || 'farmer';
  const [role, setRole]     = useState(initialRole);
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  useEffect(() => { setRole(params.get('role') || 'farmer'); }, [params]);

  const meta = ROLE_META[role] || ROLE_META.farmer;
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = findUser(role, form.email, form.password);
      if (!user) { setError('Invalid email or password. Please register first.'); return; }
      localStorage.setItem('ks_session', JSON.stringify({ role, user }));
      navigate(`/dashboard/${role}`);
    } catch { setError('Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const tabGradient = (id) => {
    if (id === 'admin') return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
    return 'linear-gradient(135deg, var(--green-500), var(--green-700))';
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          {/* Role tabs */}
          <div style={{ display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', gap: '3px', marginBottom: '28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
            {Object.entries(ROLE_META).map(([id, m]) => (
              <button key={id} onClick={() => { setRole(id); setError(''); }}
                style={{
                  flex: 1, minWidth: '80px',
                  padding: '9px 6px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: role === id ? tabGradient(id) : 'transparent',
                  color: role === id ? 'white' : 'var(--gray-500)',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all .2s',
                }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          <div className="card slide-up" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '56px', marginBottom: '12px', animation: 'float 3s ease-in-out infinite' }}>{meta.emoji}</div>
              <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Welcome back</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '15px' }}>
                Sign in as a <strong style={{ color: meta.color }}>{meta.label}</strong>
              </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group"><label htmlFor="email">Email Address</label><input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></div>
              <div className="form-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} required /></div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{
                  marginTop: '8px', padding: '14px',
                  background: role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : undefined,
                  boxShadow: role === 'admin' ? '0 4px 20px rgba(139,92,246,.35)' : undefined,
                }}>
                {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }}>or</div>
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
              Don't have an account?{' '}
              <Link to={`/register?role=${role}`} style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/" style={{ color: 'var(--gray-400)', fontSize: '13px', textDecoration: 'none' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
