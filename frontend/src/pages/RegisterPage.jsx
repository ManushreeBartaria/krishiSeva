import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { registerFarmer, registerBuyer, registerOrganizer, registerAdmin } from '../api/api';

const ROLE_META = {
  farmer:    { emoji: '🌾', label: 'Farmer',    color: '#22c55e' },
  buyer:     { emoji: '🛒', label: 'Buyer',     color: '#3b82f6' },
  organizer: { emoji: '🏢', label: 'Organizer', color: '#f59e0b' },
  admin:     { emoji: '🛡️', label: 'Admin',     color: '#8b5cf6' },
};

const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
];

function saveUser(role, user, password) {
  const key  = `ks_${role}s`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.push({ ...user, password });
  localStorage.setItem(key, JSON.stringify(list));
}

export default function RegisterPage() {
  const [params] = useSearchParams();
  const initialRole = params.get('role') || 'farmer';
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', farm_name: '', language: 'en',
    organization_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setRole(params.get('role') || 'farmer');
    setError(''); setSuccess('');
  }, [params]);

  const meta = ROLE_META[role] || ROLE_META.farmer;
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      let res;
      if (role === 'farmer') {
        res = await registerFarmer({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address, farm_name: form.farm_name, language: form.language });
      } else if (role === 'buyer') {
        res = await registerBuyer({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address });
      } else if (role === 'organizer') {
        res = await registerOrganizer({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address, organization_name: form.organization_name });
      } else {
        res = await registerAdmin({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      }

      saveUser(role, res.data, form.password);
      setSuccess(`Registration successful! Welcome, ${res.data.name}! Redirecting to login…`);
      setTimeout(() => navigate(`/login?role=${role}`), 2000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '540px' }}>

          {/* Role tabs */}
          <div style={{ display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', gap: '3px', marginBottom: '28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
            {Object.entries(ROLE_META).map(([id, m]) => (
              <button key={id} onClick={() => { setRole(id); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, minWidth: '80px',
                  padding: '9px 6px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: role === id
                    ? (id === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, var(--green-500), var(--green-700))')
                    : 'transparent',
                  color: role === id ? 'white' : 'var(--gray-500)',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all .2s',
                }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          <div className="card slide-up" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '52px', marginBottom: '12px', animation: 'float 3s ease-in-out infinite' }}>{meta.emoji}</div>
              <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Create Account</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '15px' }}>
                Register as a <strong style={{ color: meta.color }}>{meta.label}</strong>
              </p>
            </div>

            {error   && <div className="alert alert-error"   style={{ marginBottom: '18px' }}>⚠️ {error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '18px' }}>✅ {success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2">
                <div className="form-group"><label>Full Name</label><input name="name" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Phone</label><input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} /></div>
              </div>

              <div className="form-group"><label>Email Address</label><input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></div>

              {/* Address — not needed for admin */}
              {role !== 'admin' && (
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" placeholder="Village / City, State" value={form.address} onChange={handleChange} required={role === 'farmer'} />
                </div>
              )}

              {/* Farmer extras */}
              {role === 'farmer' && (
                <div className="grid-2">
                  <div className="form-group"><label>Farm Name</label><input name="farm_name" placeholder="Green Valley Farm" value={form.farm_name} onChange={handleChange} required /></div>
                  <div className="form-group">
                    <label>Language (for SMS)</label>
                    <select name="language" value={form.language} onChange={handleChange}>
                      {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Organizer extras */}
              {role === 'organizer' && (
                <div className="form-group"><label>Organization Name</label><input name="organization_name" placeholder="Sunrise Events Pvt Ltd" value={form.organization_name} onChange={handleChange} required /></div>
              )}

              <div className="grid-2">
                <div className="form-group"><label>Password</label><input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} /></div>
                <div className="form-group"><label>Confirm Password</label><input name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required /></div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{
                  padding: '14px', marginTop: '8px',
                  background: role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : undefined,
                  boxShadow: role === 'admin' ? '0 4px 20px rgba(139,92,246,.35)' : undefined,
                }}>
                {loading ? <><span className="spinner" /> Registering…</> : `Create ${meta.label} Account`}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }}>or</div>
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
              Already have an account?{' '}
              <Link to={`/login?role=${role}`} style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
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
