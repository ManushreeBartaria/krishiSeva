import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { createOrganizerRequest, getOrganizerRequests, getAllRequests } from '../../api/api';

function Section({ icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom: '28px' }}>
      <div className="section-heading">
        <div className="icon">{icon}</div>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

const EVENT_TYPES = ['mela', 'birthday', 'wedding', 'bulk', 'corporate', 'other'];

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const session  = JSON.parse(localStorage.getItem('ks_session') || 'null');

  React.useEffect(() => {
    if (!session || session.role !== 'organizer') navigate('/login?role=organizer');
  }, []);

  if (!session) return null;
  const org   = session.user;
  const orgId = org.id;

  const [tab, setTab]         = useState('create');
  const [requests, setReqs]   = useState([]);
  const [allReqs, setAllReqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState({ msg: '', type: '' });
  const [reqsLoaded, setRL]   = useState(false);
  const [allLoaded, setAL]    = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', place: '',
    quantity: '', budget: '', required_by: '', event_type: 'mela',
  });

  function notify(msg, type = 'success') {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4500);
  }

  async function submitRequest(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrganizerRequest({
        organizer_id: orgId,
        title:        form.title,
        description:  form.description,
        place:        form.place,
        quantity:     parseInt(form.quantity),
        budget:       parseFloat(form.budget),
        required_by:  new Date(form.required_by).toISOString(),
        event_type:   form.event_type,
      });
      notify('Request posted successfully! Farmers will see it soon. 📢');
      setForm({ title: '', description: '', place: '', quantity: '', budget: '', required_by: '', event_type: 'mela' });
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to post request.', 'error');
    } finally { setLoading(false); }
  }

  async function loadMyRequests() {
    try {
      const res = await getOrganizerRequests(orgId);
      setReqs(res.data);
      setRL(true);
    } catch { notify('Could not load requests.', 'error'); }
  }

  async function loadAllRequests() {
    try {
      const res = await getAllRequests();
      setAllReqs(res.data);
      setAL(true);
    } catch { notify('Could not load requests.', 'error'); }
  }

  function formatDate(dt) {
    return dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }

  return (
    <>
      <Navbar role="organizer" onLogout={() => { localStorage.removeItem('ks_session'); navigate('/'); }} />
      <div className="page-container">

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, #d97706, #92400e)', borderRadius: 'var(--radius-xl)', padding: '32px 36px', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏢</div>
            <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Hello, {org.name}!</h1>
            <p style={{ opacity: .85 }}>{org.organization_name}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 'var(--radius-lg)', padding: '20px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', opacity: .8, marginBottom: '4px' }}>Organizer ID</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>#{orgId}</div>
          </div>
        </div>

        {/* Alert */}
        {status.msg && <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '24px' }}>{status.type === 'error' ? '⚠️' : '✅'} {status.msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            ['create', '📋 Post Request'],
            ['mine',   '🗂️ My Requests'],
            ['all',    '🌐 All Requests'],
          ].map(([id, label]) => (
            <button key={id}
              onClick={() => { setTab(id); if (id === 'mine') loadMyRequests(); if (id === 'all') loadAllRequests(); }}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-lg)', border: 'none', background: tab === id ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', color: tab === id ? 'white' : 'var(--gray-500)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Post Request Form */}
        {tab === 'create' && (
          <Section icon="📋" title="Post a New Request">
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '580px' }}>
              <div className="form-group"><label>Title</label><input placeholder="e.g. Fresh vegetables for wedding" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="form-group"><label>Description</label><textarea placeholder="Describe what you need in detail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
              <div className="grid-2">
                <div className="form-group"><label>Event Place</label><input placeholder="e.g. Pune, Maharashtra" value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} required /></div>
                <div className="form-group">
                  <label>Event Type</label>
                  <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                    {EVENT_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Quantity (kg / units)</label><input type="number" min="1" placeholder="e.g. 200" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required /></div>
                <div className="form-group"><label>Budget (₹)</label><input type="number" min="0" step="0.01" placeholder="e.g. 15000" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required /></div>
              </div>
              <div className="form-group"><label>Required By</label><input type="datetime-local" value={form.required_by} onChange={e => setForm(f => ({ ...f, required_by: e.target.value }))} required /></div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: 'fit-content', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,.35)' }}>
                {loading ? <><span className="spinner" /> Posting…</> : '📢 Post Request'}
              </button>
            </form>
          </Section>
        )}

        {/* My Requests */}
        {tab === 'mine' && (
          <Section icon="🗂️" title="My Requests">
            {!reqsLoaded ? (
              <button className="btn btn-outline" onClick={loadMyRequests}>Load My Requests</button>
            ) : requests.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No requests posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.map(r => (
                  <div key={r.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--gray-50)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px' }}>{r.title}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge badge-yellow" style={{ textTransform: 'capitalize' }}>{r.event_type}</span>
                        <span className="badge badge-green">#ID {r.id}</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--gray-600)', fontSize: '14px', marginBottom: '10px' }}>{r.description}</p>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--gray-500)' }}>
                      <span>📍 {r.place}</span>
                      <span>📦 {r.quantity} units</span>
                      <span>💰 ₹{r.budget}</span>
                      <span>📅 {formatDate(r.required_by)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* All Requests */}
        {tab === 'all' && (
          <Section icon="🌐" title="All Posted Requests">
            {!allLoaded ? (
              <button className="btn btn-outline" onClick={loadAllRequests}>Load All Requests</button>
            ) : allReqs.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No requests found.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Title</th><th>Place</th><th>Event</th><th>Qty</th><th>Budget ₹</th><th>Required By</th></tr></thead>
                  <tbody>
                    {allReqs.map(r => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td style={{ fontWeight: 600 }}>{r.title}</td>
                        <td>📍 {r.place}</td>
                        <td><span className="badge badge-yellow" style={{ textTransform: 'capitalize' }}>{r.event_type}</span></td>
                        <td>{r.quantity}</td>
                        <td>₹{r.budget}</td>
                        <td>{formatDate(r.required_by)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}
      </div>
    </>
  );
}
