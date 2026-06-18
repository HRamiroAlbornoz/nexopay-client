import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Billetera', path: '/wallet' },
  { label: 'Historial', path: '/transactions' },
  { label: 'Gastos compartidos', path: '/shared-expenses' },
  { label: 'Objetivos de Ahorro', path: '/savings-goals' },
];

export default function LeftPanel() {
  const { user } = useAuth();
  const { balances } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const [pinned, setPinned] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const getInitials = () => {
    if (!user) return 'N';
    return `${user.first_name[0] || ''}${user.last_name ? user.last_name[0] || '' : ''}`.toUpperCase();
  };

  return (
    <aside
      className={`left-panel-neon ${collapsed ? 'collapsed' : 'expanded'}`}
      onMouseEnter={() => {
        if (!pinned) setCollapsed(false);
      }}
      onMouseLeave={() => {
        if (!pinned) setCollapsed(true);
      }}
    >
      <div className="profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div className="avatar">{getInitials()}</div>
          {!collapsed && (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user ? `${user.first_name} ${user.last_name || ''}` : 'Cuenta Nexopay'}
              </div>
              <div className="small" style={{ fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email || 'Premium Member'}
              </div>
            </div>
          )}
        </div>
        <button
          className={`btn-pin ${pinned ? 'active' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            setPinned((value) => !value);
          }}
          title={pinned ? 'Desanclar' : 'Anclar'}
        >
          {pinned ? '×' : '•'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="menu-list" style={{ marginTop: '20px' }}>
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  className={`menu-item-neon ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="balances-section" style={{ marginTop: '20px' }}>
            <div className="balances-title">Billetera Activa</div>
            <div className="balances-grid">
              {balances.map((b) => (
                <div key={b.currency_code} className="balance-row">
                  <span className="balance-symbol">{b.currency_code}</span>
                  <span className="balance-value">
                    {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
