import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useTransactions } from '../../hooks/useTransactions';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { createBuyTransaction } from '../../api-calls/transactions/transactions.post';
import { getBalanceHistory } from '../../api-calls/wallet/wallet.get';
import { ApiError } from '../../lib/apiError';
import { isPositiveTransaction, getTransactionTypeLabel } from '../../lib/transactionLabels';
import { sendTransactionConfirmationEmail } from '../../lib/transactionEmail';
import BalanceChart, { type BalanceDataPoint } from '../../components/charts/BalanceChart/BalanceChart';
import TransactionTimeline from '../../components/charts/TransactionTimeline/TransactionTimeline';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { balances, updateBalance } = useWallet();
  const { transactions, refetch: refetchTransactions } = useTransactions();
  const { rates } = useExchangeRate();

  const [depAmount, setDepAmount] = useState('');
  const [depSymbol, setDepSymbol] = useState<'USD' | 'EUR'>('USD');
  const [isBuying, setIsBuying] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceDataPoint[]>([]);

  useEffect(() => {
    getBalanceHistory(7)
      .then(setBalanceHistory)
      .catch(() => setBalanceHistory([]));
  }, []);

  // Valor estimado total de la cartera en USD
  const assetDetails = useMemo(() => {
    let total = 0;
    if (!balances || balances.length === 0) return { list: [], totalUSD: 0 };

    const list = balances.map((balanceItem) => {
      const rateInfo = rates.find((r) => r.symbol.toUpperCase() === balanceItem.currency_code);
      const priceInUSD = rateInfo ? rateInfo.current_price : 0;
      const valueUSD = balanceItem.amount * priceInUSD;
      total += valueUSD;
      return { symbol: balanceItem.currency_code, balance: balanceItem.amount, valueUSD };
    });

    return { list: list.sort((a, b) => b.valueUSD - a.valueUSD), totalUSD: total };
  }, [balances, rates]);



  const handleDepositSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAlert(null);
    const arsAmount = Number(depAmount);
    if (!depAmount || arsAmount <= 0) {
      setAlert({ message: 'Ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }

    const currentArs = balances.find((b) => b.currency_code === 'ARS')?.amount ?? 0;
    if (arsAmount > currentArs) {
      setAlert({ message: 'Saldo en ARS insuficiente para esta compra.', type: 'error' });
      return;
    }

    setIsBuying(true);
    try {
      const transaction = await createBuyTransaction({ currency_to: depSymbol, amount_from: arsAmount });
      updateBalance('ARS', -transaction.amount_from);
      updateBalance(depSymbol, transaction.amount_to);
      await refetchTransactions();
      if (user) {
        sendTransactionConfirmationEmail(transaction, user);
      }
      setDepAmount('');
      setAlert({
        message: `¡Compraste ${transaction.amount_to.toFixed(2)} ${depSymbol} por ${transaction.amount_from.toFixed(2)} ARS!`,
        type: 'success',
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setAlert({ message: err.message, type: 'error' });
      } else {
        setAlert({ message: 'No se pudo completar la compra.', type: 'error' });
      }
    } finally {
      setIsBuying(false);
    }
  };



  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="section-kicker">Dashboard Autenticado</div>
          <h2 className="trade-title">Resumen de Cuenta</h2>
          <p className="small">Sesión activa para {user?.first_name} {user?.last_name || ''}</p>
        </div>
        <div className="badge">Consola Principal</div>
      </div>

      {alert && (
        <div className={`toast toast-${alert.type}`} style={{ pointerEvents: 'auto', animation: 'none', width: '100%', position: 'relative', right: 'auto', bottom: 'auto', marginBottom: 20 }}>
          <div className="toast-content">
            <span className="toast-title" style={{ fontSize: '10px' }}>
              {alert.type === 'error' ? 'Error' : alert.type === 'success' ? 'Éxito' : 'Advertencia'}
            </span>
            <span className="toast-message" style={{ fontSize: '12px' }}>{alert.message}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setAlert(null)}>&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid">
        <div className="dashboard-stat-card">
          <div className="stat-label">Valor estimado</div>
          <div className="stat-value">
            ${assetDetails.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="small">Equivalente USD (ARS/USD/EUR)</div>
        </div>
      </div>

      <div className="dashboard-content-split" style={{ marginBottom: 20 }}>
        {/* Assets Distribution */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Distribución de Activos</div>
          <div className="asset-bars">
            {assetDetails.list.map((asset) => {
              const percentage = assetDetails.totalUSD > 0 ? (asset.valueUSD / assetDetails.totalUSD) * 100 : 0;
              return (
                <div key={asset.symbol}>
                  <div className="asset-row" style={{ marginTop: '8px' }}>
                    <span>{asset.symbol} ({asset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                    <span>${asset.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: '4px' }}>
                    <div className="progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buy Form */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Comprar Divisa</div>
          <form className="deposit-form" onSubmit={handleDepositSubmit}>
            <div className="form-group">
              <label>Divisa a comprar</label>
              <select className="form-select" value={depSymbol} onChange={(e) => setDepSymbol(e.target.value as 'USD' | 'EUR')}>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monto en ARS a gastar</label>
              <input
                type="number" placeholder="0.00" value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                className="neon-input" min="0" step="any" required
              />
            </div>
            <button type="submit" disabled={isBuying} className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              {isBuying ? 'Comprando...' : 'Comprar'}
            </button>
          </form>
        </div>
      </div>

      <div className="dashboard-content-split" style={{ marginBottom: 20 }}>
        {/* Balance evolution */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Evolución de Balances</div>
          <BalanceChart data={balanceHistory} />
        </div>

        {/* Transaction timeline */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Timeline de Transacciones</div>
          <TransactionTimeline transactions={transactions} />
        </div>
      </div>

      <div className="dashboard-content-split">
        {/* Recent transactions */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Historial Reciente</div>
          <div className="log-table-container">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Moneda</th>
                  <th>Monto</th>
                  <th>Tipo / Detalle</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 4).map((log) => {
                  const isPositive = isPositiveTransaction(log.type);
                  const absAmount = log.amount_to;
                  const formattedAmt = isPositive
                    ? `+${absAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : `-${absAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                  const typeLabel = getTransactionTypeLabel(log.type);
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className="symbol-tag" style={{ fontSize: '10.5px', padding: '2px 6px', display: 'inline-block' }}>
                          {log.currency_to}
                        </span>
                      </td>
                      <td style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 'bold' }}>
                        {formattedAmt}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{typeLabel}</div>
                        <div className="small" style={{ fontSize: '10.5px' }}>{log.desc}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* El panel de verificación de S3 fue removido por ser solo para administrador */}
      </div>
    </div>
  );
}
