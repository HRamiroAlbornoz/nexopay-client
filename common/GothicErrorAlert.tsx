import React, { useState } from 'react';
import { Settings, Wrench, AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface GothicErrorAlertProps {
  error?: Error | string | null;
  resetErrorBoundary?: () => void;
  title?: string;
  customMessage?: string;
}

const GothicErrorAlert: React.FC<GothicErrorAlertProps> = ({
  error,
  resetErrorBoundary,
  title = 'SISTEMA COMPROMETIDO // APOCALIPSIS DIGITAL',
  customMessage = 'Nuestro equipo se encuentra trabajando para solucionar los inconvenientes',
}) => {
  const [showCodex, setShowCodex] = useState(false);

  // Extract the error message safely without using any
  const errorMessage = error
    ? typeof error === 'string'
      ? error
      : error.message || 'Error desconocido del sistema'
    : 'Excepción de ejecución indeterminada';

  const errorStack = error && typeof error === 'object' && 'stack' in error ? error.stack : undefined;

  return (
    <div className="w-full max-w-2xl mx-auto my-8 bg-cyber-card border-2 border-cyber-pink relative overflow-hidden shadow-[0_0_35px_rgba(255,0,127,0.25)] select-none">
      {/* Scanline CRT overlay specific for the error panel */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,0,127,0.15)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_8px] z-20" />
      
      {/* Gothic Cathedral Digital Arch Header - SVG Decorator */}
      <div className="h-12 bg-cyber-black border-b-2 border-cyber-pink relative flex items-center justify-between px-4">
        {/* Left Gothic Corner Ornament */}
        <svg className="w-6 h-6 text-cyber-pink fill-current" viewBox="0 0 24 24">
          <path d="M2,2 L10,2 C10,5 8,8 5,10 C3,11 2,13 2,15 L2,2 Z" />
          <circle cx="4" cy="4" r="1.5" className="fill-cyber-cyan" />
        </svg>

        <h2 className="font-gothic-deco text-sm md:text-base tracking-widest text-cyber-pink font-bold uppercase text-center animate-pulse flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-cyber-pink" />
          {title}
        </h2>

        {/* Right Gothic Corner Ornament */}
        <svg className="w-6 h-6 text-cyber-pink fill-current transform scale-x-[-1]" viewBox="0 0 24 24">
          <path d="M2,2 L10,2 C10,5 8,8 5,10 C3,11 2,13 2,15 L2,2 Z" />
          <circle cx="4" cy="4" r="1.5" className="fill-cyber-cyan" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        
        {/* Gears Adjustment Visualizer Box (Highly Customized Gothic-Cyberpunk Style) */}
        <div className="relative w-28 h-28 flex-shrink-0 bg-cyber-black border border-cyber-pink/40 flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,0,127,0.2)]">
          {/* Gothic Frame Border Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-cyan"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-cyan"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-cyan"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-cyan"></div>

          {/* Glowing Gothic Rose/Circle Background */}
          <div className="absolute w-20 h-20 rounded-full border border-cyber-pink/25 animate-pulse" />

          {/* Dual spinning gears logic representing active system maintenance */}
          <div className="absolute text-cyber-cyan animate-[spin_8s_linear_infinite]">
            <Settings className="w-16 h-16 opacity-85" />
          </div>
          
          <div className="absolute text-cyber-pink animate-[spin_4s_linear_infinite_reverse] translate-x-2 -translate-y-2">
            <Wrench className="w-8 h-8 opacity-90" />
          </div>

          {/* Wrench icon flashing in the center */}
          <div className="absolute text-cyber-light bg-cyber-black p-1 border border-cyber-pink/50 rounded-none animate-pulse">
            <Settings className="w-5 h-5 text-cyber-lime" />
          </div>
        </div>

        {/* Text and Description */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h3 className="font-gothic text-xl text-white tracking-wide uppercase border-b border-cyber-gray pb-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <span>NÚCLEO EN REPARACIÓN</span>
              <span className="font-mono text-[9px] px-2 py-0.5 bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30 uppercase tracking-widest self-start sm:self-auto">
                Código: 500_FAIL
              </span>
            </h3>
          </div>
          
          <p className="font-gothic text-base text-cyber-light/95 leading-relaxed tracking-wider">
            {customMessage}
          </p>

          <p className="font-mono text-xs text-cyber-cyan/90 bg-cyber-cyan/5 p-3 border-l-2 border-cyber-cyan">
            <span className="font-bold">SITUACIÓN GENERAL:</span> Se ha desencadenado una anomalía crítica en el flujo de la red. Nuestro equipo ya se encuentra ajustando los engranajes digitales para restablecer el canal de inmediato.
          </p>
        </div>
      </div>

      {/* Accordion debug info for admins/devs */}
      <div className="border-t border-cyber-pink/20 bg-cyber-black/40">
        <button
          onClick={() => setShowCodex(!showCodex)}
          className="w-full px-6 py-3 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-cyber-light/50 hover:text-cyber-pink hover:bg-cyber-pink/5 transition-all duration-300 outline-none"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            Códice de Fallos del Sistema (Debug Log)
          </span>
          {showCodex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCodex && (
          <div className="px-6 pb-6 pt-2 font-mono text-[11px] text-cyber-pink/90 border-t border-cyber-pink/10 bg-cyber-black/80 space-y-3">
            <div className="border border-cyber-pink/30 p-3 bg-cyber-pink/5 overflow-x-auto max-h-48 no-scrollbar rounded-none">
              <div className="font-bold mb-1 text-cyber-cyan uppercase">// DESCRIPCIÓN DE EXCEPCIÓN:</div>
              <div className="whitespace-pre-wrap leading-relaxed select-text">{errorMessage}</div>
              
              {errorStack && (
                <>
                  <div className="font-bold mt-3 mb-1 text-cyber-cyan uppercase">// RUTA DEL APOCALIPSIS (STACK TRACE):</div>
                  <pre className="whitespace-pre text-[9px] leading-tight select-text text-cyber-pink/70">{errorStack}</pre>
                </>
              )}
            </div>
            <div className="text-[10px] text-cyber-light/40 uppercase tracking-wider text-right">
              REGISTRO DE ERROR ENCRIPTADO Y ENVIADO A LA MATRIZ.
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 md:p-6 border-t-2 border-cyber-pink/60 bg-cyber-black/80 flex flex-col sm:flex-row justify-end items-center gap-3">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 btn-neon-pink px-6 py-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            REINVOCAR SISTEMA
          </button>
        )}
        <LinkButton
          to="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 btn-neon-cyan px-6 py-2"
        >
          <Home className="w-4 h-4" />
          SANTUARIO PRINCIPAL
        </LinkButton>
      </div>
    </div>
  );
};

// Internal router navigation wrapper or standard anchor fallback (shielded from React-Router context errors)
const LinkButton: React.FC<{ to: string; className: string; children: React.ReactNode }> = ({
  to,
  className,
  children,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If we are completely outside a React Router context, fallback to direct page reload
    try {
      // We will perform a simple redirection
      window.location.href = to;
    } catch {
      e.preventDefault();
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default GothicErrorAlert;
