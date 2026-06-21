import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Wine, Check, Clock, Play } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function Bar() {
  const navigate = useNavigate();
  const { orders, updateOrderItemStatus, currentUser, logout , developerSettings } = useStore();
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

  // Flatten orders into individual items
  const allBarItems = [];
  orders.forEach(order => {
    if (order.station === 'bar' && order.status !== 'ready') {
      order.items.forEach(item => {
        let itemStatus = item.status || order.status || 'pending';
        if (itemStatus === 'new') itemStatus = 'pending'; // Map cart 'new' status to 'pending'
        
        if (itemStatus !== 'ready') {
          allBarItems.push({
            orderId: order.id,
            itemId: item.id,
            itemName: item.item.name,
            quantity: item.quantity,
            details: item.details,
            table: order.table,
            zone: order.zone,
            waiter: order.waiter,
            timestamp: order.timestamp,
            status: itemStatus
          });
        }
      });
    }
  });

  const pendingItems = allBarItems.filter(i => i.status === 'pending');
  const preparingItems = allBarItems.filter(i => i.status === 'preparing');

  const ItemRow = ({ item, nextStatus, nextLabel, icon: Icon, color }) => (
    <div className="flex items-center justify-between py-3 px-2 animate-fade-in" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-3">
          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.2rem', minWidth: '35px' }}>{item.quantity}x</span>
          <div>
            <span style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.itemName}</span>
            {item.details && <span style={{ fontSize: '0.85rem', color: 'var(--warning-color)', fontStyle: 'italic', marginLeft: '8px' }}>(Nota: {item.details})</span>}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Mesa: <strong style={{ color: 'var(--text-primary)' }}>{item.table}</strong> ({item.zone})</span>
          <span>Mozo: <strong style={{ color: 'var(--text-primary)' }}>{item.waiter}</strong></span>
          <span className="flex items-center gap-1" style={{ color: color }}><Clock size={12}/> {getWaitTime(item.timestamp)}</span>
        </div>
      </div>
      <div>
        <button 
          className="btn flex items-center justify-center" 
          style={{ backgroundColor: color, color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.9rem', borderRadius: '4px' }}
          onClick={() => updateOrderItemStatus(item.orderId, item.itemId, nextStatus)}
        >
          <Icon size={14} className="mr-2" /> {nextLabel}
        </button>
      </div>
    </div>
  );

  const barItemsToDisplay = [...pendingItems, ...preparingItems].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex flex-col" style={{ height: '100vh', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      <PageHeader
        icon={<Wine />}
        iconGradient="135deg, #6366f1, #38bdf8"
        iconGlow="rgba(99,102,241,0.4)"
        title="Tablero de Bar"
        subtitle="Control y Tráfico de Bebidas"
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
        badgeColor="var(--warning-color)"
        actions={
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={handleLogout}>
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
          </button>
        }
      />

      <div className="flex-1" style={{ overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Cant.</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Producto / Detalle</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Mozo</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Mesa</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Tiempo</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {barItemsToDisplay.map(item => {
                const isPending = item.status === 'pending';
                const actionColor = isPending ? 'var(--warning-color)' : 'var(--success-color)';
                const ActionIcon = isPending ? Play : Check;
                const actionLabel = isPending ? 'Preparar' : 'Despachar';
                const nextStatus = isPending ? 'preparing' : 'ready';

                return (
                  <tr key={`${item.orderId}-${item.itemId}`} className="animate-fade-in" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.1rem' }}>{item.quantity}x</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.itemName}</div>
                      {item.details && <div style={{ fontSize: '0.85rem', color: 'var(--warning-color)', fontStyle: 'italic', marginTop: '0.2rem' }}>Nota: {item.details}</div>}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.waiter}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ backgroundColor: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>Mesa {item.table}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.zone}</div>
                    </td>
                    <td style={{ padding: '1rem', color: isPending ? 'var(--warning-color)' : 'var(--primary-color)', fontSize: '0.9rem' }}>
                      <span className="flex items-center gap-1"><Clock size={14}/> {getWaitTime(item.timestamp)}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button 
                        className="btn flex items-center justify-center w-full" 
                        style={{ backgroundColor: actionColor, color: 'white', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '4px' }}
                        onClick={() => updateOrderItemStatus(item.orderId, item.itemId, nextStatus)}
                      >
                        <ActionIcon size={16} className="mr-2" /> {actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {barItemsToDisplay.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay bebidas pendientes ni en preparación.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
