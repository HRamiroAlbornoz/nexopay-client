import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAllOrders, updateOrderStatus } from '../../services/firebase/firestore';
import { Order, OrderStatus } from '../../types';
import Spinner from '../../components/common/Spinner';
import { Link } from 'react-router-dom';
import { ShieldCheck, Package, RotateCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';

export const OrdersList: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const fetched = await getAllOrders();
      setOrders(fetched);
    } catch (error) {
      console.error('Error fetching global orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state instantly so the UI reflects the change
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado de la orden.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  // Filter orders list by chosen filter
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

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
        
        {/* Navigation Breadcrumb & Admin Controls Header */}
        <div className="border-b border-cyber-gray pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink px-2.5 py-0.5 mb-2">
              <ShieldCheck size={10} /> Consola de Administración Autorizada
            </div>
            <h1 className="font-display font-black text-3xl uppercase text-white tracking-widest">
              Control de <span className="text-cyber-violet neon-text-violet">Órdenes</span>
            </h1>
            <p className="text-xs text-cyber-light/40 font-mono uppercase mt-1">
              Consola global de transacciones, despachos, y control de estados
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin" className="btn-neon-pink py-2 text-[9px]">
              DASHBOARD METRICAS
            </Link>
            <Link to="/admin/products" className="btn-neon-cyan py-2 text-[9px]">
              CRUD PRODUCTOS
            </Link>
            <Link to="/" className="btn-neon-dark py-2 text-[9px]">
              VER TIENDA
            </Link>
          </div>
        </div>

        {/* STATUS FILTERS BAR */}
        <div className="bg-cyber-card border border-cyber-gray p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'pending', 'processing', 'completed', 'cancelled'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 border font-mono text-[9px] uppercase tracking-widest cursor-pointer outline-none transition-all ${
                  statusFilter === filter
                    ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10'
                    : 'border-cyber-gray text-cyber-light/50 hover:text-white hover:border-cyber-light'
                }`}
              >
                {filter === 'all' ? 'TODAS' : filter === 'pending' ? 'PENDIENTES' : filter === 'processing' ? 'PROCESANDO' : filter === 'completed' ? 'COMPLETADAS' : 'CANCELADAS'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 border border-cyber-gray hover:border-cyber-cyan text-cyber-cyan hover:text-white transition-colors cursor-pointer outline-none bg-transparent"
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 bg-cyber-card border border-cyber-gray flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <span className="text-[10px] font-mono text-cyber-light/40 uppercase">
                Sincronizando bitácora global de órdenes...
              </span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 bg-cyber-card border border-cyber-gray text-center flex flex-col items-center justify-center space-y-4">
              <Clock className="text-cyber-light/20" size={32} />
              <h3 className="font-display font-black text-sm uppercase text-white tracking-widest">
                NO HAY REGISTROS DE ÓRDENES
              </h3>
              <p className="text-[10px] font-mono text-cyber-light/40 uppercase max-w-xs mx-auto">
                No se encuentran transacciones con el estado filtrado en los registros del servidor.
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className={`border ${
                    isExpanded ? 'border-cyber-cyan bg-cyber-black' : 'border-cyber-gray bg-cyber-card'
                  } transition-all duration-300 relative`}
                >
                  {isUpdating && (
                    <div className="absolute inset-0 bg-cyber-black/70 flex items-center justify-center z-10">
                      <Spinner size="sm" />
                    </div>
                  )}

                  {/* Header Accordion Item */}
                  <div
                    onClick={() => toggleOrderExpand(order.id)}
                    className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none font-mono text-xs uppercase"
                  >
                    <div className="space-y-1">
                      <div className="text-[8px] text-cyber-light/45">ORDEN: #{order.id.slice(-8).toUpperCase()} // CLIENTE: {order.userName}</div>
                      <div className="font-display font-black text-xs text-white tracking-tight">
                        FECHA: {new Date(order.createdAt).toLocaleDateString()} // TOTAL: <span className="text-cyber-cyan">${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      {/* Status badge */}
                      {getStatusBadge(order.status)}

                      {/* Dropdown editor */}
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <span className="text-[8px] text-cyber-light/40">CAMBIAR:</span>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="bg-cyber-black border border-cyber-gray text-white p-1 text-[9px] outline-none focus:border-cyber-cyan cursor-pointer uppercase font-bold"
                        >
                          <option value="pending">PENDIENTE</option>
                          <option value="processing">PROCESANDO</option>
                          <option value="completed">COMPLETADO</option>
                          <option value="cancelled">CANCELADO</option>
                        </select>
                      </div>

                      <button className="text-cyber-light/40 hover:text-white transition-colors bg-transparent border-0 outline-none">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body Accordion */}
                  {isExpanded && (
                    <div className="p-4 border-t border-cyber-gray/45 bg-cyber-card/65 font-mono text-[10px] space-y-4 uppercase">
                      
                      {/* Item list purchased */}
                      <div className="space-y-2">
                        <div className="text-cyber-light/40 font-bold flex items-center gap-1.5">
                          <Package size={12} className="text-cyber-cyan" /> COMPONENTES DE HARDWARE CARGADOS
                        </div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-cyber-black p-2 border border-cyber-gray/30">
                            <span>
                              {item.product.name} (x{item.quantity})
                            </span>
                            <span className="text-cyber-cyan">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Ship details & Customer metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-cyber-gray/30">
                        
                        <div className="bg-cyber-black p-3 border border-cyber-gray/30 space-y-1">
                          <div className="text-cyber-light/40 font-bold">DETALLE DE DESPACHO FISICO</div>
                          <div className="text-white">{order.shippingDetails.name}</div>
                          <div className="text-white">{order.shippingDetails.address}</div>
                          <div className="text-white">
                            {order.shippingDetails.city}, {order.shippingDetails.postalCode}
                          </div>
                          <div className="text-white">{order.shippingDetails.country}</div>
                        </div>

                        <div className="bg-cyber-black p-3 border border-cyber-gray/30 flex flex-col justify-between">
                          <div>
                            <div className="text-cyber-light/40 font-bold">CONTACTO CLIENTE & LOGS</div>
                            <div className="text-white">EMAIL: {order.userEmail}</div>
                            <div className="text-white">TEL: {order.shippingDetails.phone}</div>
                          </div>
                          <div className="text-right text-[8px] text-cyber-light/30 pt-2 border-t border-cyber-gray/10 mt-2">
                            FULL METADATA TRANSACTION ID: {order.id}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default OrdersList;
