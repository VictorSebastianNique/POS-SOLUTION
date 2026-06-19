import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Wine, Check, Clock, Play } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function Bar() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, currentUser, logout , developerSettings } = useStore();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } return; } if (currentUser.role !== 'bar' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') navigate('/');
  }, [currentUser, navigate, developerSettings]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') navigate('/admin');
    else { logout(); }
  };

  if (!currentUser) return null;

  const getWaitTime = (timestamp) => {
    const diff = Math.floor((currentTime - timestamp) / 60000);
    return diff < 1 ? 'Justo ahora' : `Hace ${diff} min`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'var(--warning-color)';
      case 'preparing': return 'var(--primary-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const barOrders = orders.filter(o => o.station === 'bar');
  const pendingOrders = barOrders.filter(o => o.status === 'pending');
  const preparingOrders = barOrders.filter(o => o.status === 'preparing');

  const OrderCard = ({ order, nextStatus, nextLabel, icon: Icon }) => (
    <div className="card animate-fade-in" style={{ borderTop: `4px solid ${getStatusColor(order.status)}`, backgroundColor: 'var(--surface-color)' }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="title" style={{ fontSize: '1.1rem' }}>Mesa {order.table}</h3>
          <p className="subtitle" style={{ fontSize: '0.8rem' }}>{order.zone}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1 subtitle" style={{ fontSize: '0.8rem', color: 'var(--warning-color)' }}><Clock size={12}/> {getWaitTime(order.timestamp)}</span>
          <span className="subtitle" style={{ fontSize: '0.75rem' }}>Mozo: <span style={{color: 'var(--text-primary)'}}>{order.waiter}</span></span>
        </div>
      </div>
      
      <div className="mb-4">
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {order.items.map((c, i) => (
            <li key={i} className="flex flex-col py-2" style={{ borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontWeight: 500, fontSize: '0.95rem' }}><span style={{color: 'var(--primary-color)'}}>{c.quantity}x</span> {c.item.name}</span>
              {c.details && <span style={{ fontSize: '0.8rem', color: 'var(--warning-color)', fontStyle: 'italic', marginTop: '0.2rem' }}>Nota: {c.details}</span>}
            </li>
          ))}
        </ul>
      </div>

      <button 
        className="btn w-full justify-center" 
        style={{ width: '100%', backgroundColor: getStatusColor(order.status), color: 'white', padding: '0.6rem' }}
        onClick={() => updateOrderStatus(order.id, nextStatus)}
      >
        <Icon size={16} /> {nextLabel}
      </button>
    </div>
  );

  /* Mobile tab bar for small screens */
  const TabBar = () => (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }} className="show-mobile-flex">
      <button
        onClick={() => setActiveTab('pending')}
        style={{
          flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
          backgroundColor: activeTab === 'pending' ? 'rgba(245,158,11,0.15)' : 'transparent',
          color: activeTab === 'pending' ? 'var(--warning-color)' : 'var(--text-secondary)',
          borderBottom: activeTab === 'pending' ? '2px solid var(--warning-color)' : '2px solid transparent'
        }}
      >
        ⏳ Pendientes ({pendingOrders.length})
      </button>
      <button
        onClick={() => setActiveTab('preparing')}
        style={{
          flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
          backgroundColor: activeTab === 'preparing' ? 'rgba(16,185,129,0.15)' : 'transparent',
          color: activeTab === 'preparing' ? 'var(--primary-color)' : 'var(--text-secondary)',
          borderBottom: activeTab === 'preparing' ? '2px solid var(--primary-color)' : '2px solid transparent'
        }}
      >
        🍹 Preparando ({preparingOrders.length})
      </button>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: '100vh', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      <PageHeader
        icon={<Wine />}
        iconGradient="135deg, #6366f1, #38bdf8"
        iconGlow="rgba(99,102,241,0.4)"
        title="Tablero de Bar"
        subtitle="Bar activo"
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
        badgeColor="var(--warning-color)"
        actions={
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={handleLogout}>
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
          </button>
        }
      />

      {/* Mobile tab switcher */}
      <TabBar />

      {/* Desktop: two columns. Mobile: single panel based on tab */}
      <div className="flex-1" style={{ overflow: 'hidden', display: 'flex', gap: '1rem', padding: '1rem' }}>
        {/* Pending column */}
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-color)',
            overflow: 'hidden',
            /* Hide on mobile if not active tab */
            display: typeof window !== 'undefined' && window.innerWidth <= 768 && activeTab !== 'pending' ? 'none' : 'flex',
          }}
          id="bar-pending-col"
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(245,158,11,0.08)', flexShrink: 0 }}>
            <h2 className="title flex items-center gap-2" style={{ color: 'var(--warning-color)', fontSize: '1rem' }}>
              <span style={{ backgroundColor: 'var(--warning-color)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.85rem' }}>{pendingOrders.length}</span>
              Nuevos / Pendientes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
            {pendingOrders.map(o => (<OrderCard key={o.id} order={o} nextStatus="preparing" nextLabel="Preparar" icon={Play} />))}
            {pendingOrders.length === 0 && <p className="text-center" style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>No hay pedidos pendientes</p>}
          </div>
        </div>

        {/* Preparing column */}
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-color)',
            overflow: 'hidden',
            display: typeof window !== 'undefined' && window.innerWidth <= 768 && activeTab !== 'preparing' ? 'none' : 'flex',
          }}
          id="bar-preparing-col"
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(16,185,129,0.08)', flexShrink: 0 }}>
            <h2 className="title flex items-center gap-2" style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>
              <span style={{ backgroundColor: 'var(--primary-color)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.85rem' }}>{preparingOrders.length}</span>
              En Preparación
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
            {preparingOrders.map(o => (<OrderCard key={o.id} order={o} nextStatus="ready" nextLabel="Listo ✓" icon={Check} />))}
            {preparingOrders.length === 0 && <p className="text-center" style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>No hay pedidos en preparación</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
