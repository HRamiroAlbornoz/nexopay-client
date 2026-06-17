import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { createOrder } from '../../services/firebase/firestore';
import { ShippingDetails, Order } from '../../types';
import Spinner from '../../components/common/Spinner';
import {
  FileText,
  Truck,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';

type CheckoutStep = 'review' | 'shipping' | 'payment' | 'success';

export const Checkout: React.FC = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckoutStep>('review');
  const [loading, setLoading] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');

  // Shipping details state
  const [shipping, setShipping] = useState<ShippingDetails>({
    name: profile?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingDetails>>({});

  // Credit Card details state
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Redirect if cart is empty and we are not in success phase
  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-4 select-none text-center">
        <AlertTriangle className="text-cyber-yellow animate-bounce mb-4" size={40} />
        <h2 className="font-display font-black text-lg uppercase text-white tracking-widest">
          Carro de compras vacío
        </h2>
        <p className="text-xs font-mono text-cyber-light/40 mt-2 uppercase max-w-sm">
          No puedes iniciar checkout sin cargamentos activos en tu almacenamiento.
        </p>
        <Link to="/" className="btn-neon-cyan mt-6 text-xs">
          VOLVER AL INICIO
        </Link>
      </div>
    );
  }

  // Handle shipping input changes
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    if (shippingErrors[name as keyof ShippingDetails]) {
      setShippingErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate shipping details
  const validateShipping = (): boolean => {
    const errors: Partial<ShippingDetails> = {};
    if (!shipping.name.trim()) errors.name = 'El nombre completo es obligatorio.';
    if (!shipping.address.trim()) errors.address = 'La dirección es obligatoria.';
    if (!shipping.city.trim()) errors.city = 'La ciudad es obligatoria.';
    if (!shipping.postalCode.trim()) errors.postalCode = 'El código postal es obligatorio.';
    if (!shipping.country.trim()) errors.country = 'El país es obligatorio.';
    if (!shipping.phone.trim()) errors.phone = 'El número de teléfono es obligatorio.';

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep('payment');
    }
  };

  // Handle credit card input changes
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    // Apply simple character restrictions
    if (name === 'number') {
      value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      value = value.match(/.{1,4}/g)?.join(' ') || value; // format in groups of 4
      if (value.length > 19) return;
    }
    if (name === 'expiry') {
      value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
      }
      if (value.length > 5) return;
    }
    if (name === 'cvc') {
      value = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (value.length > 3) return;
    }

    setCard((prev) => ({ ...prev, [name]: value }));
    if (cardErrors[name]) {
      setCardErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate credit card details
  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    if (card.number.replace(/\s/g, '').length !== 16) {
      errors.number = 'El número de tarjeta debe tener 16 dígitos.';
    }
    if (!card.name.trim()) {
      errors.name = 'El nombre del tarjetahabiente es obligatorio.';
    }
    if (card.expiry.length !== 5) {
      errors.expiry = 'Ingresa una fecha de expiración válida (MM/AA).';
    }
    if (card.cvc.length !== 3) {
      errors.cvc = 'El CVC debe tener 3 dígitos.';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) return;

    setLoading(true);

    // Simulate standard transaction processing latency (looks awesome!)
    setTimeout(async () => {
      try {
        const orderPayload: Omit<Order, 'id'> = {
          userId: user?.uid || 'guest-user',
          userEmail: user?.email || 'guest@neontech.com',
          userName: profile?.name || 'Cliente Neon',
          items,
          total: totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          shippingDetails: shipping,
        };

        const newId = await createOrder(orderPayload);
        setCreatedOrderId(newId);
        clearCart();
        setStep('success');
      } catch (err) {
        console.error(err);
        alert('Error al registrar la transacción. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid relative select-none">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* PROGRESS STEPPER */}
        <div className="flex items-center justify-between max-w-lg mx-auto mb-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center font-display font-black text-xs border transition-all ${
                step === 'review'
                  ? 'border-cyber-cyan text-cyber-black bg-cyber-cyan shadow-neon-cyan'
                  : 'border-cyber-gray text-cyber-light/40 bg-cyber-card'
              }`}
            >
              01
            </div>
            <span className="text-[9px] font-mono uppercase mt-2 tracking-wider text-cyber-light/50">
              Resumen
            </span>
          </div>

          <div
            className={`flex-grow h-[1px] mx-2 ${
              step !== 'review' ? 'bg-cyber-cyan' : 'bg-cyber-gray'
            }`}
          />

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center font-display font-black text-xs border transition-all ${
                step === 'shipping'
                  ? 'border-cyber-cyan text-cyber-black bg-cyber-cyan shadow-neon-cyan'
                  : step === 'payment' || step === 'success'
                  ? 'border-cyber-cyan text-cyber-cyan bg-cyber-black'
                  : 'border-cyber-gray text-cyber-light/40 bg-cyber-card'
              }`}
            >
              02
            </div>
            <span className="text-[9px] font-mono uppercase mt-2 tracking-wider text-cyber-light/50">
              Envío
            </span>
          </div>

          <div
            className={`flex-grow h-[1px] mx-2 ${
              step === 'payment' || step === 'success' ? 'bg-cyber-cyan' : 'bg-cyber-gray'
            }`}
          />

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center font-display font-black text-xs border transition-all ${
                step === 'payment'
                  ? 'border-cyber-cyan text-cyber-black bg-cyber-cyan shadow-neon-cyan'
                  : step === 'success'
                  ? 'border-cyber-cyan text-cyber-cyan bg-cyber-black'
                  : 'border-cyber-gray text-cyber-light/40 bg-cyber-card'
              }`}
            >
              03
            </div>
            <span className="text-[9px] font-mono uppercase mt-2 tracking-wider text-cyber-light/50">
              Pago
            </span>
          </div>

          <div
            className={`flex-grow h-[1px] mx-2 ${
              step === 'success' ? 'bg-cyber-lime animate-pulse' : 'bg-cyber-gray'
            }`}
          />

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center font-display font-black text-xs border transition-all ${
                step === 'success'
                  ? 'border-cyber-lime text-cyber-black bg-cyber-lime shadow-neon-lime'
                  : 'border-cyber-gray text-cyber-light/40 bg-cyber-card'
              }`}
            >
              04
            </div>
            <span className="text-[9px] font-mono uppercase mt-2 tracking-wider text-cyber-light/50">
              Éxito
            </span>
          </div>
        </div>

        {/* LOADING OVERLAY FOR SIMULATED TRANSACTION */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-cyber-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
            <Spinner />
            <div className="text-center max-w-sm p-4 space-y-2">
              <h3 className="font-display font-black text-sm uppercase text-cyber-cyan tracking-widest animate-pulse">
                PROCESANDO TRANSACCIÓN SECURE-CYBER
              </h3>
              <p className="text-[10px] font-mono text-cyber-light/40 uppercase">
                Estableciendo enlace SSL con la terminal bancaria principal e imprimiendo el bloque en la base de datos...
              </p>
            </div>
          </div>
        )}

        {/* STEP WORKFLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form/Details (Col 2) */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'review' && (
              <div className="bg-cyber-card border border-cyber-gray p-6 relative">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
                <h2 className="font-display font-black text-lg uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                  <FileText size={18} className="text-cyber-cyan" />
                  REVISAR MÓDULOS DE COMPRA
                </h2>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar mb-6 border-b border-cyber-gray/40 pb-6">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-cyber-black border border-cyber-gray/40 p-3 flex gap-4 items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyber-card border border-cyber-gray overflow-hidden">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover opacity-80"
                          />
                        </div>
                        <div>
                          <h4 className="font-display font-black text-xs uppercase tracking-tight text-white line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-[9px] font-mono text-cyber-light/45">
                            CANTIDAD: {item.quantity} // PRECIO UNIT: ${item.product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="font-display font-black text-xs text-cyber-cyan">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    to="/cart"
                    className="btn-neon-dark py-2 flex items-center gap-2 text-[10px]"
                  >
                    <ArrowLeft size={12} /> Modificar Carro
                  </Link>
                  <button
                    onClick={() => setStep('shipping')}
                    className="btn-neon-pink py-2 flex items-center gap-2 text-[10px]"
                  >
                    Ingresar Envío <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {step === 'shipping' && (
              <form
                onSubmit={handleShippingSubmit}
                className="bg-cyber-card border border-cyber-gray p-6 relative space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
                <h2 className="font-display font-black text-lg uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                  <Truck size={18} className="text-cyber-cyan animate-pulse" />
                  DATOS DE DESPACHO
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={shipping.name}
                      onChange={handleShippingChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="CYBER CITIZEN"
                    />
                    {shippingErrors.name && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {shippingErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="+54 9 11 1234 5678"
                    />
                    {shippingErrors.phone && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {shippingErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shipping.address}
                    onChange={handleShippingChange}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                    placeholder="AV. NEON GLOW 2049, DEPTO 4B"
                  />
                  {shippingErrors.address && (
                    <p className="text-[8px] font-mono text-cyber-pink uppercase">
                      {shippingErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="NEO SAN CRISTOBAL"
                    />
                    {shippingErrors.city && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {shippingErrors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shipping.postalCode}
                      onChange={handleShippingChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="C1414"
                    />
                    {shippingErrors.postalCode && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {shippingErrors.postalCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      País
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shipping.country}
                      onChange={handleShippingChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="ARGENTINA"
                    />
                    {shippingErrors.country && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {shippingErrors.country}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="btn-neon-dark py-2 flex items-center gap-2 text-[10px]"
                  >
                    <ArrowLeft size={12} /> Volver
                  </button>
                  <button
                    type="submit"
                    className="btn-neon-pink py-2 flex items-center gap-2 text-[10px]"
                  >
                    Proceder al Pago <ArrowRight size={12} />
                  </button>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <form
                onSubmit={handlePaymentSubmit}
                className="bg-cyber-card border border-cyber-gray p-6 relative space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
                <h2 className="font-display font-black text-lg uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                  <CreditCard size={18} className="text-cyber-cyan" />
                  MÓDULO DE PAGO SEGURO
                </h2>

                {/* Cyber Card Visual Preview */}
                <div className="bg-gradient-to-br from-cyber-gray to-cyber-black border border-cyber-cyan/35 p-5 relative overflow-hidden flex flex-col justify-between h-40 max-w-sm mx-auto shadow-[0_0_15px_rgba(0,240,255,0.05)]">
                  <div className="absolute top-0 right-0 p-3">
                    <Cpu className="text-cyber-cyan animate-pulse" size={24} />
                  </div>
                  <div className="text-[9px] font-mono text-cyber-cyan/40">NEON PAY // SECURE NODE</div>
                  <div className="font-display font-black text-sm uppercase text-white tracking-widest">
                    {card.number || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-cyber-light/60">
                    <div>
                      <div>TITULAR</div>
                      <div className="text-white uppercase truncate max-w-[150px]">
                        {card.name || 'CYBER OWNER'}
                      </div>
                    </div>
                    <div>
                      <div>EXP</div>
                      <div className="text-white">{card.expiry || 'MM/AA'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={card.number}
                      onChange={handleCardChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="4000 1234 5678 9010"
                    />
                    {cardErrors.number && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {cardErrors.number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={card.name}
                      onChange={handleCardChange}
                      className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                      placeholder="CYBER OWNER"
                    />
                    {cardErrors.name && (
                      <p className="text-[8px] font-mono text-cyber-pink uppercase">
                        {cardErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                        Fecha Expiración
                      </label>
                      <input
                        type="text"
                        name="expiry"
                        value={card.expiry}
                        onChange={handleCardChange}
                        className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                        placeholder="MM/AA"
                      />
                      {cardErrors.expiry && (
                        <p className="text-[8px] font-mono text-cyber-pink uppercase">
                          {cardErrors.expiry}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-cyber-light/50">
                        CVC (Seguridad)
                      </label>
                      <input
                        type="text"
                        name="cvc"
                        value={card.cvc}
                        onChange={handleCardChange}
                        className="w-full bg-cyber-black border border-cyber-gray px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-cyber-cyan transition-colors"
                        placeholder="123"
                      />
                      {cardErrors.cvc && (
                        <p className="text-[8px] font-mono text-cyber-pink uppercase">
                          {cardErrors.cvc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="btn-neon-dark py-2 flex items-center gap-2 text-[10px]"
                  >
                    <ArrowLeft size={12} /> Volver
                  </button>
                  <button
                    type="submit"
                    className="btn-neon-pink py-2 flex items-center gap-2 text-[10px]"
                  >
                    <Lock size={12} /> Validar y Pagar
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="bg-cyber-card border border-cyber-lime p-8 text-center space-y-6 relative shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-lime" />
                <div className="w-16 h-16 border-2 border-cyber-lime rounded-none flex items-center justify-center text-cyber-lime mx-auto animate-pulse shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                  <CheckCircle size={32} />
                </div>

                <div>
                  <h2 className="font-display font-black text-xl uppercase tracking-widest text-cyber-lime neon-text-lime">
                    MÓDULO DE COMPRA AUTORIZADO
                  </h2>
                  <p className="text-xs font-mono text-white mt-2 uppercase">
                    La orden ha sido procesada y registrada de forma segura.
                  </p>
                </div>

                <div className="bg-cyber-black border border-cyber-gray/60 p-4 max-w-sm mx-auto font-mono text-left text-[10px] space-y-2 uppercase">
                  <div className="text-cyber-light/40">--- ENLACE TERMINAL ---</div>
                  <div>
                    <span className="text-cyber-light/40">TRANSACCIÓN ID: </span>
                    <span className="text-cyber-cyan">{createdOrderId}</span>
                  </div>
                  <div>
                    <span className="text-cyber-light/40">DESTINATARIO: </span>
                    <span className="text-white">{shipping.name}</span>
                  </div>
                  <div>
                    <span className="text-cyber-light/40">DIRECCIÓN: </span>
                    <span className="text-white">
                      {shipping.address}, {shipping.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyber-light/40">ESTADO ORDEN: </span>
                    <span className="text-cyber-yellow bg-cyber-yellow/10 px-1 border border-cyber-yellow/20">
                      PENDIENTE
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link to="/" className="btn-neon-cyan py-2.5 text-[10px] w-full sm:w-auto">
                    Volver al Catálogo
                  </Link>
                  <Link to="/profile" className="btn-neon-lime py-2.5 text-[10px] w-full sm:w-auto">
                    Ver mis Órdenes
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar (Col 1) - Persistent during review, shipping, and payment */}
          {step !== 'success' && (
            <div className="bg-cyber-card border border-cyber-gray p-6 relative space-y-6">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-cyan" />
              <h3 className="font-display font-black text-sm uppercase text-white tracking-widest border-b border-cyber-gray pb-3">
                DETALLE DE TRANSACCIÓN
              </h3>

              <div className="space-y-4 font-mono text-xs mb-6">
                <div className="flex justify-between text-cyber-light/60">
                  <span>MÓDULOS ACTIVOS:</span>
                  <span className="text-white font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between text-cyber-light/60">
                  <span>ENVÍO CRIPTO:</span>
                  <span className="text-cyber-lime font-bold">GRATIS</span>
                </div>
              </div>

              <div className="border-t border-cyber-gray/40 pt-4 flex justify-between font-display font-black text-base uppercase">
                <span className="text-white">TOTAL ORDEN:</span>
                <span className="text-cyber-cyan neon-text-cyan">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="bg-cyber-black p-3 border border-cyber-gray/50 font-mono text-[9px] text-cyber-light/40 uppercase">
                <div className="flex gap-2">
                  <Lock size={12} className="text-cyber-cyan flex-shrink-0" />
                  <span>
                    El flujo de datos bancarios de Neon-Tech se encuentra protegido y cifrado con encriptación militar.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
