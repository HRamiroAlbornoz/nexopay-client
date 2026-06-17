import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import FilterBar from '../../components/products/FilterBar';
import ProductCard from '../../components/products/ProductCard';
import Spinner from '../../components/common/Spinner';
import { Cpu, Sparkles, Share2, Copy, Check } from 'lucide-react';

export const Home: React.FC = () => {
  const { products, loading, error, hasMore, loadNextPage, totalProducts } = useProducts();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24 select-none relative">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10" />

      {/* HERO SECTION */}
      <header className="street-hero urban-panel relative min-h-[72vh] overflow-hidden border-cyber-cyan/30 py-14 md:py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <div className="capsule-field">
          <span />
          <span />
          <span />
          <span />
        </div>
        {/* Background glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyber-yellow/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyber-pink/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 z-10">
          <img
            src="/assets/charry-street-logo.svg"
            alt="Logo La Tienda de Charry"
            className="mx-auto h-28 w-28 md:h-36 md:w-36 object-contain drop-shadow-[0_0_24px_rgba(0,240,255,0.5)]"
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-yellow/10 border border-cyber-yellow/40 text-cyber-yellow font-mono text-[9px] uppercase tracking-widest animate-pulse">
            <Sparkles size={10} /> Callejon neon // moda urbana seleccionada
          </div>
          
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase text-white tracking-widest leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            STREET <span className="text-cyber-cyan neon-text-cyan">CHARRY</span>
          </h1>
          
          <p className="font-mono text-xs md:text-sm text-cyber-light/60 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            Equipamiento urbano, tecnologia futurista y actitud street con acentos neon, escudos graficos y energia de ciudad.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 relative">
            <button
              onClick={() => {
                const element = document.getElementById('catalog-anchor');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-neon-cyan px-8 py-3 text-xs"
            >
              INGRESE AL CATÁLOGO
            </button>

            {/* Hero Share Button */}
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="btn-neon-pink px-8 py-3 text-xs flex items-center gap-2 rounded-none"
              >
                <Share2 size={12} className="animate-pulse" />
                <span>COMPARTIR</span>
              </button>
              
              {shareOpen && (
                <>
                  {/* Overlay to close the dropdown */}
                  <div
                    className="fixed inset-0 z-30 bg-transparent"
                    onClick={() => setShareOpen(false)}
                  />
                  {/* Dropdown content */}
                  <div className="urban-panel absolute left-1/2 -translate-x-1/2 mt-3 w-52 border-2 border-cyber-pink p-3 space-y-2 z-45 shadow-[0_0_25px_rgba(255,0,127,0.35)] animate-slide-in font-mono text-[10px] text-left rounded-none">
                    <div className="text-[8px] text-cyber-pink font-bold border-b border-cyber-pink/20 pb-1.5 tracking-widest uppercase">
                      COMPARTIR MÓDULO_
                    </div>
                    
                    {/* GitHub */}
                    <a
                      href="https://github.com/rich10anderson-ops/Proyecto-M5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-cyber-cyan" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      <span>GITHUB REPO</span>
                    </a>
                    
                    {/* WhatsApp */}
                    <a
                      href="https://api.whatsapp.com/send?text=Mira%20este%20incre%C3%ADble%20proyecto%20de%20streetwear%20y%20tecnolog%C3%ADa%20ne%C3%B3n%20%22Neon%20Tech%22%3A%20https%3A%2F%2Fgithub.com%2Frich10anderson-ops%2FProyecto-M5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-cyber-lime" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.856 0 10.622-4.766 10.625-10.623.001-2.837-1.1-5.507-3.101-7.51-2.001-2.002-4.666-3.102-7.502-3.103-5.858 0-10.625 4.767-10.628 10.625-.001 1.986.518 3.926 1.504 5.642l-1.01 3.693 3.784-.992zm10.965-7.37c-.3-.15-1.774-.875-2.046-.975-.273-.1-.472-.15-.67.15-.198.3-.77.975-.943 1.173-.173.198-.347.223-.647.073-.3-.15-1.267-.467-2.414-1.492-.893-.797-1.496-1.78-1.673-2.08-.176-.3-.019-.462.13-.61.135-.133.3-.347.45-.52.15-.173.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.62-.92-2.2-.243-.585-.49-.507-.67-.516-.174-.008-.373-.01-.572-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.105 3.213 5.097 4.506.712.308 1.268.492 1.7.63.717.227 1.37.195 1.887.118.577-.087 1.774-.725 2.022-1.425.247-.7.247-1.3.173-1.425-.074-.124-.272-.2-.572-.35z"/>
                      </svg>
                      <span>WHATSAPP</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fgithub.com%2Frich10anderson-ops%2FProyecto-M5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-cyber-cyan" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>FACEBOOK</span>
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 text-cyber-pink fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                      <span>INSTAGRAM</span>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fgithub.com%2Frich10anderson-ops%2FProyecto-M5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-cyber-cyan" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LINKEDIN</span>
                    </a>

                    {/* Twitter/X */}
                    <a
                      href="https://twitter.com/intent/tweet?text=Mira%20este%20incre%C3%ADble%20proyecto%20de%20streetwear%20y%20tecnolog%C3%ADa%20ne%C3%B3n%20%22Neon%20Tech%22!%20https%3A%2F%2Fgithub.com%2Frich10anderson-ops%2FProyecto-M5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-cyber-cyan" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>X / TWITTER</span>
                    </a>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2.5 p-1.5 hover:bg-cyber-pink/15 text-white hover:text-cyber-pink transition-all border border-transparent hover:border-cyber-pink/20 bg-transparent text-left cursor-pointer outline-none font-mono text-[10px] rounded-none"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-cyber-lime animate-bounce" />
                          <span className="text-cyber-lime font-bold">¡COPIADO!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-cyber-cyan" />
                          <span>COPIAR ENLACE</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CATALOG */}
      <main id="catalog-anchor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 z-10 relative">
        {/* Filter & Search Bar */}
        <FilterBar />

        {/* Catalog Metadata Info */}
        <div className="urban-panel flex justify-between items-center mb-6 font-mono text-[10px] text-cyber-light/60 uppercase tracking-widest p-3">
          <span>CATÁLOGO PRINCIPAL // REGISTRO</span>
          <span>
            {loading && products.length === 0 ? 'CONECTANDO...' : `${products.length} / ${totalProducts} PRODUCTOS`}
          </span>
        </div>

        {/* Errors Block */}
        {error && (
          <div className="urban-panel border-cyber-pink/55 p-4 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="text-cyber-pink text-xs uppercase font-mono">{error}</div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 && !loading ? (
          <div className="urban-panel p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <Cpu className="text-cyber-light/30 mx-auto animate-spin" size={30} />
            <h3 className="font-display font-black text-sm uppercase text-white tracking-widest">
              SIN RESULTADOS DE BÚSQUEDA
            </h3>
            <p className="text-[10px] font-mono text-cyber-light/40 uppercase">
              No se han encontrado módulos que coincidan con los filtros de red aplicados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}

            {/* Skeletons on initial loading */}
            {loading && products.length === 0 && (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="urban-panel border-cyber-gray/30 p-4 space-y-4 animate-pulse">
                  <div className="aspect-square bg-cyber-gray/50 w-full rounded-none" />
                  <div className="space-y-2">
                    <div className="h-3 bg-cyber-gray/50 w-1/3 rounded-none" />
                    <div className="h-4 bg-cyber-gray/50 w-3/4 rounded-none" />
                    <div className="h-4 bg-cyber-gray/50 w-1/2 rounded-none" />
                  </div>
                  <div className="h-10 bg-cyber-gray/50 w-full rounded-none" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Load More Pagination Button */}
        {hasMore && (
          <div className="flex justify-center mt-12 pt-6 border-t border-cyber-gray/30">
            <button
              onClick={loadNextPage}
              disabled={loading}
              className="btn-neon-cyan py-3 px-8 text-xs flex items-center justify-center gap-2 shadow-none hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>CONECTANDO MÓDULOS...</span>
                </>
              ) : (
                'CARGAR MÁS ARTEFACTOS'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
