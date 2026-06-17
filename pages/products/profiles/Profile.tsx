import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getOrdersByUserId } from '../../../services/firebase/firestore';
import { Order, CartItem } from '../../../types';
import Spinner from '../../../components/common/Spinner';
import { User, Mail, Calendar, Shield, Package, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoadingOrders(true);
        try {
          const fetched = await getOrdersByUserId(user.uid);
          setOrders(fetched);
        } catch (error) {
          console.error('Error fetching user orders:', error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders();
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="bg-cyber-card border border-cyber-pink/40 p-8 max-w-sm w-full space-y-6">
          <h2 className="font-display font-black text-lg uppercase text-white tracking-widest">
            ACCESO NO AUTORIZADO
          </h2>
          <p className="text-xs font-mono text-cyber-light/40 uppercase">
            Inicia sesión con tu terminal para sincronizar tu perfil de usuario y tu historial de transacciones.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="btn-neon-cyan block w-full py-2.5 text-[10px] text-center"
            >
              INGRESAR TERMINAL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Toggle order expansion details
  const toggleOrderExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  // Colored status badge builder
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-cyber-lime/30 text-cyber-lime bg-cyber-lime/10 shadow-[0_0_10px_rgba(57,255,20,0.1)]">
            COMPLETADO
          </span>
        );
      case 'processing':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-cyber-cyan/30 text-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
            PROCESANDO
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-cyber-pink/30 text-cyber-pink bg-cyber-pink/10 shadow-[0_0_10px_rgba(255,0,127,0.1)]">
            CANCELADO
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-cyber-yellow/30 text-cyber-yellow bg-cyber-yellow/10 shadow-[0_0_10px_rgba(255,230,0,0.1)]">
            PENDIENTE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid relative select-none">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-5xl mx-auto z-10 relative space-y-8">
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* USER CARD INFO (Col 1) */}
          <div className="bg-cyber-card border border-cyber-gray p-6 relative space-y-6">
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
            <h2 className="font-display font-black text-lg uppercase text-white tracking-widest border-b border-cyber-gray pb-4">
              Mi <span className="text-cyber-cyan neon-text-cyan">Perfil</span>
            </h2>

            <div className="space-y-4 font-mono text-xs text-cyber-light/80 uppercase">
              <div className="flex items-center gap-3 bg-cyber-black p-3 border border-cyber-gray/40">
                <User size={16} className="text-cyber-cyan" />
                <div>
                  <div className="text-[8px] text-cyber-light/40">NOMBRE</div>
                  <div className="text-white font-bold text-[11px] truncate max-w-[170px]">{profile.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-cyber-black p-3 border border-cyber-gray/40">
                <Mail size={16} className="text-cyber-pink" />
                <div>
                  <div className="text-[8px] text-cyber-light/40">EMAIL</div>
                  <div className="text-white font-bold text-[11px] truncate max-w-[170px]">{profile.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-cyber-black p-3 border border-cyber-gray/40">
                <Shield size={16} className="text-cyber-lime" />
                <div>
                  <div className="text-[8px] text-cyber-light/40">PERMISOS ROL</div>
                  <div className="text-cyber-lime font-bold text-[11px]">{profile.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}</div>
                </div>
              </div>

              {profile.createdAt && (
                <div className="flex items-center gap-3 bg-cyber-black p-3 border border-cyber-gray/40">
                  <Calendar size={16} className="text-cyber-yellow" />
                  <div>
                    <div className="text-[8px] text-cyber-light/40">ENLACE DESDE</div>
                    <div className="text-white text-[11px]">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              className="w-full btn-neon-pink py-2.5 text-[10px] shadow-none hover:shadow-[0_0_12px_rgba(255,0,127,0.3)]"
            >
              Desconectar Terminal
            </button>
          </div>

          {/* PAST ORDERS (Col 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-cyber-card border border-cyber-gray p-6 relative">
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-pink" />
              <h2 className="font-display font-black text-lg uppercase text-white tracking-widest border-b border-cyber-gray pb-4 flex items-center gap-2">
                <Package size={18} className="text-cyber-pink" />
                Historial de <span className="text-cyber-pink neon-text-pink">Órdenes</span>
              </h2>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Spinner />
                  <span className="text-[10px] font-mono text-cyber-light/40 uppercase">
                    Cargando bitácora de transacciones...
                  </span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-12 h-12 border border-cyber-gray flex items-center justify-center text-cyber-light/30">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
                      SIN TRANSACCIONES REGISTRADAS
                    </h3>
                    <p className="text-[10px] font-mono text-cyber-light/40 uppercase mt-2 max-w-xs mx-auto">
                      No has realizado ninguna compra con esta cuenta en nuestros nodos.
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="btn-neon-cyan text-[10px] py-2"
                  >
                    HACER MI PRIMER PEDIDO
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const orderDate = new Date(order.createdAt).toLocaleDateString();
                    return (
                      <div
                        key={order.id}
                        className={`border ${
                          isExpanded ? 'border-cyber-cyan bg-cyber-black' : 'border-cyber-gray bg-cyber-card'
                        } transition-all duration-300`}
                      >
                        {/* Order Accordion Header */}
                        <div
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                        >
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono text-cyber-light/40">ORDEN: #{order.id.slice(-8).toUpperCase()}</span>
                            <div className="font-display font-black text-xs text-white uppercase tracking-tight">
                              FECHA: {orderDate} // TOTAL: <span className="text-cyber-cyan">${order.total.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {getStatusBadge(order.status)}
                            <button className="text-cyber-light/40 hover:text-white transition-colors bg-transparent border-0 outline-none">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Order Accordion Expanded Body */}
                        {isExpanded && (
                          <div className="p-4 border-t border-cyber-gray/40 space-y-4 bg-cyber-card/65 font-mono text-[10px] uppercase">
                            
                            {/* Products summary list */}
                            <div className="space-y-2">
                              <div className="text-cyber-light/40 font-bold">--- PRODUCTOS ---</div>
                              {order.items.map((item: CartItem, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-cyber-black p-2 border border-cyber-gray/30">
                                  <span>{item.product.name} (x{item.quantity})</span>
                                  <span className="text-cyber-cyan">${(item.product.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Despatch shipping details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-cyber-gray/30">
                              <div className="space-y-1 bg-cyber-black p-3 border border-cyber-gray/30">
                                <div className="text-cyber-light/40 font-bold">DIRECCIÓN DE ENTREGA</div>
                                <div className="text-white">{order.shippingDetails.name}</div>
                                <div className="text-white">{order.shippingDetails.address}</div>
                                <div className="text-white">
                                  {order.shippingDetails.city}, {order.shippingDetails.postalCode}
                                </div>
                                <div className="text-white">{order.shippingDetails.country}</div>
                              </div>

                              <div className="space-y-1 bg-cyber-black p-3 border border-cyber-gray/30 flex flex-col justify-between">
                                <div>
                                  <div className="text-cyber-light/40 font-bold">CONTACTO</div>
                                  <div className="text-white">TEL: {order.shippingDetails.phone}</div>
                                </div>
                                <div className="text-right text-[8px] text-cyber-light/30">
                                  METADATA ORDER ID: {order.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
