import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ role, onLogout }) {
  const roleLabel = role
    ? { farmer: '🌾 Farmer', buyer: '🛒 Buyer', organizer: '🏢 Organizer' }[role]
    : null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        🌿 Krishi<span>Seva</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {roleLabel && (
          <span
            className="badge badge-green"
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            {roleLabel}
          </span>
        )}

        {onLogout ? (
          <button className="btn btn-outline" onClick={onLogout} style={{ padding: '8px 20px' }}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
