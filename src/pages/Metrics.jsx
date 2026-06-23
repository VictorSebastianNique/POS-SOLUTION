import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Clock, Award,
  AlertTriangle, ShieldAlert, Activity,
  PieChart as PieIcon, BarChart3,
  ArrowUpRight, ArrowDownRight, MapPin
} from 'lucide-react';

/* ── Paleta de gráficos (se ve bien en ambos temas) ─────────── */
const CHART_COLORS = ['#ff6b2b', '#10d990', '#6366f1', '#f59e0b', '#38bdf8', '#f43f5e', '#8b5cf6', '#94a3b8'];

/* ── Tooltip adaptativo ─────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-solid)',
      border: '1px solid var(--border-hover)',
      backdropFilter: 'blur(20px)',
      padding: '12px 16px',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-lg)',
      minWidth: '160px',
    }}>
      <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{entry.name}:</span>
          <span style={{ fontWeight: 700, color: entry.color, fontSize: '0.9rem' }}>
            {(entry.name?.includes('Venta') || entry.name?.includes('Proy') || entry.name?.includes('Monto') || entry.name?.includes('Tend'))
              ? `S/ ${Number(entry.value).toFixed(2)}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card adaptativa ────────────────────────────────────── */
const KPICard = ({ title, value, icon, color, subtitle, trend, trendUp }) => (
  <div
    style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--border-color)',
      borderTop: `3px solid ${color}`,
      borderRadius: '16px',
      padding: '1.25rem 1.4rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition)',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = `var(--shadow-md), 0 0 20px ${color}22`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {/* Círculo decorativo */}
    <div style={{
      position: 'absolute', right: '-16px', top: '-16px',
      width: '80px', height: '80px', borderRadius: '50%',
      background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    {/* Ícono de fondo */}
    <div style={{ position: 'absolute', right: '12px', top: '10px', opacity: 0.12, color, pointerEvents: 'none' }}>
      {React.cloneElement(icon, { size: 52 })}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
      <div style={{ background: `${color}18`, color, borderRadius: '10px', padding: '8px', display: 'flex' }}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>

    <p style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.4rem', fontFamily: 'Outfit, sans-serif' }}>
      {value}
    </p>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{subtitle}</span>
      {trend && (
        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: trendUp ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {trend}
        </span>
      )}
    </div>
  </div>
);

/* ── Chart Container adaptativo ─────────────────────────────── */
const ChartContainer = ({ title, icon, badge, children, accentColor = '#ff6b2b' }) => (
  <div style={{
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Glow superior */}
    <div style={{
      position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
      background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
      borderRadius: '999px', pointerEvents: 'none',
    }} />

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
        <span style={{ background: `${accentColor}18`, color: accentColor, borderRadius: '8px', padding: '6px', display: 'flex' }}>
          {React.cloneElement(icon, { size: 15 })}
        </span>
        {title}
      </h2>
      {badge && (
        <span style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '999px', fontSize: '0.68rem', padding: '2px 10px', fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>

    <div style={{ flex: 1, minHeight: '260px' }}>
      {children}
    </div>
  </div>
);

/* ── Estado vacío adaptativo ────────────────────────────────── */
const EmptyState = ({ msg = 'Sin datos suficientes' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
    <BarChart3 size={36} />
    <p style={{ fontSize: '0.84rem', fontWeight: 500 }}>{msg}</p>
  </div>
);

/* ── Estilos de ejes adaptativos (usamos CSS var via getComputedStyle en runtime) ── */
// Nota: Recharts no entiende CSS vars directamente, así que usamos colores semitransparentes neutros.
// En dark lucen gris claro, en light lucen gris oscuro — ambos legibles.
const AXIS_COLOR = 'rgba(128,128,128,0.65)';
const GRID_COLOR = 'rgba(128,128,128,0.12)';

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export default function Metrics() {
  const { pastDays, businessDay, orders = [], menu = [], kardexItems = [] } = useStore();

  const allDays = useMemo(() => {
    const days = [...pastDays];
    if (businessDay.isOpen) days.push({ ...businessDay, id: 'today', startTime: businessDay.startTime || Date.now() });
    return days.sort((a, b) => a.startTime - b.startTime);
  }, [pastDays, businessDay]);

  const allSales = useMemo(() => allDays.flatMap(d => d.sales || []), [allDays]);
  const allVoids = useMemo(() => allDays.flatMap(d => d.voids || []), [allDays]);

  /* 1. Forecast IA */
  const forecastData = useMemo(() => {
    if (allDays.length < 2) return [];
    const pts = allDays.map((d, i) => ({
      x: i, y: d.totalSales,
      date: new Date(d.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      actual: d.totalSales,
      pax: (d.sales || []).reduce((s, v) => s + (v.headcount || 1), 0),
    }));
    const n = pts.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const b = (sy - m * sx) / n;

    const data = pts.map(p => ({ name: p.date, Ventas: p.actual, Tendencia: +((m * p.x + b).toFixed(2)), Comensales: p.pax }));
    const lastDate = new Date(allDays.at(-1).startTime);
    for (let i = 1; i <= 3; i++) {
      const nx = n - 1 + i, ny = Math.max(0, m * nx + b);
      const nd = new Date(lastDate.getTime() + i * 86400000);
      data.push({ name: nd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), Proyección: +ny.toFixed(2), Tendencia: +((m * nx + b).toFixed(2)) });
    }
    return data;
  }, [allDays]);

  /* 2. Horas Pico */
  const peakHoursData = useMemo(() => {
    const hrs = Array(24).fill(0);
    allSales.forEach(s => hrs[new Date(s.timestamp).getHours()]++);
    return hrs.map((c, h) => ({ name: `${String(h).padStart(2, '0')}:00`, Órdenes: c })).filter(h => h.Órdenes > 0);
  }, [allSales]);

  /* 3. Ranking de Productos */
  const itemRanking = useMemo(() => {
    const map = {};
    allSales.forEach(s => (s.items || []).forEach(item => {
      if (!map[item.item]) map[item.item] = { name: item.item, quantity: 0, revenue: 0 };
      map[item.item].quantity += item.quantity;
      map[item.item].revenue += item.price * item.quantity;
    }));
    const sortedByRevenue = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const top6 = sortedByRevenue.slice(0, 6);
    const others = sortedByRevenue.slice(6);
    
    const pieData = top6.map(i => ({ name: i.name, value: +i.revenue.toFixed(2) }));
    if (others.length > 0) {
      const othersRevenue = others.reduce((sum, item) => sum + item.revenue, 0);
      pieData.push({ name: 'OTROS', value: +othersRevenue.toFixed(2) });
    }

    const sortedByQuantity = Object.values(map).sort((a, b) => b.quantity - a.quantity);
    return {
      top: sortedByQuantity.slice(0, 5),
      pieData: pieData,
      bottom: sortedByQuantity.slice(-5).reverse().filter(i => i.quantity > 0),
    };
  }, [allSales]);

  /* 4. Ranking Mozos */
  const waiterPerformance = useMemo(() => {
    const map = {};
    allSales.forEach(s => {
      const w = s.waiter || 'Desconocido';
      if (!map[w]) map[w] = { name: w, Monto: 0, Mesas: 0 };
      map[w].Monto += s.total; map[w].Mesas++;
    });
    return Object.values(map).sort((a, b) => b.Monto - a.Monto);
  }, [allSales]);

  /* 5. Órdenes efectivas vs anuladas */
  const voidsData = useMemo(() => allDays.map(d => ({
    name: new Date(d.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    Efectivas: (d.sales || []).length,
    Anuladas: (d.voids || []).length,
  })), [allDays]);

  /* 6. Rendimiento por Zonas */
  const zonePerformance = useMemo(() => {
    const map = {};
    allSales.forEach(s => {
      const z = s.zone || 'Sin Zona';
      if (!map[z]) map[z] = { name: z, Ingresos: 0 };
      map[z].Ingresos += s.total;
    });
    return Object.values(map).sort((a,b) => b.Ingresos - a.Ingresos);
  }, [allSales]);

  /* 7. Tiempo Promedio de Atención */
  const avgWaitTime = useMemo(() => {
    let totalMins = 0;
    let count = 0;
    orders.forEach(o => {
       if (o.timestamp && o.completedAt) {
          totalMins += (new Date(o.completedAt) - new Date(o.timestamp)) / 60000;
          count++;
       }
    });
    return count > 0 ? (totalMins / count).toFixed(1) : 'N/A';
  }, [orders]);

  /* 8. Mapa de Calor (Demanda por Día) */
  const heatmapData = useMemo(() => {
    const daysMap = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
    const map = { 'Dom': 0, 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0 };
    allSales.forEach(s => {
      const d = new Date(s.timestamp).getDay();
      map[daysMap[d]]++;
    });
    return Object.keys(map).map(k => ({ name: k, Órdenes: map[k] })).filter(d => d.Órdenes > 0);
  }, [allSales]);

  /* 9. Rentabilidad (Top 5) */
  const profitabilityData = useMemo(() => {
     return itemRanking.top.map(item => {
        const menuItem = menu.find(m => m.name === item.name);
        let cost = 0;
        if (menuItem && menuItem.kardexRecipe) {
           menuItem.kardexRecipe.forEach(r => {
              const ki = kardexItems.find(k => k.id === r.kardexId);
              if (ki && ki.costoPromedio) {
                 cost += ki.costoPromedio * (parseFloat(r.qty) || 1);
              }
           });
        }
        if (cost === 0) {
           const price = menuItem ? menuItem.price : (item.revenue / item.quantity);
           cost = price * 0.3; // Estimación del 30% si no hay receta
        }
        
        const totalCost = cost * item.quantity;
        const profit = item.revenue - totalCost;
        
        return { name: item.name, Ingresos: +item.revenue.toFixed(2), Costo: +totalCost.toFixed(2), Rentabilidad: +profit.toFixed(2) };
     });
  }, [itemRanking, menu, kardexItems]);

  /* KPIs */
  const totalRevenue = allSales.reduce((s, v) => s + v.total, 0);
  const totalTables  = allSales.length;
  const avgTicket    = totalTables > 0 ? (totalRevenue / totalTables).toFixed(2) : '0.00';
  const totalPax     = allSales.reduce((s, v) => s + (v.headcount || 1), 0);
  const avgPerHead   = totalPax > 0 ? (totalRevenue / totalPax).toFixed(2) : '0.00';
  const totalVoids   = allVoids.length;
  const voidRate     = totalTables > 0 ? ((totalVoids / (totalTables + totalVoids)) * 100).toFixed(1) : '0.0';

  const axisProps = { tick: { fill: AXIS_COLOR, fontSize: 11, fontFamily: 'Inter, sans-serif' }, axisLine: false, tickLine: false };

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px' }}>
            <div style={{ background: 'linear-gradient(135deg, #ff6b2b, #f43f5e)', borderRadius: '12px', padding: '10px', display: 'flex', boxShadow: '0 0 20px rgba(255,107,43,0.4)' }}>
              <Activity size={20} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Business Intelligence
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '54px' }}>
            Centro de mando analítico · Métricas en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--success-subtle)', border: '1px solid rgba(16,217,144,0.25)', borderRadius: '999px', padding: '6px 16px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--success-color)', display: 'inline-block' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--success-color)', fontWeight: 600 }}>Sistema activo</span>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <KPICard title="Ingreso Bruto Acumulado" value={`S/ ${totalRevenue.toFixed(2)}`} icon={<DollarSign />} color="#10d990" subtitle="Histórico global" />
        <KPICard title="Ticket Promedio / Mesa"  value={`S/ ${avgTicket}`}               icon={<TrendingUp />}  color="#ff6b2b" subtitle="Consumo por mesa" />
        <KPICard title="Ticket Promedio / Pax"   value={`S/ ${avgPerHead}`}              icon={<PieIcon />}     color="#6366f1" subtitle="Por comensal" />
        <KPICard title="Tráfico Total (Pax)"     value={totalPax}                         icon={<Users />}       color="#f59e0b" subtitle="Comensales atendidos" />
        <KPICard
          title="Tiempo Atención (Prom)"
          value={avgWaitTime !== 'N/A' ? `${avgWaitTime} min` : 'N/A'}
          icon={<Clock />}
          color="#38bdf8"
          subtitle="Preparación a mesa"
        />
        <KPICard
          title="Tasa de Anulación"
          value={`${voidRate}%`}
          icon={<ShieldAlert />}
          color={parseFloat(voidRate) > 10 ? '#ff4d6d' : '#10d990'}
          subtitle={`${totalVoids} anulaciones`}
          trend={parseFloat(voidRate) > 10 ? 'Alto' : 'Bajo'}
          trendUp={parseFloat(voidRate) <= 10}
        />
      </div>

      {/* ── Forecast ────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <ChartContainer title="Proyección Inteligente de Ventas (Regresión Lineal)" icon={<TrendingUp />} badge="IA · 3 días" accentColor="#6366f1">
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10d990" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#10d990" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} dy={8} />
                <YAxis yAxisId="left"  {...axisProps} dx={-4} />
                <YAxis yAxisId="right" orientation="right" {...axisProps} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: AXIS_COLOR }} />
                <Bar      yAxisId="right" dataKey="Comensales" fill="url(#gPax)"    radius={[4,4,0,0]} maxBarSize={32} opacity={0.85} />
                <Area     yAxisId="left"  dataKey="Ventas"     stroke="#6366f1" strokeWidth={2.5} fill="url(#gVentas)" />
                <TrendingUp yAxisId="left" dataKey="Proyección" stroke="#ff6b2b" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Necesitas al menos 2 días de ventas para ver la proyección" />}
        </ChartContainer>
      </div>

      {/* ── Pie + Heatmap ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <ChartContainer title="Distribución de Ingresos (Top 6)" icon={<PieIcon />} badge="Por producto" accentColor="#f59e0b">
          {itemRanking.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomTooltip />} />
                <Pie data={itemRanking.pieData} cx="50%" cy="45%" innerRadius="50%" outerRadius="70%" paddingAngle={4} dataKey="value" stroke="none">
                  {itemRanking.pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', color: AXIS_COLOR, paddingTop: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartContainer>

        <ChartContainer title="Mapa de Calor (Horas Pico)" icon={<Clock />} badge="Demanda horaria" accentColor="#f59e0b">
          {peakHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHeat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ff4d6d" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar dataKey="Órdenes" fill="url(#gHeat)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos horarios aún" />}
        </ChartContainer>
      </div>

      {/* ── Mozos + Salud de Órdenes ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <ChartContainer title="Ranking de Mozos (Facturación)" icon={<Award />} badge="Por monto" accentColor="#10d990">
          {waiterPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waiterPerformance} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="gMozos" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#10d990" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis dataKey="name" type="category" tick={{ fill: AXIS_COLOR, fontWeight: 600, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar dataKey="Monto" fill="url(#gMozos)" radius={[0,8,8,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos de mozos" />}
        </ChartContainer>

        <ChartContainer title="Salud de Órdenes por Día" icon={<ShieldAlert />} badge="Efectivas vs Anuladas" accentColor="#ff4d6d">
          {voidsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={voidsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEfect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10d990" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10d990" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAnul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff4d6d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: GRID_COLOR }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: AXIS_COLOR }} />
                <Area type="monotone" dataKey="Efectivas" stroke="#10d990" strokeWidth={2} fill="url(#gEfect)" />
                <Area type="monotone" dataKey="Anuladas"  stroke="#ff4d6d" strokeWidth={2} fill="url(#gAnul)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos de control de calidad" />}
        </ChartContainer>
      </div>

      {/* ── Nuevas Métricas Avanzadas (Rentabilidad, Zonas, Mapa de Calor) ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <ChartContainer title="Rentabilidad Estimada (Top 5)" icon={<DollarSign />} badge="Ingreso vs Costo" accentColor="#10d990">
          {profitabilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitabilityData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis dataKey="name" type="category" tick={{ fill: AXIS_COLOR, fontWeight: 600, fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: AXIS_COLOR, paddingTop: '5px' }} />
                <Bar dataKey="Ingresos" fill="#10d990" radius={[0,4,4,0]} barSize={12} />
                <Bar dataKey="Costo" fill="#ff4d6d" radius={[0,4,4,0]} barSize={12} />
                <Bar dataKey="Rentabilidad" fill="#6366f1" radius={[0,4,4,0]} barSize={12} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos de rentabilidad" />}
        </ChartContainer>

        <ChartContainer title="Rendimiento por Zonas" icon={<MapPin />} badge="Ingresos" accentColor="#38bdf8">
          {zonePerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zonePerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gZonas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar dataKey="Ingresos" fill="url(#gZonas)" radius={[6,6,0,0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos de zonas" />}
        </ChartContainer>

        <ChartContainer title="Demanda por Día" icon={<Clock />} badge="Órdenes diarias" accentColor="#8b5cf6">
          {heatmapData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDias" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: GRID_COLOR }} />
                <Bar dataKey="Órdenes" fill="url(#gDias)" radius={[6,6,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin datos de días" />}
        </ChartContainer>
      </div>

      {/* ── Top 5 / Bottom 5 ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>

        {/* Top 5 Estrella */}
        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--success-color)', borderRadius: '20px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Award size={16} /> Productos Estrella (Top 5)
          </h2>
          {itemRanking.top.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {itemRanking.top.map((item, i) => {
                const pct = (item.quantity / (itemRanking.top[0]?.quantity || 1)) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: 'var(--success-subtle)', color: 'var(--success-color)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--success-color)', fontWeight: 700, fontSize: '0.84rem' }}>{item.quantity} und</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.71rem', marginLeft: '6px' }}>S/{item.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-hover)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10d990, #6366f1)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState msg="Sin datos de ventas" />}
        </div>

        {/* Bottom 5 Riesgo */}
        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderTop: '3px solid var(--danger-color)', borderRadius: '20px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <AlertTriangle size={16} /> Baja Rotación — Riesgo (Bottom 5)
          </h2>
          {itemRanking.bottom.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {itemRanking.bottom.map((item, i) => {
                const max = itemRanking.bottom.reduce((a, b) => Math.max(a, b.quantity), 0);
                const pct = max > 0 ? (item.quantity / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--danger-color)', fontWeight: 700, fontSize: '0.84rem' }}>{item.quantity} und</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.71rem', marginLeft: '6px' }}>S/{item.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-hover)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff4d6d, #f59e0b)', borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState msg="Sin datos de baja rotación" />}
        </div>

      </div>
    </div>
  );
}
