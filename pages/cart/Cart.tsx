import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export const Cart: React.FC = () => {
  const {
    items,
    totalAmount,
    totalItems,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid select-none relative">
      {/* scanlines filter */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyber-cyan hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Catálogo
        </Link>

        {/* Title */}
        <div className="border-b border-cyber-gray pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl uppercase text-white tracking-widest">
              Tu <span className="text-cyber-cyan neon-text-cyan">Carro</span>
            </h1>
            <p className="text-xs text-cyber-light/40 font-mono uppercase mt-1">
              Revisa los productos tácticos cargados a tu terminal de compra
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-xs font-mono uppercase text-cyber-pink hover:text-white transition-colors inline-flex items-center gap-2 border border-cyber-pink/30 hover:border-cyber-pink px-3 py-1.5 bg-cyber-pink/5 hover:bg-cyber-pink/15 cursor-pointer outline-none"
            >
              <Trash2 size={12} /> Vaciar Contenedor
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-cyber-card border border-cyber-gray p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center space-y-6 shadow-xl">
            <div className="w-16 h-16 border border-cyber-pink/40 flex items-center justify-center text-cyber-pink animate-pulse shadow-[0_0_15px_rgba(255,0,127,0.15)]">
              <Trash2 size={30} />
            </div>
            <div>
              <h2 className="font-display font-black text-lg uppercase text-white tracking-wide">
                Terminal de Carrito Vacía
              </h2>
              <p className="text-xs font-mono text-cyber-light/40 uppercase mt-2 max-w-sm">
                No tienes módulos activos guardados. Accede al catálogo para sincronizar nuevos componentes de tecnología y vestimenta.
              </p>
            </div>
            <Link to="/" className="btn-neon-cyan text-xs">
              EXPLORAR TECNOLOGÍA
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Products List (Col 2) */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="group relative bg-cyber-card border border-cyber-gray hover:border-cyber-cyan/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                >
                  {/* Neon tag ornament */}
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyber-gray group-hover:border-cyber-cyan transition-colors" />

                  {/* Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-cyber-black border border-cyber-gray overflow-hidden flex-shrink-0 relative">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col justify-between w-full">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-mono uppercase bg-cyber-gray border border-cyber-light/10 text-cyber-light/60 px-1.5 py-0.5">
                          {item.product.category}
                        </span>
                        <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-tight text-white mt-2 group-hover:text-cyber-cyan transition-colors">
                          {item.product.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-cyber-light/35 hover:text-cyber-pink transition-colors p-1.5 border border-transparent hover:border-cyber-pink/20 hover:bg-cyber-pink/5 cursor-pointer outline-none"
                        title="Eliminar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-cyber-gray/30 gap-4">
                      {/* Price controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyber-light/35 font-mono">CANTIDAD:</span>
                        <div className="flex items-center border border-cyber-gray bg-cyber-black">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-cyber-light hover:text-cyber-pink hover:bg-cyber-pink/10 transition-colors font-bold text-xs cursor-pointer outline-none"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-3 text-xs font-mono text-white min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="px-2.5 py-1 text-cyber-light hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors font-bold text-xs cursor-pointer outline-none disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        {item.quantity >= item.product.stock && (
                          <span className="text-[8px] font-mono text-cyber-yellow bg-cyber-yellow/10 px-2 py-0.5 border border-cyber-yellow/20">
                            MÁX. STOCK
                          </span>
                        )}
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <span className="text-[9px] text-cyber-light/35 font-mono block">SUBTOTAL ACCUL:</span>
                        <span className="font-display font-black text-base text-cyber-cyan neon-text-cyan">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary (Col 1) */}
            <div className="space-y-6">
              <div className="bg-cyber-card border border-cyber-gray p-6 relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-pink" />
                <h2 className="font-display font-black text-lg uppercase text-white tracking-widest mb-6">
                  Resumen de <span className="text-cyber-pink neon-text-pink">Orden</span>
                </h2>

                <div className="space-y-4 font-mono text-xs mb-6 border-b border-cyber-gray pb-6">
                  <div className="flex justify-between text-cyber-light/60">
                    <span>MÓDULOS CARGADOS:</span>
                    <span className="text-white font-bold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-cyber-light/60">
                    <span>SUBTOTAL NETO:</span>
                    <span className="text-white font-bold">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-cyber-light/60">
                    <span>ENVÍO CRIPTO-SECURE:</span>
                    <span className="text-cyber-lime font-bold">GRATIS</span>
                  </div>
                  <div className="flex justify-between text-cyber-light/60">
                    <span>IMPUESTOS (VAT 16%):</span>
                    <span className="text-white font-bold">$0.00</span>
                  </div>
                </div>

                <div className="flex justify-between font-display font-black text-lg uppercase tracking-wide mb-6">
                  <span className="text-white">TOTAL ORDEN:</span>
                  <span className="text-cyber-cyan neon-text-cyan">${totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full btn-neon-pink py-3 font-bold text-xs shadow-none hover:shadow-[0_0_15px_rgba(255,0,127,0.4)]"
                >
                  Proceder al Checkout
                </button>
              </div>

              {/* Security trust badges */}
              <div className="bg-cyber-card/40 border border-cyber-gray/40 p-4 space-y-3 font-mono text-[9px] text-cyber-light/50 uppercase">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-cyber-cyan flex-shrink-0" />
                  <span>Transacciones Cifradas SSL // Seguridad en Capas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-cyber-lime flex-shrink-0" />
                  <span>Envíos Rápidos Con Firma De Entrega Biométrica</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} className="text-cyber-pink flex-shrink-0" />
                  <span>Garantía de Devolución de 30 Días Garantizada</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
