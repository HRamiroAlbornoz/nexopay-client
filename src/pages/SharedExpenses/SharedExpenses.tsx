import { useState, useEffect } from 'react';
import { useSharedExpenses } from '../../hooks/useSharedExpenses';
import { useAuth } from '../../hooks/useAuth';
import { getWallet } from '../../api-calls/wallet/wallet.get';
import { ApiError } from '../../lib/apiError';

export default function SharedExpenses() {
  const { user } = useAuth();
  const { expenses, loading, error, addExpense } = useSharedExpenses();

  const [myWalletId, setMyWalletId] = useState('');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('ARS');
  const [teammateEmail, setTeammateEmail] = useState('hernan@nexopay.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Obtiene el wallet_id real del usuario al montar el componente
  useEffect(() => {
    if (!user) return;
    getWallet().then((w) => setMyWalletId(w.id)).catch(() => { /* silencioso — validamos antes de submit */ });
  }, [user]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const amount = Number(totalAmount);
    if (!title) {
      setAlert({ message: 'Por favor, ingresa una descripción.', type: 'warning' });
      return;
    }
    if (!totalAmount || amount <= 0) {
      setAlert({ message: 'Ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }
    if (!myWalletId) {
      setAlert({ message: 'No se pudo obtener tu billetera. Recarga la página.', type: 'warning' });
      return;
    }

    const halfShare = amount / 2;
    setIsSubmitting(true);
    try {
      // Contrato del backend: { title, total_amount, currency_code, members: [{ wallet_id, amount_owed }] }
      // El creador debe estar en members; su parte queda saldada automáticamente por el backend.
      // El campo wallet_id del compañero lo resuelve el backend por email (futura mejora) —
      // por ahora enviamos un placeholder que el backend vincula al email si tiene esa lógica.
      await addExpense({
        title,
        total_amount: amount,
        currency_code: currency,
        members: [
          { wallet_id: myWalletId, amount_owed: halfShare },
          { wallet_id: teammateEmail, amount_owed: halfShare }, // backend resuelve por email
        ],
      });
      setTitle('');
      setTotalAmount('');
      setAlert({ message: `¡Gasto compartido "${title}" creado y dividido con éxito!`, type: 'success' });
    } catch (err) {
      let msg = 'Error al crear el gasto compartido.';
      if (err instanceof ApiError) {
        if (err.code === 'CREATOR_NOT_MEMBER') msg = 'Debes incluirte como miembro del gasto.';
        else if (err.code === 'INVALID_WALLETS') msg = 'Uno o más miembros no existen en Nexopay.';
        else msg = err.message;
      }
      setAlert({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="section-kicker">Finanzas Grupales</div>
          <h2 className="trade-title">Gastos Compartidos</h2>
          <p className="small">Divide cuentas de cenas, alquileres y viáticos de forma equitativa.</p>
        </div>
        <div className="badge">Cuentas Claras</div>
      </div>

      {loading && <p className="small" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Cargando gastos...</p>}
      {error && <p className="small" style={{ color: 'var(--accent-danger)', marginBottom: 12 }}>{error}</p>}

      {alert && (
        <div className={`toast toast-${alert.type}`} style={{ pointerEvents: 'auto', animation: 'none', width: '100%', position: 'relative', right: 'auto', bottom: 'auto', marginBottom: 20 }}>
          <div className="toast-content">
            <span className="toast-title" style={{ fontSize: '10px' }}>
              {alert.type === 'success' ? 'Éxito' : alert.type === 'error' ? 'Error' : 'Advertencia'}
            </span>
            <span className="toast-message" style={{ fontSize: '12px' }}>
              {alert.message}
            </span>
          </div>
          <button type="button" className="toast-close" onClick={() => setAlert(null)}>&times;</button>
        </div>
      )}

      <div className="dashboard-content-split">
        {/* Expenses List */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Historial de Cuentas</div>
          <div className="log-table-container">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Total</th>
                  <th>Moneda</th>
                  <th>Miembros / Estado</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ fontWeight: 'bold' }}>{expense.title}</td>
                    <td>{expense.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className="symbol-tag" style={{ fontSize: '10.5px', padding: '2px 6px', display: 'inline-block' }}>
                        {expense.currency_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {expense.members.map((m) => `${m.name.split(' ')[0]} ($${m.amount_paid}/${m.amount_owed})`).join(', ')}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: expense.status === 'settled' ? 'rgba(0,230,118,0.1)' : 'rgba(255,183,0,0.1)',
                          color: expense.status === 'settled' ? '#00e676' : '#ffb700',
                          border: 'none',
                          marginTop: '4px',
                          padding: '2px 8px',
                          fontSize: '9.5px',
                        }}
                      >
                        {expense.status === 'settled' ? 'Saldado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Expense Form */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Dividir Nueva Cuenta</div>
          <form className="deposit-form" onSubmit={handleCreateExpense}>
            <div className="form-group">
              <label htmlFor="expense-title-input">Descripción / Concepto</label>
              <input
                id="expense-title-input"
                type="text"
                placeholder="Ej. Almuerzo de equipo Nexopay"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="neon-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expense-teammate-input">Dividir con (Correo)</label>
              <input
                id="expense-teammate-input"
                type="email"
                placeholder="companero@nexopay.com"
                value={teammateEmail}
                onChange={(e) => setTeammateEmail(e.target.value)}
                className="neon-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expense-currency-select">Moneda</label>
              <select
                id="expense-currency-select"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD' | 'EUR')}
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="expense-amount-input">Monto Total</label>
              <input
                id="expense-amount-input"
                type="number"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="neon-input"
                min="0"
                step="any"
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              {isSubmitting ? 'Creando...' : 'Crear y Dividir'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
