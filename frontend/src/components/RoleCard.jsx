import React from 'react';

export default function RoleCard({ emoji, title, description, color, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '36px 28px',
        border: selected ? '3px solid var(--green-500)' : '2px solid var(--gray-200)',
        borderRadius: 'var(--radius-xl)',
        background: selected
          ? 'linear-gradient(135deg, var(--green-50), var(--white))'
          : 'var(--white)',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: selected ? 'var(--shadow-green)' : 'var(--shadow-sm)',
        transform: selected ? 'translateY(-6px)' : 'none',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '38px',
          animation: selected ? 'float 2.5s ease-in-out infinite' : 'none',
        }}
      >
        {emoji}
      </div>
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--gray-900)' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--gray-500)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      {selected && (
        <span className="badge badge-green">Selected ✓</span>
      )}
    </button>
  );
}
