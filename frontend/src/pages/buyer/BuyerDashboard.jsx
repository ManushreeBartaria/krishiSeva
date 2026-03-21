import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAllFoodProducts, getAllCraftProducts, createOrder, getBuyerOrders } from '../../api/api';

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

function ProductCard({ product, type, onOrder }) {
  const imageUrl = product.image_url ? `${UPLOADS_BASE}/${product.image_url}` : null;

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all .25s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Image area */}
      {imageUrl ? (
        <img src={imageUrl} alt={product.name}
          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg, var(--green-50), var(--green-100))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
          {type === 'food' ? '🌽' : '🏺'}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3 }}>{product.name}</h3>
          <span className="badge badge-green" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
            {type === 'food' ? '🌽 Food' : '🏺 Craft'}
          </span>
        </div>

        {product.description && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.5, flex: 1 }}>
            {product.description.length > 80 ? product.description.slice(0, 80) + '…' : product.description}
          </p>
        )}

        {product.quantity && (
          <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>📦 {product.quantity}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-700)' }}>₹{product.price}</span>
            {product.farm_name && (
              <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                🌾 {product.farm_name}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onOrder(product, type)}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal to confirm order
function OrderModal({ product, type, buyerId, onClose, onSuccess }) {
  const [qty, setQty]         = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrder({
        buyer_id:     buyerId,
        product_type: type,
        product_id:   product.id,
        quantity:     parseInt(qty),
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '6px' }}>🛒 Place Order</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '15px', marginBottom: '24px' }}>
          {product.name} · ₹{product.price} each
        </p>
        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

        {/* Auto-filled read-only fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div className="form-group">
            <label>Product ID (auto)</label>
            <input value={`#${product.id} — ${product.name}`} readOnly style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
          </div>
          <div className="form-group">
            <label>Farmer ID (auto)</label>
            <input value={`#${product.farmer_id}${product.farmer_name ? ' — ' + product.farmer_name : ''}`} readOnly style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </div>

          <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Estimated Total</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green-700)' }}>
              ₹{(product.price * (parseInt(qty) || 0)).toFixed(2)}
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 2 }}>
            {loading ? <><span className="spinner" /> Placing…</> : '✅ Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const session  = JSON.parse(localStorage.getItem('ks_session') || 'null');

  useEffect(() => {
    if (!session || session.role !== 'buyer') navigate('/login?role=buyer');
  }, []);

  if (!session) return null;
  const buyer   = session.user;
  const buyerId = buyer.id;

  const [tab, setTab]         = useState('food');
  const [foodProds, setFoodP] = useState([]);
  const [craftProds, setCraftP] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState({ msg: '', type: '' });
  const [ordersLoaded, setOL] = useState(false);
  const [foodLoaded, setFL]   = useState(false);
  const [craftLoaded, setCL]  = useState(false);
  const [filterText, setFilter] = useState('');
  const [orderModal, setModal]  = useState(null); // { product, type }

  function notify(msg, type = 'success') {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  }

  async function loadFood() {
    if (foodLoaded) return;
    setLoading(true);
    try {
      const res = await getAllFoodProducts();
      setFoodP(res.data);
      setFL(true);
    } catch { notify('Failed to load food products.', 'error'); }
    finally { setLoading(false); }
  }

  async function loadCraft() {
    if (craftLoaded) return;
    setLoading(true);
    try {
      const res = await getAllCraftProducts();
      setCraftP(res.data);
      setCL(true);
    } catch { notify('Failed to load craft products.', 'error'); }
    finally { setLoading(false); }
  }

  async function loadOrders() {
    try {
      const res = await getBuyerOrders(buyerId);
      setOrders(res.data);
      setOL(true);
    } catch { notify('Could not load orders.', 'error'); }
  }

  // Load on tab switch
  useEffect(() => {
    if (tab === 'food')   loadFood();
    if (tab === 'craft')  loadCraft();
    if (tab === 'orders') loadOrders();
  }, [tab]);

  const STATUS_COLORS = { pending: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' };

  const filteredFood  = foodProds.filter(p  => p.name.toLowerCase().includes(filterText.toLowerCase()));
  const filteredCraft = craftProds.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <>
      <Navbar role="buyer" onLogout={() => { localStorage.removeItem('ks_session'); navigate('/'); }} />

      {/* Order confirmation modal */}
      {orderModal && (
        <OrderModal
          product={orderModal.product}
          type={orderModal.type}
          buyerId={buyerId}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            notify('Order placed successfully! 🎉');
          }}
        />
      )}

      <div className="page-container">
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 'var(--radius-xl)', padding: '32px 36px', marginBottom: '32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🛒</div>
            <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Hello, {buyer.name}!</h1>
            <p style={{ opacity: .85 }}>Browse fresh produce and crafts directly from farmers</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 'var(--radius-lg)', padding: '20px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', opacity: .8, marginBottom: '4px' }}>Buyer ID</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>#{buyerId}</div>
          </div>
        </div>

        {/* Alert */}
        {status.msg && <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '24px' }}>{status.type === 'error' ? '⚠️' : '✅'} {status.msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '6px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', width: 'fit-content', flexWrap: 'wrap' }}>
          {[['food', '🌽 Food Products'], ['craft', '🏺 Craft Products'], ['orders', '📦 My Orders']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setFilter(''); }}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-lg)', border: 'none', background: tab === id ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent', color: tab === id ? 'white' : 'var(--gray-500)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* FOOD PRODUCTS */}
        {tab === 'food' && (
          <Section icon="🌽" title="Food Products">
            <div style={{ marginBottom: '20px' }}>
              <input placeholder="🔍 Search food products…" value={filterText} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '320px' }} />
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}><span className="spinner" style={{ borderTopColor: 'var(--green-500)', borderColor: 'var(--gray-200)' }} /></div>
            ) : filteredFood.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>{foodLoaded ? 'No food products found.' : 'Loading…'}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
                {filteredFood.map(p => (
                  <ProductCard key={p.id} product={p} type="food"
                    onOrder={(prod, t) => setModal({ product: prod, type: t })} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* CRAFT PRODUCTS */}
        {tab === 'craft' && (
          <Section icon="🏺" title="Craft Products">
            <div style={{ marginBottom: '20px' }}>
              <input placeholder="🔍 Search craft products…" value={filterText} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '320px' }} />
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}><span className="spinner" style={{ borderTopColor: 'var(--green-500)', borderColor: 'var(--gray-200)' }} /></div>
            ) : filteredCraft.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>{craftLoaded ? 'No craft products found.' : 'Loading…'}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
                {filteredCraft.map(p => (
                  <ProductCard key={p.id} product={p} type="craft"
                    onOrder={(prod, t) => setModal({ product: prod, type: t })} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* MY ORDERS */}
        {tab === 'orders' && (
          <Section icon="📦" title="My Orders">
            {!ordersLoaded ? (
              <button className="btn btn-outline" onClick={loadOrders}>Load Orders</button>
            ) : orders.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No orders placed yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Order ID</th><th>Type</th><th>Product ID</th><th>Farmer ID</th><th>Qty</th><th>Total ₹</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td><span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{o.product_type}</span></td>
                        <td>{o.product_id}</td>
                        <td>#{o.farmer_id}</td>
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
