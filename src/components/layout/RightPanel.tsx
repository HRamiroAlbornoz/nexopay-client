import { useExchangeRate } from '../../hooks/useExchangeRate';

export default function RightPanel() {
  const { rates, loading } = useExchangeRate();

  return (
    <aside className="right-panel">
      <div className="currency-feed" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="live-indicator"></span>
            <span className="small" style={{ fontWeight: 800 }}>Mercados en vivo</span>
          </div>
          <span className="badge">Live</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <span className="small">Cargando cotizaciones...</span>
          ) : (
            rates.map((ticker) => {
              const changeVal = ticker.price_change_percentage_24h || 0;
              const changeColor = changeVal >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
              const priceDisplay = ticker.current_price.toLocaleString(undefined, {
                minimumFractionDigits: ticker.symbol === 'ars' ? 4 : 2,
                maximumFractionDigits: ticker.symbol === 'ars' ? 4 : 2,
              });

              return (
                <div key={ticker.id} className="market-row">
                  <div>
                    <div style={{ fontWeight: 850, fontSize: '13.5px' }}>{ticker.symbol.toUpperCase()}</div>
                    <div className="small" style={{ fontSize: '11px' }}>{ticker.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="neon-text-price">${priceDisplay}</div>
                    <div style={{ fontSize: '11px', color: changeColor, fontWeight: 800 }}>
                      {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
