import { useEffect, useState } from 'react';

const SYMBOLS = ['$', '€', '£', '¥', '₿', '₹', '₩', '¤'];
const NEON_COLORS = [
  '#00f0ff', // cyan
  '#ff00f7', // magenta/pink
  '#39ff14', // neon green
  '#ffb700', // gold
  '#b200ff', // neon purple
];

interface SymbolItem {
  id: number;
  symbol: string;
  color: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  startTime: number;
}

export default function FloatingSymbols() {
  const [items, setItems] = useState<SymbolItem[]>([]);

  function createSymbol(id: number): SymbolItem {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] || '$';
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)] || '#00f0ff';
    const left = Math.random() * 100; // horizontal start position %
    const size = 12 + Math.random() * 20; // font size 12px to 32px
    const duration = 12 + Math.random() * 14; // speed: 12s to 26s
    const delay = Math.random() * -20; // negative delay so they spawn already scattered

    return {
      id,
      symbol,
      color,
      left,
      size,
      duration,
      delay,
      startTime: Date.now() + delay * 1000,
    };
  }

  useEffect(() => {
    // Generate 16 floating symbols with random parameters
    const initialItems = Array.from({ length: 16 }).map((_, idx) => createSymbol(idx));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization in a mount-only effect; not a cascading render
    setItems(initialItems);

    // Recycle symbols periodically to keep them infinite
    const interval = setInterval(() => {
      setItems((prev) => {
        return prev.map((item) => {
          // If the animation has likely finished (e.g., after its duration), reset it
          if (Date.now() - item.startTime > item.duration * 1000) {
            return createSymbol(item.id);
          }
          return item;
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="floating-symbols-container">
      <style>{`
        .floating-symbols-container {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          overflow: hidden;
          width: 100vw;
          height: 100vh;
        }
        .floating-symbol {
          position: absolute;
          bottom: -50px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 300;
          opacity: 0;
          user-select: none;
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.25;
          }
          90% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(-110vh) rotate(360deg) translateX(50px);
            opacity: 0;
          }
        }
      `}</style>
      {items.map((item) => (
        <span
          key={item.id}
          className="floating-symbol"
          style={{
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            color: item.color,
            textShadow: `0 0 8px ${item.color}, 0 0 2px rgba(255, 255, 255, 0.8)`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
}
