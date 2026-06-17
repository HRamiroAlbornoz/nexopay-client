import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { getAllOrders, seedProductsInCloud } from '../../services/firebase/firestore';
import { Order } from '../../types';
import Spinner from '../../components/common/Spinner';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Cpu,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<boolean>(false);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedError(null);
    setSeedSuccess(false);
    try {
      await seedProductsInCloud();
      setSeedSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setSeedError(err.message || 'Error al sembrar la base de datos.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    const fetchGlobalData = async () => {
      setLoading(true);
      try {
        const fetchedOrders = await getAllOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching global orders for analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center space-y-4">
        <Spinner />
        <span className="text-[10px] font-mono text-cyber-light/40 uppercase">
          Enlazando con el nodo analítico...
        </span>
      </div>
    );
  }

  // Calculate Metrics
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrdersCount = orders.length;
  const averageTicket = totalOrdersCount > 0 ? parseFloat((totalRevenue / activeOrders.length || 0).toFixed(2)) : 0;
  const totalProductsCount = products.length;

  // Recharts Data Prep: 1. Sales timeline (Area chart)
  const timelineMap: Record<string, number> = {};
  orders
    .slice()
    .reverse() // show chronological order
    .forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (order.status !== 'cancelled') {
        timelineMap[dateStr] = (timelineMap[dateStr] || 0) + order.total;
      }
    });

  const salesTimelineData = Object.keys(timelineMap).map(key => ({
    name: key,
    Ventas: parseFloat(timelineMap[key].toFixed(2)),
  }));

  // If no sales, populate mock analytical records to avoid empty graphs
  const chartData = salesTimelineData.length > 0 ? salesTimelineData : [
    { name: 'May 15', Ventas: 240 },
    { name: 'May 16', Ventas: 380 },
    { name: 'May 17', Ventas: 190 },
    { name: 'May 18', Ventas: 710 },
    { name: 'May 19', Ventas: 520 },
    { name: 'May 20', Ventas: totalRevenue || 300 }
  ];

  // Recharts Data Prep: 2. Categories Distribution (Bar chart)
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  });

  const categoriesData = Object.keys(categoryMap).map(key => ({
    name: key,
    Cantidad: categoryMap[key],
  }));

  const barData = categoriesData.length > 0 ? categoriesData : [
    { name: 'Laptops', Cantidad: 4 },
    { name: 'Smartphones', Cantidad: 3 },
    { name: 'Audio', Cantidad: 3 },
    { name: 'Accesorios', Cantidad: 2 }
  ];

  const BAR_COLORS = ['#00f0ff', '#ff007f', '#39ff14', '#8b5cf6', '#ffe600'];

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid relative select-none">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-6xl mx-auto z-10 relative space-y-8">
        
        {/* Navigation Breadcrumb & Admin Controls Header */}
        <div className="border-b border-cyber-gray pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink px-2.5 py-0.5 mb-2">
              <ShieldCheck size={10} /> Consola de Administración Autorizada
            </div>
            <h1 className="font-display font-black text-3xl uppercase text-white tracking-widest">
              Panel <span className="text-cyber-pink neon-text-pink">Métricas</span>
            </h1>
            <p className="text-xs text-cyber-light/40 font-mono uppercase mt-1">
              Terminal de control analítico de ventas y rendimiento del catálogo
            </p>
          </div>

          {/* Admin Navigation Menu Links */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/products" className="btn-neon-cyan py-2 text-[9px]">
              CRUD PRODUCTOS
            </Link>
            <Link to="/admin/orders" className="btn-neon-violet py-2 text-[9px]">
              GESTIÓN ÓRDENES
            </Link>
            <Link to="/" className="btn-neon-dark py-2 text-[9px]">
              VER TIENDA
            </Link>
          </div>
        </div>

        {/* DATABASE SEEDER BANNER */}
        {products.length === 0 && (
          <div className="bg-cyber-card border-2 border-cyber-pink p-5 relative shadow-[0_0_20px_rgba(255,0,127,0.15)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-display font-black text-sm uppercase text-white tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                <span className="w-2.5 h-2.5 bg-cyber-pink animate-pulse" />
                BASE DE DATOS CLOUD VACÍA
              </h3>
              <p className="text-[10px] font-mono text-cyber-light/60 uppercase">
                Detectamos que la colección "products" de Firestore está vacía en producción. Inicializa tu catálogo cyberpunk con un solo clic.
              </p>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="btn-neon-pink px-6 py-2.5 text-[9px] font-mono tracking-widest whitespace-nowrap min-w-[170px]"
            >
              {seeding ? 'SINCRONIZANDO...' : 'SEMBRAR FIRESTORE'}
            </button>
          </div>
        )}

        {/* FEEDBACK STATUSES */}
        {seedSuccess && (
          <div className="bg-cyber-card border border-cyber-lime p-4 text-center text-cyber-lime font-mono text-xs uppercase tracking-wider animate-pulse">
            🎉 ¡Base de datos sembrada con éxito! Recargando módulos en 2 segundos...
          </div>
        )}

        {seedError && (
          <div className="bg-cyber-card border border-cyber-pink p-4 text-center text-cyber-pink font-mono text-xs uppercase tracking-wider">
            ❌ Error de siembra: {seedError}
          </div>
        )}

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Revenue */}
          <div className="bg-cyber-card border border-cyber-gray p-5 relative group hover:border-cyber-cyan/40 transition-colors">
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyber-cyan/30 group-hover:border-cyber-cyan" />
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyber-light/40 uppercase">INGRESOS NETOS COMPLETADOS</span>
              <DollarSign className="text-cyber-cyan animate-pulse" size={16} />
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-2xl text-white tracking-tight">
                ${totalRevenue.toFixed(2)}
              </span>
              <span className="text-[8px] font-mono text-cyber-lime block mt-1">✓ ENLACE CRIPTO ACTIVO</span>
            </div>
          </div>

          {/* Card 2: Orders count */}
          <div className="bg-cyber-card border border-cyber-gray p-5 relative group hover:border-cyber-pink/40 transition-colors">
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyber-pink/30 group-hover:border-cyber-pink" />
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyber-light/40 uppercase">VOLUMEN DE ÓRDENES</span>
              <ShoppingBag className="text-cyber-pink" size={16} />
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-2xl text-white tracking-tight">
                {totalOrdersCount}
              </span>
              <span className="text-[8px] font-mono text-cyber-light/40 block mt-1">TOTAL TRANSACCIONES NODO</span>
            </div>
          </div>

          {/* Card 3: Average Ticket */}
          <div className="bg-cyber-card border border-cyber-gray p-5 relative group hover:border-cyber-lime/40 transition-colors">
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyber-lime/30 group-hover:border-cyber-lime" />
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyber-light/40 uppercase">VALOR TICKET PROMEDIO</span>
              <TrendingUp className="text-cyber-lime" size={16} />
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-2xl text-white tracking-tight">
                ${averageTicket.toFixed(2)}
              </span>
              <span className="text-[8px] font-mono text-cyber-cyan block mt-1">EFICIENCIA DE COMPRA</span>
            </div>
          </div>

          {/* Card 4: Catalog products */}
          <div className="bg-cyber-card border border-cyber-gray p-5 relative group hover:border-cyber-yellow/40 transition-colors">
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyber-yellow/30 group-hover:border-cyber-yellow" />
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-cyber-light/40 uppercase">CATÁLOGO HARDWARE ACTIVO</span>
              <Package className="text-cyber-yellow" size={16} />
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-2xl text-white tracking-tight">
                {totalProductsCount}
              </span>
              <span className="text-[8px] font-mono text-cyber-light/40 block mt-1">PRODUCTOS PUBLICADOS</span>
            </div>
          </div>
        </div>

        {/* ANALYTICS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline Sales Chart (Col 2) */}
          <div className="lg:col-span-2 bg-cyber-card border border-cyber-gray p-6 relative">
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-cyber-cyan" />
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-white border-b border-cyber-gray/30 pb-3 mb-6">
              MONITOR DE VENTAS // HISTORIAL CRONOLÓGICO
            </h3>
            
            <div className="h-72 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12131a',
                      borderColor: '#1f212d',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Ventas"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Bar Chart (Col 1) */}
          <div className="bg-cyber-card border border-cyber-gray p-6 relative">
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-cyber-pink" />
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-white border-b border-cyber-gray/30 pb-3 mb-6">
              HARDWARE // DISTRIBUCIÓN POR NICHOS
            </h3>

            <div className="h-72 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12131a',
                      borderColor: '#1f212d',
                      color: '#ffffff',
                      fontFamily: 'Space Grotesk'
                    }}
                  />
                  <Bar dataKey="Cantidad" fill="#ff007f" radius={[2, 2, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
