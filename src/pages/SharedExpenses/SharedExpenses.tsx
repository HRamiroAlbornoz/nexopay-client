import { useState, useEffect } from 'react';
import { useSharedExpenses } from '../../hooks/useSharedExpenses';
import { getWallet } from '../../api-calls/wallet/wallet.get';

const RICHARD_WALLET_ID = '0528693b-43dc-4955-937a-496cc530b091';

export default function SharedExpenses() {
  const { expenses, addExpense } = useSharedExpenses();

  const [myWalletId, setMyWalletId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('ARS');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  useEffect(() => {
    getWallet()
      .then((wallet) => setMyWalletId(wallet.id))
      .catch(() => setMyWalletId(null));
  }, []);

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
      setAlert({ message: 'No se pudo identificar tu billetera. Intenta de nuevo.', type: 'error' });
      return;
    }

    const halfShare = amount / 2;
    const success = await addExpense({
      title,
      total_amount: amount,
      currency_code: currency,
      members: [
        { wallet_id: myWalletId, amount_owed: halfShare },
        { wallet_id: RICHARD_WALLET_ID, amount_owed: halfShare },
      ],
    });

    if (!success) {
      setAlert({ message: 'No se pudo crear el gasto compartido. Intenta de nuevo.', type: 'error' });
      return;
    }

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
              {alert.type === 'error' ? 'Error' : alert.type === 'success' ? 'Éxito' : 'Advertencia'}
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
              <label>Dividir con</label>
              <p className="small" style={{ margin: 0 }}>Richard González</p>
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
