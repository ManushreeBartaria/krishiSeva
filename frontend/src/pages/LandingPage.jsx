import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoleCard from '../components/RoleCard';

const roles = [
  {
    id: 'farmer',
    emoji: '🌾',
    title: 'Farmer',
    description: 'List your crops, crafts, and manage incoming orders from buyers.',
    color: '#22c55e',
  },
  {
    id: 'buyer',
    emoji: '🛒',
    title: 'Buyer',
    description: 'Browse fresh local produce and crafts from nearby farmers.',
    color: '#3b82f6',
  },
  {
    id: 'organizer',
    emoji: '🏢',
    title: 'Organizer',
    description: 'Post event requirements and connect with farmers for bulk supply.',
    color: '#f59e0b',
  },
  {
    id: 'admin',
    emoji: '🛡️',
    title: 'Admin',
    description: 'View all farmers, organizer events, and manage the marketplace.',
    color: '#8b5cf6',
  },
];

export default function LandingPage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected) navigate(`/login?role=${selected}`);
  };

  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fff 100%)',
          padding: '80px 32px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,.10) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🌿</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', color: 'var(--green-800)', marginBottom: '18px', lineHeight: 1.1 }}>
            Welcome to <span style={{ color: 'var(--green-500)' }}>KrishiSeva</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--gray-600)', maxWidth: '520px', margin: '0 auto 12px' }}>
            Bridging farmers, buyers, and organizers for a thriving agricultural ecosystem.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
            {['🌾 Fresh Produce', '🏺 Craft Items', '📦 Bulk Orders', '📍 Nearby Farmers'].map(tag => (
              <span key={tag} className="badge badge-green" style={{ fontSize: '13px' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROLE SELECTOR ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>I am a…</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '16px' }}>Choose your role to get started</p>
        </div>

        {/* 2×2 grid for 4 roles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {roles.map(r => (
            <RoleCard
              key={r.id}
              emoji={r.emoji}
              title={r.title}
              description={r.description}
              color={r.color}
              selected={selected === r.id}
              onClick={() => setSelected(r.id)}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={!selected}
            onClick={handleContinue}
            style={{ minWidth: '200px', fontSize: '16px', padding: '14px 36px' }}
          >
            Continue as {selected ? roles.find(r => r.id === selected)?.title : '…'}
          </button>
          <button
            className="btn btn-outline"
            disabled={!selected}
            onClick={() => selected && navigate(`/register?role=${selected}`)}
            style={{ minWidth: '200px', fontSize: '16px', padding: '14px 36px' }}
          >
            Register
          </button>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ background: 'var(--green-800)', padding: '64px 32px', marginTop: '20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--white)', fontSize: '28px', marginBottom: '40px' }}>Why KrishiSeva?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            {[
              { icon: '📍', title: 'Location-Aware', desc: 'Find farmers within your preferred radius using smart geolocation.' },
              { icon: '📱', title: 'SMS Alerts', desc: 'Farmers get instant SMS notifications in their native language for every new order.' },
              { icon: '🤝', title: 'Fair Marketplace', desc: 'Direct connection between farmers and buyers — no middlemen, better prices.' },
              { icon: '🛡️', title: 'Admin Control', desc: 'Admins can oversee all farmers, products and organizer events in one place.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 'var(--radius-lg)', padding: '28px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.12)' }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{ color: 'var(--white)', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '14px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
