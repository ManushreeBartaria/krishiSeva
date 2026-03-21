import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  addFoodProduct, addCraftProduct, getFarmerOrders,
  getFarmerProducts, updateFoodPrice,
} from '../../api/api';

const UPLOADS_BASE = 'http://127.0.0.1:8000';

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

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const session  = JSON.parse(localStorage.getItem('ks_session') || 'null');

  useEffect(() => {
    if (!session || session.role !== 'farmer') navigate('/login?role=farmer');
  }, []);

  if (!session) return null;

  const farmer   = session.user;
  const farmerId = farmer.id;

  // ── State ──
  const [food, setFood]             = useState({ name: '', price: '', quantity: '' });
  const [craft, setCraft]           = useState({ name: '', price: '', description: '' });
  const [craftImage, setCraftImg]   = useState(null);
  const [craftVideo, setCraftVid]   = useState(null);
  const [orders, setOrders]         = useState([]);
  const [myFoodProds, setMyFood]    = useState([]);
  const [myCraftProds, setMyCraft]  = useState([]);
  const [myProdsLoaded, setMPL]     = useState(false);
  const [tab, setTab]               = useState('food');
  const [status, setStatus]         = useState({ msg: '', type: '' });
  const [loading, setLoading]       = useState(false);
  const [ordersLoaded, setOL]       = useState(false);
  // inline price editor state: { [productId]: newPrice }
  const [editPrices, setEditPrices] = useState({});
  const [editingId, setEditingId]   = useState(null);

  function notify(msg, type = 'success') {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 5000);
  }

  // ── Add Food Product ──
  async function submitFood(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await addFoodProduct(farmerId, {
        name: food.name, price: parseFloat(food.price), quantity: food.quantity,
      });
      notify('Food product added! If price is below market value, you\'ll receive an SMS alert. 🌽');
      setFood({ name: '', price: '', quantity: '' });
      setMPL(false); // reset so products refresh on next view
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to add food product.', 'error');
    } finally { setLoading(false); }
  }

  // ── Add Craft Product ──
  async function submitCraft(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', craft.name);
      fd.append('price', craft.price);
      fd.append('description', craft.description);
      if (craftImage) fd.append('image', craftImage);
      if (craftVideo) fd.append('video', craftVideo);
      await addCraftProduct(farmerId, fd);
      notify('Craft product added successfully! 🏺');
      setCraft({ name: '', price: '', description: '' });
      setCraftImg(null); setCraftVid(null);
      setMPL(false);
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to add craft product.', 'error');
    } finally { setLoading(false); }
  }

  // ── Load Orders ──
  async function loadOrders() {
    try {
      const res = await getFarmerOrders(farmerId);
      setOrders(res.data);
      setOL(true);
    } catch { notify('Could not load orders.', 'error'); }
  }

  // ── Load My Products ──
  async function loadMyProducts() {
    try {
      const res = await getFarmerProducts(farmerId);
      setMyFood(res.data.food || []);
      setMyCraft(res.data.craft || []);
      setMPL(true);
    } catch { notify('Could not load your products.', 'error'); }
  }

  useEffect(() => {
    if (tab === 'orders' && !ordersLoaded) loadOrders();
    if (tab === 'myproducts' && !myProdsLoaded) loadMyProducts();
  }, [tab]);

  // ── Edit Food Price ──
  async function savePrice(productId) {
    const newPrice = parseFloat(editPrices[productId]);
    if (!newPrice || newPrice <= 0) { notify('Enter a valid price.', 'error'); return; }
    try {
      await updateFoodPrice(productId, newPrice);
      notify(`Price updated to ₹${newPrice} ✅`);
      setEditingId(null);
      // update local list
      setMyFood(prev => prev.map(p => p.id === productId ? { ...p, price: newPrice } : p));
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to update price.', 'error');
    }
  }

  const STATUS_COLORS = { pending: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' };

  return (
    <>
      <Navbar role="farmer" onLogout={() => { localStorage.removeItem('ks_session'); navigate('/'); }} />
      <div className="page-container">

        {/* Welcome Banner */}
        <div style={{ background: 'linear-gradient(135deg, var(--green-600), var(--green-800))', borderRadius: 'var(--radius-xl)', padding: '32px 36px', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌾</div>
            <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Hello, {farmer.name}!</h1>
            <p style={{ opacity: .85, fontSize: '15px' }}>{farmer.farm_name} · {farmer.address}</p>
            <p style={{ opacity: .7, fontSize: '13px', marginTop: '6px' }}>
              📊 Price prediction active · You'll receive SMS alerts when your crop price is below market rate
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 'var(--radius-lg)', padding: '20px 28px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: '13px', opacity: .8, marginBottom: '4px' }}>Farmer ID</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>#{farmerId}</div>
          </div>
        </div>

        {/* Alert */}
        {status.msg && (
          <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '24px' }}>
            {status.type === 'error' ? '⚠️' : '✅'} {status.msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            ['food',       '🌽 Add Food'],
            ['craft',      '🏺 Add Craft'],
            ['myproducts', '📋 My Products'],
            ['orders',     '📦 My Orders'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '10px 18px', borderRadius: 'var(--radius-lg)', border: 'none', background: tab === id ? 'linear-gradient(135deg, var(--green-500), var(--green-700))' : 'transparent', color: tab === id ? 'white' : 'var(--gray-500)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ADD FOOD */}
        {tab === 'food' && (
          <Section icon="🌽" title="Add Food Product">
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '18px' }}>
              💡 After adding, the ML model checks your price against weather-adjusted market rates. If it's low, you'll receive an SMS in your language with the suggested price.
            </p>
            <form onSubmit={submitFood} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '520px' }}>
              <div className="form-group"><label>Product Name</label><input placeholder="e.g. Organic Tomatoes" value={food.name} onChange={e => setFood(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="grid-2">
                <div className="form-group"><label>Price (₹)</label><input type="number" min="0" step="0.01" placeholder="₹ per unit" value={food.price} onChange={e => setFood(f => ({ ...f, price: e.target.value }))} required /></div>
                <div className="form-group"><label>Quantity / Unit</label><input placeholder="e.g. 5 kg, 1 dozen" value={food.quantity} onChange={e => setFood(f => ({ ...f, quantity: e.target.value }))} /></div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: 'fit-content' }}>
                {loading ? <><span className="spinner" /> Adding…</> : '+ Add Food Product'}
              </button>
            </form>
          </Section>
        )}

        {/* ADD CRAFT */}
        {tab === 'craft' && (
          <Section icon="🏺" title="Add Craft Product">
            <form onSubmit={submitCraft} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '520px' }}>
              <div className="form-group"><label>Craft Name</label><input placeholder="e.g. Handwoven Basket" value={craft.name} onChange={e => setCraft(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label>Price (₹)</label><input type="number" min="0" step="0.01" placeholder="Price" value={craft.price} onChange={e => setCraft(f => ({ ...f, price: e.target.value }))} required /></div>
              <div className="form-group"><label>Description</label><textarea placeholder="Describe the craft…" value={craft.description} onChange={e => setCraft(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Upload Image (optional)</label>
                  <input type="file" accept="image/*" id="craft-img" onChange={e => setCraftImg(e.target.files[0])} style={{ padding: '8px' }} />
                  {craftImage && <p style={{ fontSize: '12px', color: 'var(--green-600)', marginTop: '4px' }}>✅ {craftImage.name}</p>}
                </div>
                <div className="form-group">
                  <label>Upload Video (optional)</label>
                  <input type="file" accept="video/*" id="craft-vid" onChange={e => setCraftVid(e.target.files[0])} style={{ padding: '8px' }} />
                  {craftVideo && <p style={{ fontSize: '12px', color: 'var(--green-600)', marginTop: '4px' }}>✅ {craftVideo.name}</p>}
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: 'fit-content' }}>
                {loading ? <><span className="spinner" /> Uploading…</> : '+ Add Craft Product'}
              </button>
            </form>
          </Section>
        )}

        {/* MY PRODUCTS */}
        {tab === 'myproducts' && (
          <Section icon="📋" title="My Products">
            {!myProdsLoaded ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" style={{ borderTopColor: 'var(--green-500)', borderColor: 'var(--gray-200)' }} /></div>
            ) : (
              <>
                {/* ── Food Products ── */}
                <h3 style={{ color: 'var(--green-700)', marginBottom: '14px', marginTop: '4px' }}>🌽 Food Products</h3>
                {myFoodProds.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', marginBottom: '24px' }}>No food products listed yet.</p>
                ) : (
                  <div className="table-wrapper" style={{ marginBottom: '32px' }}>
                    <table>
                      <thead><tr><th>ID</th><th>Name</th><th>Quantity</th><th>Price (₹)</th><th>Edit Price</th></tr></thead>
                      <tbody>
                        {myFoodProds.map(p => (
                          <tr key={p.id}>
                            <td>#{p.id}</td>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.quantity || '—'}</td>
                            <td>
                              <span style={{ fontWeight: 800, color: 'var(--green-700)' }}>₹{p.price}</span>
                            </td>
                            <td>
                              {editingId === p.id ? (
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <input
                                    type="number" min="0" step="0.01" placeholder="New price"
                                    value={editPrices[p.id] || ''}
                                    onChange={e => setEditPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{ width: '100px', padding: '6px 10px', fontSize: '13px' }}
                                  />
                                  <button className="btn btn-primary" onClick={() => savePrice(p.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>Save</button>
                                  <button className="btn btn-outline" onClick={() => setEditingId(null)} style={{ padding: '6px 12px', fontSize: '12px' }}>Cancel</button>
                                </div>
                              ) : (
                                <button className="btn btn-outline" onClick={() => { setEditingId(p.id); setEditPrices(prev => ({ ...prev, [p.id]: p.price })); }}
                                  style={{ padding: '6px 14px', fontSize: '12px' }}>
                                  ✏️ Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Craft Products ── */}
                <h3 style={{ color: 'var(--green-700)', marginBottom: '14px' }}>🏺 Craft Products</h3>
                {myCraftProds.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)' }}>No craft products listed yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {myCraftProds.map(p => {
                      const img = p.image_url ? `${UPLOADS_BASE}/${p.image_url}` : null;
                      return (
                        <div key={p.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--white)' }}>
                          {img ? (
                            <img src={img} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={{ height: '90px', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🏺</div>
                          )}
                          <div style={{ padding: '14px' }}>
                            <p style={{ fontWeight: 700 }}>{p.name}</p>
                            {p.description && <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>{p.description}</p>}
                            <p style={{ color: 'var(--green-700)', fontWeight: 800, fontSize: '18px', marginTop: '8px' }}>₹{p.price}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button className="btn btn-outline" onClick={() => { setMPL(false); loadMyProducts(); }} style={{ marginTop: '20px', fontSize: '13px' }}>
                  🔄 Refresh
                </button>
              </>
            )}
          </Section>
        )}

        {/* MY ORDERS */}
        {tab === 'orders' && (
          <Section icon="📦" title="My Orders">
            {!ordersLoaded ? (
              <button className="btn btn-outline" onClick={loadOrders}>Load Orders</button>
            ) : orders.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No orders received yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Order ID</th><th>Product Type</th><th>Product ID</th><th>Qty</th><th>Total ₹</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td><span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{o.product_type}</span></td>
                        <td>{o.product_id}</td>
                        <td>{o.quantity}</td>
                        <td>₹{o.total_price}</td>
                        <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-yellow'}`} style={{ textTransform: 'capitalize' }}>{o.status}</span></td>
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
