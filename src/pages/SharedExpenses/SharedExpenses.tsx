import { useState } from 'react';
import { useSharedExpenses } from '../../hooks/useSharedExpenses';
import { useAuth } from '../../hooks/useAuth';

export default function SharedExpenses() {
  const { user } = useAuth();
  const { expenses, addExpense } = useSharedExpenses();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('ARS');
  const [teammateEmail, setTeammateEmail] = useState('hernan@nexopay.com');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // - Shared Expenses integration needed: Implement routes `GET /api/shared-expenses` and `POST /api/shared-expenses`
  //   that automatically insert records into shared_expenses and link members in shared_expense_members table.

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

    const halfShare = amount / 2;
    await addExpense({
      title,
      total_amount: amount,
      currency_code: currency,
      members: [
        {
          wallet_id: 'currentUser',
          name: user ? `${user.first_name} ${user.last_name || ''}` : 'Usuario',
          amount_owed: halfShare,
          amount_paid: halfShare, // Creator assumes full/half pay
        },
        {
          wallet_id: 'teammateUser',
          name: teammateEmail.split('@')[0] || 'Compañero',
          amount_owed: halfShare,
          amount_paid: 0,
        },
      ],
    });

    setTitle('');
    setTotalAmount('');
    setAlert({ message: `¡Gasto compartido "${title}" creado y dividido con éxito!`, type: 'success' });
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
            <button type="submit" className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              Crear y Dividir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
