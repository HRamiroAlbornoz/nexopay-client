import { useEffect, useState } from 'react';
import { useExchangeRate } from '../../hooks/useExchangeRate';

export default function RightPanel() {
  const { rates, loading, lastUpdate } = useExchangeRate();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- visual flash animation trigger
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <aside className="right-panel">
      <div className="currency-feed" style={{ width: '100%', transition: 'box-shadow 0.3s ease', boxShadow: flash ? '0 0 15px rgba(243, 186, 47, 0.2)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="live-indicator" style={{ animationDuration: flash ? '0.5s' : '2s' }}></span>
            <span className="small" style={{ fontWeight: 800 }}>Mercados en vivo</span>
          </div>
          <span className="badge" style={{ backgroundColor: flash ? 'rgba(243, 186, 47, 0.2)' : '' }}>Live</span>
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
                <div key={ticker.id} className="market-row" style={{ backgroundColor: flash ? 'rgba(255, 255, 255, 0.05)' : 'transparent', transition: 'background-color 0.5s ease' }}>
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
