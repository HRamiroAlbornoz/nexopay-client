import { useState } from 'react';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';

export default function SavingsGoals() {
  const { goals, addGoal } = useSavingsGoals();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('USD');
  const [targetDate, setTargetDate] = useState('');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // - Savings Goals integration needed: Implement routes `GET /api/savings-goals` and `POST /api/savings-goals`
  //   that insert/update values in the savings_goals PostgreSQL table.

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const amount = Number(targetAmount);
    if (!title) {
      setAlert({ message: 'Por favor, ingresa un título para el objetivo.', type: 'warning' });
      return;
    }

    if (!targetAmount || amount <= 0) {
      setAlert({ message: 'Ingresa un monto objetivo válido mayor a cero.', type: 'warning' });
      return;
    }

    await addGoal({
      title,
      target_amount: amount,
      current_amount: 0,
      currency_code: currency,
      target_date: targetDate || null,
    });

    setTitle('');
    setTargetAmount('');
    setTargetDate('');
    setAlert({ message: `¡Objetivo de ahorro "${title}" creado con éxito!`, type: 'success' });
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="section-kicker">Metas Personales</div>
          <h2 className="trade-title">Objetivos de Ahorro</h2>
          <p className="small">Visualiza tu progreso de ahorro a mediano y largo plazo.</p>
        </div>
        <div className="badge">Mis Objetivos</div>
      </div>

      {alert && (
        <div className={`toast toast-${alert.type}`} style={{ pointerEvents: 'auto', animation: 'none', width: '100%', position: 'relative', right: 'auto', bottom: 'auto', marginBottom: 20 }}>
          <div className="toast-content">
            <span className="toast-title" style={{ fontSize: '10px' }}>
              {alert.type === 'success' ? 'Éxito' : 'Advertencia'}
            </span>
            <span className="toast-message" style={{ fontSize: '12px' }}>
              {alert.message}
            </span>
          </div>
          <button type="button" className="toast-close" onClick={() => setAlert(null)}>&times;</button>
        </div>
      )}

      <div className="dashboard-content-split">
        {/* Goals Progress List */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Mis Metas de Ahorro</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            {goals.map((goal) => {
              const progressPct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <div key={goal.id} className="currency-card-neon" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{goal.title}</span>
                    <span
                      className="badge"
                      style={{
                        background: goal.status === 'completed' ? 'rgba(0,230,118,0.1)' : 'rgba(255,183,0,0.1)',
                        color: goal.status === 'completed' ? '#00e676' : '#ffb700',
                        border: 'none',
                        padding: '2px 8px',
                        fontSize: '9.5px',
                      }}
                    >
                      {goal.status === 'completed' ? 'Completado' : 'Activo'}
                    </span>
                  </div>
                  <div className="stat-value" style={{ fontSize: '20px', marginTop: '8px', color: 'var(--text-primary)' }}>
                    ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()} {goal.currency_code}
                  </div>
                  <div className="progress-track" style={{ marginTop: '8px', height: '10px' }}>
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span className="small">{progressPct.toFixed(1)}% completado</span>
                    {goal.target_date && <span className="small">Meta: {new Date(goal.target_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Goal Form */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Crear Nuevo Objetivo</div>
          <form className="deposit-form" onSubmit={handleCreateGoal}>
            <div className="form-group">
              <label htmlFor="goal-title-input">¿Qué deseas comprar / lograr?</label>
              <input
                id="goal-title-input"
                type="text"
                placeholder="Ej. Vacaciones de fin de año"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="neon-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="goal-currency-select">Moneda</label>
              <select
                id="goal-currency-select"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD' | 'EUR')}
              >
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="ARS">ARS - Peso Argentino</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="goal-amount-input">Monto Objetivo</label>
              <input
                id="goal-amount-input"
                type="number"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="neon-input"
                min="0"
                step="any"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="goal-date-input">Fecha Límite (Opcional)</label>
              <input
                id="goal-date-input"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="neon-input"
              />
            </div>
            <button type="submit" className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              Crear Objetivo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
