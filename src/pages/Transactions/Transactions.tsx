import { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import {
  createBuyTransaction,
  createSellTransaction,
  createExchangeTransaction,
} from '../../api-calls/transactions/transactions.post';
import { ApiError } from '../../lib/apiError';
import { isPositiveTransaction, getTransactionTypeLabel } from '../../lib/transactionLabels';
import { sendTransactionConfirmationEmail } from '../../lib/transactionEmail';
import type { CurrencyCode } from '../../types/currency.types';

export default function Transactions() {
  const { user, logout } = useAuth();
  const { transactions, refetch: refetchTransactions } = useTransactions();
  const { balances, updateBalance } = useWallet();

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('ARS');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD');
  const [amount, setAmount] = useState('');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalLogs = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const convertAmount = Number(amount);
    if (!amount || convertAmount <= 0) {
      setAlert({ message: 'Ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }

    if (fromCurrency === toCurrency) {
      setAlert({ message: 'Las monedas de origen y destino deben ser diferentes.', type: 'warning' });
      return;
    }

    const currentBalance = balances.find((b) => b.currency_code === fromCurrency)?.amount || 0;
    if (convertAmount > currentBalance) {
      setAlert({ message: 'Saldo insuficiente para completar esta conversión.', type: 'error' });
      return;
    }

    setIsConverting(true);
    try {
      const transaction =
        fromCurrency === 'ARS'
          ? await createBuyTransaction({ currency_to: toCurrency as Exclude<CurrencyCode, 'ARS'>, amount_from: convertAmount })
          : toCurrency === 'ARS'
          ? await createSellTransaction({ currency_from: fromCurrency as Exclude<CurrencyCode, 'ARS'>, amount_from: convertAmount })
          : await createExchangeTransaction({ currency_from: fromCurrency, currency_to: toCurrency, amount_from: convertAmount });

      updateBalance(fromCurrency, -transaction.amount_from);
      updateBalance(toCurrency, transaction.amount_to);
      await refetchTransactions();
      if (user) {
        sendTransactionConfirmationEmail(transaction, user);
      }

      setAlert({
        message: `¡Conversión exitosa! Cambiaste ${transaction.amount_from.toFixed(2)} ${fromCurrency} por ${transaction.amount_to.toFixed(2)} ${toCurrency}.`,
        type: 'success',
      });
      setAmount('');
      setCurrentPage(1);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setAlert({ message: err.message, type: 'error' });
      } else {
        setAlert({ message: 'No se pudo completar la conversión.', type: 'error' });
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div>
          <div className="section-kicker">Auditoría Transaccional</div>
          <h2 className="trade-title">Historial de Operaciones</h2>
          <p className="small">Consulta tus registros y realiza conversiones de divisas.</p>
        </div>
        <div className="badge">Registros de Fondos</div>
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
        {/* Logs Table */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Historial de Capital</div>
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
                {paginatedLogs.map((log) => {
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
                        <div className="small" style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{log.desc}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
            <div className="small">
              Mostrando {Math.min(totalLogs, (currentPage - 1) * pageSize + 1)} - {Math.min(totalLogs, currentPage * pageSize)} de {totalLogs}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 12px', minHeight: '32px' }}
                onClick={() => setCurrentPage((val) => Math.max(1, val - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </button>
              <span className="small" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 12px', minHeight: '32px' }}
                onClick={() => setCurrentPage((val) => Math.min(totalPages, val + 1))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Converter Panel */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Convertidor de Divisas</div>
          <form className="deposit-form" onSubmit={handleConvert}>
            <div className="form-group">
              <label htmlFor="from-currency-select">Moneda de Origen</label>
              <select
                id="from-currency-select"
                className="form-select"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as 'ARS' | 'USD' | 'EUR')}
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="to-currency-select">Moneda de Destino</label>
              <select
                id="to-currency-select"
                className="form-select"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as 'ARS' | 'USD' | 'EUR')}
              >
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="ARS">ARS - Peso Argentino</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="convert-amount-input">Monto a Convertir</label>
              <input
                id="convert-amount-input"
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
            <button type="submit" disabled={isConverting} className="btn btn-primary wide" style={{ marginTop: '10px' }}>
              {isConverting ? 'Convirtiendo...' : 'Convertir saldo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
