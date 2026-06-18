import './AdminDashboard.css';
import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

export function AdminDashboard() {
  const [kycRequests, setKycRequests] = useState([
    { id: '1', user: 'carlos.m@example.com', docType: 'Pasaporte', status: 'pending', date: 'Hace 2 horas' },
    { id: '2', user: 'laura.dev@example.com', docType: 'DNI', status: 'pending', date: 'Hace 5 horas' },
    { id: '3', user: 'miguel99@example.com', docType: 'Licencia', status: 'pending', date: 'Ayer' },
  ]);

  const handleApprove = (id: string) => {
    setKycRequests(prev => prev.filter(req => req.id !== id));
    // Here we would call the real backend to approve KYC
  };

  const handleReject = (id: string) => {
    setKycRequests(prev => prev.filter(req => req.id !== id));
    // Here we would call the real backend to reject KYC
  };

  return (
    <div className="admin-page">
      <Navbar />
      
      <main className="admin-container fade-in">
        <header className="admin-header">
          <h1>Panel de Control (Admin)</h1>
          <p>Visión general del sistema y moderación</p>
        </header>

        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', fontSize: '24px' }}>
              👥
            </div>
            <div className="admin-stat-info">
              <h3>Usuarios Activos</h3>
              <p className="admin-stat-value">1,248</p>
              <span className="admin-stat-trend positive">+12% esta semana</span>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(57, 255, 20, 0.1)', color: '#39ff14', fontSize: '24px' }}>
              📊
            </div>
            <div className="admin-stat-info">
              <h3>Volumen Diario</h3>
              <p className="admin-stat-value">$45,230 USD</p>
              <span className="admin-stat-trend positive">+5.4% vs ayer</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(255, 183, 0, 0.1)', color: '#ffb700', fontSize: '24px' }}>
              ⚠️
            </div>
            <div className="admin-stat-info">
              <h3>KYC Pendientes</h3>
              <p className="admin-stat-value">{kycRequests.length}</p>
              <span className="admin-stat-trend neutral">Requiere atención</span>
            </div>
          </div>
        </div>

        <section className="admin-section">
          <div className="admin-section-header">
            <h2>Cola de Verificación de Documentos (S3)</h2>
          </div>
          
          <div className="admin-table-container">
            {kycRequests.length === 0 ? (
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
                  {kycRequests.map(req => (
                    <tr key={req.id}>
                      <td>{req.user}</td>
                      <td>
                        <span className="admin-badge">{req.docType}</span>
                        <a href="#" className="admin-view-link">Ver archivo (S3)</a>
                      </td>
                      <td className="admin-muted">{req.date}</td>
                      <td className="admin-actions">
                        <button className="admin-btn-approve" onClick={() => handleApprove(req.id)}>
                          ✅ Aprobar
                        </button>
                        <button className="admin-btn-reject" onClick={() => handleReject(req.id)}>
                          ❌ Rechazar
                        </button>
                      </td>
                    </tr>
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
