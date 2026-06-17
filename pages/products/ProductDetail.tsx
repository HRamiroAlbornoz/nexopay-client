import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import RatingStars from '../../components/products/RatingStars';
import ReviewSection from '../../components/products/ReviewSection';
import Spinner from '../../components/common/Spinner';
import { Product } from '../../types';
import { ShoppingCart, ArrowLeft, ShieldAlert, BadgeCheck, RotateCcw, Cpu } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchProductById } = useProducts();
  const { items, addItem, updateQuantity, setCartOpen } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [qty, setQty] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    const getProduct = async () => {
      if (id) {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center space-y-4">
        <Spinner />
        <span className="text-[10px] font-mono text-cyber-light/40 uppercase">
          Estableciendo enlace de producto...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="text-cyber-pink animate-bounce mb-4" size={40} />
        <h2 className="font-display font-black text-lg uppercase text-white tracking-widest">
          ERROR DE ENLACE // PRODUCTO NO REGISTRADO
        </h2>
        <p className="text-xs font-mono text-cyber-light/40 mt-2 uppercase max-w-sm">
          La base de datos central no registra un artefacto con el identificador solicitado.
        </p>
        <Link to="/" className="btn-neon-cyan mt-6 text-xs">
          VOLVER AL CATÁLOGO
        </Link>
      </div>
    );
  }

  const { name, description, price, category, imageUrl, stock, averageRating = 5.0, totalReviews = 0 } = product;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    setAdding(true);
    
    // Check if product is already in cart to calculate correct new quantity
    const existingCartItem = items.find(item => item.product.id === product.id);
    const currentQtyInCart = existingCartItem ? existingCartItem.quantity : 0;
    const finalQty = Math.min(currentQtyInCart + qty, stock);
    
    if (existingCartItem) {
      updateQuantity(product.id, finalQty);
    } else {
      // Add first item, then update to the requested qty
      addItem(product);
      if (qty > 1) {
        updateQuantity(product.id, qty);
      }
    }
    
    setTimeout(() => {
      setAdding(false);
      setCartOpen(true); // Open the drawer so the user sees their updated cargo!
    }, 600);
  };

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid select-none relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyber-cyan hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Catálogo
        </Link>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-12">
          {/* Left Column: Premium Image Container */}
          <div className="bg-cyber-card border border-cyber-gray p-4 flex items-center justify-center relative overflow-hidden group min-h-[320px] md:min-h-[450px]">
            {/* Visual cyber borders */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan" />

            <div className="w-full h-full bg-cyber-black overflow-hidden relative border border-cyber-gray/40">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cyber-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Specifications and Actions */}
          <div className="bg-cyber-card border border-cyber-gray p-6 sm:p-8 flex flex-col justify-between relative">
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-pink" />
            
            <div className="space-y-6">
              {/* Category & Stock Badges */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono uppercase bg-cyber-gray border border-cyber-light/10 text-cyber-light/60 px-2 py-0.5 tracking-wider">
                  {category}
                </span>

                {isOutOfStock ? (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 border border-cyber-pink text-cyber-pink bg-cyber-pink/10 shadow-neon-pink">
                    AGOTADO
                  </span>
                ) : stock <= 5 ? (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 border border-cyber-yellow text-cyber-yellow bg-cyber-yellow/10">
                    ÚLTIMAS {stock} UNIDADES
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 border border-cyber-lime text-cyber-lime bg-cyber-lime/10">
                    DISPONIBLE ({stock} U)
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase text-white tracking-wide">
                {name}
              </h1>

              {/* Rating aggregate summary */}
              <div className="flex items-center gap-3 border-b border-cyber-gray pb-4">
                <RatingStars rating={averageRating} size={14} />
                <span className="text-[10px] font-mono text-cyber-light/45 uppercase mt-0.5">
                  ({totalReviews} calificaciones de exploradores)
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-cyber-light/35 uppercase tracking-widest block">
                  ESPECIFICACIONES DE DISEÑO
                </span>
                <p className="text-xs text-cyber-light/75 leading-relaxed font-sans uppercase">
                  {description}
                </p>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-cyber-gray/30">
                <span className="text-[9px] font-mono text-cyber-light/35 uppercase block">VALOR TERMINAL NETO:</span>
                <span className="font-display font-black text-3xl text-cyber-cyan neon-text-cyan">
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions panel */}
            <div className="mt-8 pt-6 border-t border-cyber-gray space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-cyber-light/50 font-mono">SELECCIONAR CANTIDAD:</span>
                  <div className="flex items-center border border-cyber-gray bg-cyber-black">
                    <button
                      onClick={() => setQty(prev => Math.max(prev - 1, 1))}
                      className="px-3 py-1.5 text-cyber-light hover:text-cyber-pink hover:bg-cyber-pink/10 transition-colors font-bold text-sm cursor-pointer outline-none"
                    >
                      -
                    </button>
                    <span className="px-4 text-xs font-mono text-white min-w-[32px] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(prev => Math.min(prev + 1, stock))}
                      disabled={qty >= stock}
                      className="px-3 py-1.5 text-cyber-light hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors font-bold text-sm cursor-pointer outline-none disabled:opacity-20"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={`w-full flex items-center justify-center gap-3 py-3 font-display font-black text-xs uppercase tracking-widest transition-all duration-300 outline-none ${
                  isOutOfStock
                    ? 'border-2 border-cyber-gray text-cyber-light/20 cursor-not-allowed bg-transparent'
                    : 'btn-neon-pink shadow-none hover:shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                }`}
              >
                <ShoppingCart size={16} className={adding ? 'animate-bounce' : ''} />
                {isOutOfStock ? 'AGOTADO' : adding ? 'SINCRONIZANDO...' : 'CARGAR A ORDEN'}
              </button>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyber-gray/30 text-[9px] font-mono text-cyber-light/40 uppercase">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck size={12} className="text-cyber-lime" />
                  <span>Hardware Certificado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={12} className="text-cyber-cyan" />
                  <span>Garantía de Red</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews thread */}
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetail;
