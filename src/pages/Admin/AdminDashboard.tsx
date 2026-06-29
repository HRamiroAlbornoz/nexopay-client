import './AdminDashboard.css';
import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useKycQueue } from '../../hooks/useKycQueue';
import type { KycRequest } from '../../hooks/useKycQueue';

// ─── Sub-componente: fila de la tabla KYC ────────────────────────────────────

interface KycRowProps {
  req:      KycRequest;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  busy:      boolean;
}

function KycRow({ req, onApprove, onReject, busy }: KycRowProps) {
  const date = new Date(req.created_at).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <tr key={req.id}>
      <td>{req.user_email}</td>
      <td>
        <span className="admin-badge">{req.doc_type}</span>
        {req.doc_url && (
          <a
            href={req.doc_url}
            className="admin-view-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver archivo (S3)
          </a>
        )}
      </td>
      <td className="admin-muted">{date}</td>
      <td className="admin-actions">
        <button
          className="admin-btn-approve"
          onClick={() => onApprove(req.id)}
          disabled={busy}
          aria-label={`Aprobar KYC de ${req.user_email}`}
        >
          ✅ Aprobar
        </button>
        <button
          className="admin-btn-reject"
          onClick={() => onReject(req.id)}
          disabled={busy}
          aria-label={`Rechazar KYC de ${req.user_email}`}
        >
          ❌ Rechazar
        </button>
      </td>
    </tr>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export function AdminDashboard() {
  const { requests, stats, loading, error, approve, reject } = useKycQueue();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const handleApprove = async (id: string) => {
    setBusyId(id);
    setActionError('');
    const result = await approve(id);
    if (!result.ok) setActionError(result.message);
    setBusyId(null);
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    setActionError('');
    const result = await reject(id);
    if (!result.ok) setActionError(result.message);
    setBusyId(null);
  };

  return (
    <div className="admin-page">
      <Navbar />

      <main className="admin-container fade-in">
        <header className="admin-header">
          <h1>Panel de Control (Admin)</h1>
          <p>Visión general del sistema y moderación</p>
        </header>

        {/* ── Estadísticas ── */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', fontSize: '24px' }}>
              👥
            </div>
            <div className="admin-stat-info">
              <h3>Usuarios Activos</h3>
              <p className="admin-stat-value">
                {loading ? '—' : (stats?.active_users.toLocaleString() ?? '—')}
              </p>
              <span className="admin-stat-trend positive">Actualizado ahora</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(57, 255, 20, 0.1)', color: '#39ff14', fontSize: '24px' }}>
              📊
            </div>
            <div className="admin-stat-info">
              <h3>Volumen Diario</h3>
              <p className="admin-stat-value">
                {loading ? '—' : stats ? `$${stats.daily_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD` : '—'}
              </p>
              <span className="admin-stat-trend positive">Hoy</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(255, 183, 0, 0.1)', color: '#ffb700', fontSize: '24px' }}>
              ⚠️
            </div>
            <div className="admin-stat-info">
              <h3>KYC Pendientes</h3>
              <p className="admin-stat-value">{loading ? '—' : requests.length}</p>
              <span className="admin-stat-trend neutral">Requiere atención</span>
            </div>
          </div>
        </div>

        {/* ── Cola KYC ── */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2>Cola de Verificación de Documentos (S3)</h2>
          </div>

          {/* Error de carga */}
          {error && (
            <div className="admin-error-banner" role="alert">
              ⚠️ {error}
            </div>
          )}

          {/* Error de acción */}
          {actionError && (
            <div className="admin-error-banner" role="alert">
              ⚠️ {actionError}
            </div>
          )}

          <div className="admin-table-container">
            {loading ? (
              <div className="admin-empty-state">
                <p>Cargando solicitudes...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="admin-empty-state">
                <span style={{ fontSize: '48px' }}>✅</span>
                <p>¡Todo al día! No hay documentos pendientes.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Documento</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <KycRow
                      key={req.id}
                      req={req}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      busy={busyId === req.id}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
