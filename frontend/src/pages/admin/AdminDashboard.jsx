import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { adminGetAllEvents, adminGetNearbyFarmers, adminGetPriceSuggestions } from '../../api/api';

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

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session  = JSON.parse(localStorage.getItem('ks_session') || 'null');

  useEffect(() => {
    if (!session || session.role !== 'admin') navigate('/login?role=admin');
  }, []);

  if (!session) return null;
  const admin = session.user;

  const [tab, setTab]           = useState('farmers');
  const [address, setAddress]   = useState('');
  const [radius, setRadius]     = useState(50);
  const [farmers, setFarmers]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [priceSuggs, setPriceSuggs] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState({ msg: '', type: '' });
  const [eventsLoaded, setEL]   = useState(false);
  const [farmersSearched, setFS] = useState(false);
  const [suggsLoaded, setSL]    = useState(false);

  function notify(msg, type = 'success') {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  }

  async function searchFarmers(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminGetNearbyFarmers(address, radius);
      setFarmers(res.data);
      setFS(true);
      if (res.data.length === 0) notify(`No farmers found within ${radius} km.`, 'error');
      else notify(`Found ${res.data.length} nearby farmer(s)!`);
    } catch (err) {
      notify(err?.response?.data?.detail || 'Search failed.', 'error');
    } finally { setLoading(false); }
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await adminGetAllEvents();
      setEvents(res.data);
      setEL(true);
    } catch {
      notify('Could not load events.', 'error');
    } finally { setLoading(false); }
  }

  async function loadPriceSuggestions() {
    setLoading(true);
    try {
      const res = await adminGetPriceSuggestions();
      setPriceSuggs(res.data);
      setSL(true);
    } catch {
      notify('Could not load price suggestions.', 'error');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === 'events' && !eventsLoaded) loadEvents();
    if (tab === 'suggestions' && !suggsLoaded) loadPriceSuggestions();
  }, [tab]);

  const EVENT_COLORS = {
    mela:      { bg: '#fef3c7', color: '#92400e' },
    wedding:   { bg: '#fce7f3', color: '#9d174d' },
    birthday:  { bg: '#ede9fe', color: '#5b21b6' },
    bulk:      { bg: '#dbeafe', color: '#1e40af' },
    corporate: { bg: '#d1fae5', color: '#065f46' },
    other:     { bg: '#f3f4f6', color: '#374151' },
  };

  return (
    <>
      <Navbar role="admin" onLogout={() => { localStorage.removeItem('ks_session'); navigate('/'); }} />
      <div className="page-container">

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', borderRadius: 'var(--radius-xl)', padding: '32px 36px', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🛡️</div>
            <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Admin Portal</h1>
            <p style={{ opacity: .85 }}>Welcome, {admin.name} · Manage the KrishiSeva marketplace</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Farmers Found',    value: farmersSearched ? farmers.length : '—', icon: '🌾' },
              { label: 'Organizer Events', value: eventsLoaded ? events.length : '—', icon: '📋' },
              { label: 'Price Alerts',     value: suggsLoaded ? priceSuggs.length : '—', icon: '💡' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '22px' }}>{s.icon}</div>
                <div style={{ fontSize: '26px', fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: '12px', opacity: .8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert */}
        {status.msg && <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '24px' }}>{status.type === 'error' ? '⚠️' : '✅'} {status.msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', width: 'fit-content', flexWrap: 'wrap' }}>
          {[['farmers', '📍 Nearby Farmers'], ['events', '📋 Organizer Events'], ['suggestions', '💡 Price Suggestions']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-lg)', border: 'none', background: tab === id ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent', color: tab === id ? 'white' : 'var(--gray-500)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── NEARBY FARMERS ── */}
        {tab === 'farmers' && (
          <Section icon="📍" title="Find Nearby Farmers">
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
              Search farmers by location. Admin view includes farm name, address and contact.
            </p>
            <form onSubmit={searchFarmers} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, minWidth: '260px' }}>
                <label>Search Location</label>
                <input placeholder="e.g. Nagpur, Maharashtra" value={address} onChange={e => setAddress(e.target.value)} required />
              </div>
              <div className="form-group" style={{ width: '150px' }}>
                <label>Radius (km)</label>
                <input type="number" min="1" max="500" value={radius} onChange={e => setRadius(e.target.value)} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 20px rgba(139,92,246,.35)' }}>
                {loading ? <><span className="spinner" /> Searching…</> : '🔍 Search Farmers'}
              </button>
            </form>

            {farmersSearched && (
              farmers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌿</div>
                  <p>No farmers found in this area. Try increasing the radius.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {farmers.map(f => (
                    <div key={f.farmer_id} style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{f.name}</h3>
                          {f.farm_name && <p style={{ fontSize: '13px', color: 'var(--green-700)', fontWeight: 600 }}>🌾 {f.farm_name}</p>}
                        </div>
                        <span className="badge badge-green">📍 {f.distance_km} km</span>
                      </div>
                      {f.address && <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '6px' }}>📌 {f.address}</p>}
                      {f.phone   && <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>📞 {f.phone}</p>}
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--green-200)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Farmer ID #{f.farmer_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </Section>
        )}

        {/* ── ORGANIZER EVENTS ── */}
        {tab === 'events' && (
          <Section icon="📋" title="All Organizer Events">
            {loading && !eventsLoaded ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" style={{ borderTopColor: 'var(--green-500)', borderColor: 'var(--gray-200)' }} /></div>
            ) : !eventsLoaded ? (
              <button className="btn btn-outline" onClick={loadEvents}>Load Events</button>
            ) : events.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No organizer events found.</p>
            ) : (
              <>
                <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
                  {events.length} event request{events.length !== 1 ? 's' : ''} found
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {events.map(ev => {
                    const colors = EVENT_COLORS[ev.event_type] || EVENT_COLORS.other;
                    return (
                      <div key={ev.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '20px', background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{ev.title}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>Organizer #{ev.organizer_id}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize', background: colors.bg, color: colors.color }}>
                              {ev.event_type}
                            </span>
                            <span className="badge" style={{ background: '#f0fdf4', color: '#166534' }}>#{ev.id}</span>
                          </div>
                        </div>

                        <p style={{ color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.5 }}>{ev.description}</p>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
                          <span style={{ color: 'var(--gray-600)' }}>📍 <strong>{ev.place}</strong></span>
                          <span style={{ color: 'var(--gray-600)' }}>📦 <strong>{ev.quantity}</strong> units</span>
                          <span style={{ color: 'var(--green-700)' }}>💰 <strong>₹{ev.budget}</strong></span>
                          <span style={{ color: 'var(--gray-600)' }}>📅 By <strong>{formatDate(ev.required_by)}</strong></span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-100)', paddingTop: '8px', marginTop: '2px' }}>
                          Posted on {formatDate(ev.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>
        )}

        {/* ── PRICE SUGGESTIONS ── */}
        {tab === 'suggestions' && (
          <Section icon="💡" title="ML Price Suggestions">
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
              These farmers listed their crops <strong>below the ML-predicted market price</strong>. They've been notified via SMS in their language.
            </p>
            {!suggsLoaded ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" style={{ borderTopColor: '#8b5cf6', borderColor: 'var(--gray-200)' }} /></div>
            ) : priceSuggs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>No under-priced crops detected. All farmers are pricing fairly!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Farmer</th><th>Crop</th><th>Listed ₹</th>
                      <th>Suggested ₹</th><th>Gap ₹</th><th>Region</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceSuggs.map(s => {
                      const gap = (s.predicted_price - s.entered_price).toFixed(2);
                      return (
                        <tr key={s.id}>
                          <td>#{s.id}</td>
                          <td>
                            <strong>{s.farmer_name}</strong>
                            {s.farmer_phone && <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>📞 {s.farmer_phone}</div>}
                          </td>
                          <td><span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{s.product_name}</span></td>
                          <td><span style={{ color: '#dc2626', fontWeight: 700 }}>₹{s.entered_price}</span></td>
                          <td><span style={{ color: '#16a34a', fontWeight: 700 }}>₹{s.predicted_price}</span></td>
                          <td>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
                              +₹{gap}
                            </span>
                          </td>
                          <td>{s.region || '—'}</td>
                          <td style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                            {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {suggsLoaded && (
              <button className="btn btn-outline" onClick={() => { setSL(false); loadPriceSuggestions(); }}
                style={{ marginTop: '16px', fontSize: '13px' }}>🔄 Refresh</button>
            )}
          </Section>
        )}
      </div>
    </>
  );
}
