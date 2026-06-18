import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useTransactions } from '../../hooks/useTransactions';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import BalanceChart, { type BalanceDataPoint } from '../../components/charts/BalanceChart/BalanceChart';
import TransactionTimeline from '../../components/charts/TransactionTimeline/TransactionTimeline';
import { createStripeCheckout } from '../../api-calls/transactions/deposit.post';

export default function Dashboard() {
  const { user } = useAuth();
  const { balances, updateBalance } = useWallet();
  const { transactions, addTransaction } = useTransactions();
  const { rates } = useExchangeRate();

  const [depAmount, setDepAmount] = useState('');
  const [depSymbol, setDepSymbol] = useState<'ARS' | 'USD' | 'EUR'>('USD');
  const [isDepositing, setIsDepositing] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('Pendiente');
  const [isUploading, setIsUploading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Escuchar si venimos redirigidos desde un pago exitoso de Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- alerta de un solo uso tras redirección
      setAlert({ message: '¡Pago recibido! Tu depósito se ha procesado con éxito en Stripe.', type: 'success' });
      
      // Simulación optimista: aplicamos el saldo localmente ya que el Webhook real aún no está en Railway
      const pendingStr = sessionStorage.getItem('pending_deposit');
      if (pendingStr) {
        try {
          const { amount, currency } = JSON.parse(pendingStr);
          updateBalance(currency, amount);
          addTransaction({
            type: 'transfer_in',
            currency_from: currency,
            currency_to: currency,
            amount_from: amount,
            amount_to: amount,
            exchange_rate: 1.0,
          });
        } catch (err) {
          console.error('No se pudo restaurar el depósito pendiente', err);
        }
        sessionStorage.removeItem('pending_deposit');
      }

      // Limpiamos la URL para no repetir el alert si recarga
      navigate('/dashboard', { replace: true });
    } else if (canceled) {
      sessionStorage.removeItem('pending_deposit');
       
      setAlert({ message: 'El proceso de pago fue cancelado.', type: 'warning' });
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate, updateBalance, addTransaction]);

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

  // Genera datos históricos de balance reales a partir de las transacciones
  const balanceChartData = useMemo((): BalanceDataPoint[] => {
    if (!balances || balances.length === 0) return [];

    const points: BalanceDataPoint[] = [];
    let currentARS = balances.find((b) => b.currency_code === 'ARS')?.amount || 0;
    let currentUSD = balances.find((b) => b.currency_code === 'USD')?.amount || 0;
    let currentEUR = balances.find((b) => b.currency_code === 'EUR')?.amount || 0;

    // Ordenar transacciones de más reciente a más antigua
    const sortedTx = [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const now = new Date();
    // Retroceder día a día para reconstruir el saldo
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

      // Registrar el balance al final del día `d`
      points.unshift({
        date: dateStr,
        ARS: parseFloat(currentARS.toFixed(2)),
        USD: parseFloat(currentUSD.toFixed(2)),
        EUR: parseFloat(currentEUR.toFixed(2)),
      });

      // Restar los movimientos que ocurrieron en el día `d` para obtener el saldo del día anterior
      const txOnDay = sortedTx.filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate.getDate() === d.getDate() && txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      });

      txOnDay.forEach((tx) => {
        // Revertir la operación
        if (tx.currency_to === 'ARS') currentARS -= tx.amount_to;
        if (tx.currency_to === 'USD') currentUSD -= tx.amount_to;
        if (tx.currency_to === 'EUR') currentEUR -= tx.amount_to;
        
        // Si hay una moneda de origen, revertir el descuento (sumarla de vuelta)
        if (tx.currency_from && tx.currency_from === 'ARS') currentARS += tx.amount_from;
        if (tx.currency_from && tx.currency_from === 'USD') currentUSD += tx.amount_from;
        if (tx.currency_from && tx.currency_from === 'EUR') currentEUR += tx.amount_from;
      });
    }

    return points;
  }, [balances, transactions]);

  const handleDepositSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAlert(null);
    const amount = Number(depAmount);
    if (!depAmount || amount <= 0) {
      setAlert({ message: 'Ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }

    if (!user) {
      setAlert({ message: 'Debes iniciar sesión para fondear.', type: 'error' });
      return;
    }

    setIsDepositing(true);
    try {
      // Guardar monto localmente para sumarlo al retornar (Optimistic UI fallback)
      sessionStorage.setItem('pending_deposit', JSON.stringify({ amount, currency: depSymbol }));

      // 1. Llamar a la Vercel Function de Stripe
      const res = await createStripeCheckout({
        amount,
        currency: depSymbol,
        email: user.email,
        userId: user.id,
      });

      // 2. Redirigir a la URL de pago de Stripe (Checkout)
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: 'No se pudo iniciar el proceso de pago con Stripe.', type: 'error' });
      setIsDepositing(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAlert(null);
    setIsUploading(true);
    setDocumentStatus('Subiendo');
    setTimeout(() => {
      setDocumentStatus('Guardado local');
      setAlert({ message: 'Simulación: Documento cargado localmente. Hernán debe habilitar /api/get-presigned-url.', type: 'success' });
      setIsUploading(false);
      event.target.value = '';
    }, 1200);
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
        <div className="dashboard-stat-card">
          <div className="stat-label">Historial de Operaciones</div>
          <div className="stat-value">{transactions.length}</div>
          <div className="small">Transacciones registradas</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-label">Estado de Verificación</div>
          <div className="stat-value status-value" style={{ color: documentStatus.includes('Guardado') ? '#00e676' : '#ffb700' }}>
            {documentStatus}
          </div>
          <div className="small">Identidad y origen de fondos</div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-content-split" style={{ marginBottom: 20 }}>
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Evolución de Balances (7 días)</div>
          <BalanceChart data={balanceChartData} />
        </div>
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Timeline de Transacciones</div>
          <TransactionTimeline transactions={transactions} />
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

        {/* Deposit Form */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Ingresar Fondos</div>
          <form className="deposit-form" onSubmit={handleDepositSubmit}>
            <div className="form-group">
              <label>Divisa activa</label>
              <select className="form-select" value={depSymbol} onChange={(e) => setDepSymbol(e.target.value as 'ARS' | 'USD' | 'EUR')}>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="ARS">ARS - Peso Argentino</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monto</label>
              <input
                type="number" placeholder="0.00" value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                className="neon-input" min="0" step="any" required disabled={isDepositing}
              />
            </div>
            <button type="submit" className="btn btn-primary wide" style={{ marginTop: '10px' }} disabled={isDepositing}>
              {isDepositing ? 'Conectando con Stripe...' : 'Depositar con Tarjeta'}
            </button>
          </form>
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
                  const isPositive = log.type === 'buy' || log.type === 'transfer_in';
                  const absAmount = log.amount_to;
                  const formattedAmt = isPositive
                    ? `+${absAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : `-${absAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                  const typeLabel =
                    log.type === 'buy'         ? 'Compra' :
                    log.type === 'sell'        ? 'Venta' :
                    log.type === 'exchange'    ? 'Conversión' :
                    log.type === 'transfer_in' ? 'Transf. Recibida' : 'Transf. Enviada';
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

        {/* Verification */}
        <div className="dashboard-sub-panel">
          <div className="dashboard-section-title">Documento de Verificación</div>
          <p className="small">Sube tu identificación o comprobante de fondos para habilitar límites superiores.</p>
          <label className="upload-box" style={{ marginTop: '16px' }}>
            <input type="file" accept="image/*,application/pdf" onChange={handleDocumentUpload} disabled={isUploading} />
            <span>{isUploading ? 'Subiendo archivo...' : 'Seleccionar documento'}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
