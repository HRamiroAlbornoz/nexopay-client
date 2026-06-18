import { useState, useEffect } from 'react';
import { useSharedExpenses } from '../../hooks/useSharedExpenses';
import { useAuth } from '../../hooks/useAuth';
import { getWallet, lookupWallet, type WalletLookup } from '../../api-calls/wallet/wallet.get';
import { sendTransactionConfirmationEmail } from '../../lib/transactionEmail';
import { ApiError } from '../../lib/apiError';
import Toast, { type ToastAlert } from '../../components/Toast/Toast';

export default function SharedExpenses() {
  const { user } = useAuth();
  const { expenses, addExpense, settleExpense } = useSharedExpenses();

  const [myWalletId, setMyWalletId] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('ARS');
  const [alert, setAlert] = useState<ToastAlert | null>(null);

  const [teammateEmail, setTeammateEmail] = useState('');
  const [teammate, setTeammate] = useState<WalletLookup | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    getWallet()
      .then((wallet) => setMyWalletId(wallet.id))
      .catch((err) => {
        console.error('No se pudo obtener la billetera del usuario.', err);
        setMyWalletId(null);
      });
  }, []);

  const handleLookupTeammate = async () => {
    setLookupError('');
    setTeammate(null);

    if (!teammateEmail) {
      setLookupError('Ingresá un email para buscar.');
      return;
    }

    setIsLookingUp(true);
    try {
      const result = await lookupWallet(teammateEmail);
      setTeammate(result);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'RECIPIENT_NOT_FOUND') {
          setLookupError('No existe ninguna cuenta NexoPay con ese email.');
        } else if (err.code === 'CANNOT_SHARE_WITH_SELF') {
          setLookupError('No podés compartir un gasto con vos mismo.');
        } else {
          setLookupError(err.message);
        }
      } else {
        setLookupError('No se pudo buscar esa cuenta. Intenta de nuevo.');
      }
    } finally {
      setIsLookingUp(false);
    }
  };

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

    if (!teammate) {
      setAlert({ message: 'Buscá y seleccioná con quién compartir el gasto.', type: 'warning' });
      return;
    }

    const halfShare = amount / 2;
    const result = await addExpense({
      title,
      total_amount: amount,
      currency_code: currency,
      members: [
        { wallet_id: myWalletId, amount_owed: halfShare },
        { wallet_id: teammate.wallet_id, amount_owed: halfShare },
      ],
    });

    if (!result.ok) {
      setAlert({ message: result.message, type: 'error' });
      return;
    }

    setTitle('');
    setTotalAmount('');
    setTeammateEmail('');
    setTeammate(null);
    setAlert({ message: `¡Gasto compartido "${title}" creado y dividido con éxito!`, type: 'success' });
  };

  const getMemberDisplayName = (member: { wallet_id: string; name?: string | undefined }): string => {
    if (member.name) return member.name.split(' ')[0] ?? member.name;
    if (member.wallet_id === myWalletId) return user?.first_name ?? 'Vos';
    if (teammate && member.wallet_id === teammate.wallet_id) return teammate.first_name;
    return 'Miembro';
  };

  const handleSettle = async (expenseId: string) => {
    setAlert(null);
    setSettlingId(expenseId);
    const result = await settleExpense(expenseId);
    setSettlingId(null);

    if (!result.ok) {
      setAlert({ message: result.message, type: 'error' });
      return;
    }

    if (user) {
      sendTransactionConfirmationEmail(result.transaction, user);
    }
    setAlert({ message: '¡Tu parte del gasto fue liquidada con éxito!', type: 'success' });
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

      {alert && <Toast alert={alert} onClose={() => setAlert(null)} />}

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
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const myShare = expense.members.find((m) => m.wallet_id === myWalletId);
                  const owesMoney = myShare && myShare.amount_paid < myShare.amount_owed;

                  return (
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
                          {expense.members.map((m) => `${getMemberDisplayName(m)} ($${m.amount_paid}/${m.amount_owed})`).join(', ')}
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
                      <td>
                        {owesMoney && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: '11px', padding: '6px 10px' }}
                            disabled={settlingId === expense.id}
                            onClick={() => handleSettle(expense.id)}
                          >
                            {settlingId === expense.id ? 'Liquidando...' : 'Liquidar mi parte'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <label htmlFor="teammate-email-input">Dividir con (email)</label>
              {teammate ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p className="small" style={{ margin: 0, color: '#00e676' }}>
                    ✓ Vas a compartir con {teammate.first_name} {teammate.last_name}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    onClick={() => {
                      setTeammate(null);
                      setTeammateEmail('');
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="teammate-email-input"
                    type="email"
                    placeholder="compañero@nexopay.com"
                    value={teammateEmail}
                    onChange={(e) => setTeammateEmail(e.target.value)}
                    className="neon-input"
                    style={{ flex: 1 }}
                    aria-describedby={lookupError ? 'teammate-email-error' : undefined}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                    disabled={isLookingUp}
                    onClick={handleLookupTeammate}
                  >
                    {isLookingUp ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              )}
              {lookupError && (
                <p id="teammate-email-error" className="small" style={{ color: 'var(--accent-danger)', margin: '4px 0 0' }} aria-live="polite">
                  {lookupError}
                </p>
              )}
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
