import { useState, type FormEvent } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { createTransfer } from '../../api-calls/transactions/transactions.post';
import { ApiError } from '../../lib/apiError';
import { sendTransactionConfirmationEmail } from '../../lib/transactionEmail';

export default function Wallet() {
  const { balances, updateBalance } = useWallet();
  const { user, logout } = useAuth();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>('USD');
  const [recipient, setRecipient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const transferAmount = Number(amount);
    if (!amount || transferAmount <= 0) {
      setAlert({ message: 'Ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }

    if (!recipient) {
      setAlert({ message: 'Por favor, ingresa el correo del destinatario.', type: 'warning' });
      return;
    }

    const currentBalance = balances.find((b) => b.currency_code === currency)?.amount || 0;
    if (transferAmount > currentBalance) {
      setAlert({ message: 'Saldo insuficiente para realizar esta transferencia.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const transaction = await createTransfer({ recipient_email: recipient, currency_code: currency, amount: transferAmount });
      updateBalance(currency, -transferAmount);
      if (user) {
        sendTransactionConfirmationEmail(transaction, user);
      }
      setAlert({
        message: `¡Transferencia de ${transferAmount} ${currency} enviada con éxito a ${recipient}!`,
        type: 'success',
      });
      setAmount('');
      setRecipient('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setAlert({ message: err.message, type: 'error' });
      } else {
        setAlert({ message: 'No se pudo completar la transferencia.', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="section-kicker">Panel Financiero</div>
          <h2 className="trade-title">Billetera Digital</h2>
          <p className="small">Visualiza tus activos y transfiere capital al instante.</p>
        </div>
        <div className="badge">Mi Cartera</div>
      </div>

      {alert && (
        <div role="alert" aria-live="assertive" className={`toast toast-${alert.type}`} style={{ pointerEvents: 'auto', animation: 'none', width: '100%', position: 'relative', right: 'auto', bottom: 'auto', marginBottom: 20 }}>
          <div className="toast-content">
            <span className="toast-title" style={{ fontSize: '10px' }}>
              {alert.type === 'error' ? 'Error' : alert.type === 'success' ? 'Éxito' : 'Advertencia'}
            </span>
            <span className="toast-message" style={{ fontSize: '12px' }}>
              {alert.message}
            </span>
          </div>
          <button type="button" className="toast-close" onClick={() => setAlert(null)} aria-label="Cerrar">&times;</button>
        </div>
      )}

      <div className="dashboard-content-split">
        {/* Wallet Balances */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Saldos Disponibles</div>
          <div className="currency-list">
            {balances.map((b) => (
              <div key={b.currency_code} className="currency-card-neon">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="symbol-tag">{b.currency_code}</span>
                  <span className="small" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Activo</span>
                </div>
                <div className="stat-value" style={{ fontSize: '28px', marginTop: '12px' }}>
                  {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="small-name">
                  {b.currency_code === 'ARS' ? 'Peso Argentino' : b.currency_code === 'EUR' ? 'Euro' : 'Dólar estadounidense'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Funds */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Transferir Capital</div>
          <form className="deposit-form" onSubmit={handleTransfer}>
            <div className="form-group">
              <label htmlFor="recipient-input">Correo Destinatario</label>
              <input
                id="recipient-input"
                type="email"
                placeholder="destinatario@nexopay.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="neon-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="currency-select">Moneda</label>
              <select
                id="currency-select"
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
              <label htmlFor="amount-input">Monto a Transferir</label>
              <input
                id="amount-input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="neon-input"
                min="0"
                step="any"
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              {isSubmitting ? 'Transfiriendo...' : 'Enviar Transferencia'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
