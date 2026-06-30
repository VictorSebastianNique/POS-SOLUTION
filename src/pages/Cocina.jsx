import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChefHat, Check, Clock, Play, Send, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const OrderCard = ({ order, currentTime, dispatchOrderItems, setConfirmDispatch }) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Filter out items that are already dispatched (ready) - declared early so it can be used below
  const visibleItems = order.items.filter(c => c.status !== 'ready');

  const toggleAll = () => {
    if (selectedItems.length === visibleItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(visibleItems.map(c => c.id));
    }
  };

  const allSelected = visibleItems.length > 0 && selectedItems.length === visibleItems.length;

  const handleDispatch = () => {
    if (selectedItems.length === 0) return;
    
    const willCompleteOrder = selectedItems.length === visibleItems.length;
    if ((order.type === 'delivery' || order.type === 'recojo') && willCompleteOrder) {
      setConfirmDispatch({
        order,
        itemIds: selectedItems,
        callback: () => setSelectedItems([])
      });
      return;
    }

    dispatchOrderItems(order.id, selectedItems);
    setSelectedItems([]);
  };

  // Filter out items that are already dispatched (ready)

  const orderTime = new Date(order.timestamp).getTime() || Date.now();
  const diff = Math.max(0, currentTime - orderTime);
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  let timeColor = 'var(--success-color)';
  if (mins >= 15) timeColor = 'var(--danger-color)';
  else if (mins >= 7) timeColor = 'var(--warning-color)';

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'var(--warning-color)';
      case 'preparing': return 'var(--primary-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="card animate-fade-in flex flex-col" style={{ borderTop: `4px solid ${getStatusColor(order.status)}`, backgroundColor: 'var(--surface-color)', padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          {order.type === 'delivery' ? (
            <h3 className="title" style={{ fontSize: '1.05rem', lineHeight: 1.2, margin: 0, padding: 0, marginBottom: '2px' }}>DELIVERY: {order.customerName}</h3>
          ) : (
            <h3 className="title" style={{ fontSize: '1.1rem', lineHeight: 1.2, margin: 0, padding: 0, marginBottom: '2px' }}>Mesa {order.table}</h3>
          )}
          <p className="subtitle" style={{ fontSize: '0.75rem', margin: 0, padding: 0 }}>{order.type === 'delivery' ? order.customerPhone : order.zone}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1" style={{ fontSize: '1rem', color: timeColor, fontWeight: 'bold' }}>
            <Clock size={12}/> {timeStr}
          </span>
          <span className="subtitle" style={{ fontSize: '0.65rem' }}>Mozo: <span style={{color: 'var(--text-primary)'}}>{order.waiter}</span></span>
        </div>
      </div>
      
      {/* Select All row */}
      <div 
        className="flex items-center gap-2 cursor-pointer mb-2 pb-1"
        style={{ borderBottom: '2px solid var(--border-color)' }}
        onClick={toggleAll}
      >
        <div style={{ 
          width: '16px', height: '16px', flexShrink: 0,
          borderRadius: '3px', 
          border: `2px solid ${allSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
          backgroundColor: allSelected ? 'var(--primary-color)' : (selectedItems.length > 0 ? 'rgba(16,185,129,0.3)' : 'transparent'),
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {allSelected && <Check size={12} color="#000" />}
          {!allSelected && selectedItems.length > 0 && <div style={{ width: '8px', height: '2px', backgroundColor: 'var(--primary-color)' }} />}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', userSelect: 'none' }}>
          {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'} ({visibleItems.length})
        </span>
      </div>
      <div className="flex-1 mb-2" style={{ overflowY: 'auto', paddingRight: '4px', minHeight: '80px' }}>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {visibleItems.map((c, i) => {
            const isChecked = selectedItems.includes(c.id);
            return (
              <li key={c.id} 
                  className="flex items-start gap-2 py-1 cursor-pointer" 
                  style={{ borderBottom: '1px dashed var(--border-color)' }}
                  onClick={() => toggleItem(c.id)}
              >
                <div style={{ marginTop: '0.15rem' }}>
                  <div style={{ 
                    width: '16px', height: '16px', 
                    borderRadius: '3px', 
                    border: `2px solid ${isChecked ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    backgroundColor: isChecked ? 'var(--primary-color)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isChecked && <Check size={12} color="#000" />}
                  </div>
                </div>
                <div className="flex-1" style={{ lineHeight: 1.2 }}>
                  <span style={{ fontWeight: isChecked ? 600 : 500, fontSize: '0.85rem', color: isChecked ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                    <span style={{color: 'var(--primary-color)'}}>{c.quantity}x</span> {c.item.name}
                  </span>
                  {c.details && <div style={{ fontSize: '0.7rem', color: 'var(--warning-color)', fontStyle: 'italic', marginTop: '0.1rem' }}>Nota: {c.details}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <button 
        className="btn w-full justify-center" 
        style={{ padding: '0.4rem', fontSize: '0.85rem', backgroundColor: selectedItems.length > 0 ? 'var(--success-color)' : 'var(--border-color)', color: selectedItems.length > 0 ? '#fff' : 'var(--text-secondary)', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', marginTop: 'auto' }}
        onClick={handleDispatch}
        disabled={selectedItems.length === 0}
      >
        <Send size={14} style={{ marginRight: '4px' }} /> Despachar ({selectedItems.length})
      </button>
    </div>
  );
};

export default function Cocina() {
  const navigate = useNavigate();
  const { orders, setOrders, updateOrderStatus, dispatchOrderItems, currentUser, logout, categories, subcategories, menu, menuStatus, updateMenuStatus, developerSettings } = useStore();
  const [confirmDispatch, setConfirmDispatch] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeStations, setActiveStations] = useState([]);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [viewMode, setViewMode] = useState('ordenes'); // 'ordenes' | 'platos'
  const [platosSearch, setPlatosSearch] = useState('');

  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const gridCols = windowSize.w <= 480 ? 1 : windowSize.w <= 768 ? 2 : windowSize.w <= 1024 ? 3 : 5;

  useEffect(() => {
    if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } return; } if (currentUser.role !== 'cocina' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') navigate('/');
  }, [currentUser, navigate, developerSettings]);

  // Update time every second for MM:SS display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh orders every 3 seconds from the server
  // Smart merge: add new orders from server, preserve local dispatch state
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const locId = localStorage.getItem('currentLocationId');
        if (!locId) return;
        const res = await fetch(`/api/store/local/${locId}?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.orders) {
          setOrders(localOrders => {
            const serverOrders = data.orders;
            const result = [...localOrders];
            let changed = false;

            serverOrders.forEach(serverOrder => {
              const localIdx = result.findIndex(o => o.id === serverOrder.id);
              if (localIdx === -1) {
                // Truly new order from another device/tab — add it
                result.push(serverOrder);
                changed = true;
              } else {
                // Existing order: merge items, keeping local 'ready' status
                const localOrder = result[localIdx];
                const mergedItems = serverOrder.items.map(serverItem => {
                  const localItem = localOrder.items.find(li => li.id === serverItem.id);
                  // If local already dispatched this item, trust local state
                  if (localItem && localItem.status === 'ready') return localItem;
                  return serverItem;
                });
                // Keep any local-only items that the server doesn't have yet
                const serverItemIds = new Set(serverOrder.items.map(i => i.id));
                const localOnlyItems = localOrder.items.filter(i => !serverItemIds.has(i.id));
                const allItems = [...mergedItems, ...localOnlyItems];
                const allReady = allItems.every(i => i.status === 'ready');

                const newMergedOrder = {
                  ...serverOrder,
                  items: allItems,
                  status: allReady ? 'ready' : serverOrder.status
                };

                // Only update if something actually changed to prevent infinite upload loops
                if (JSON.stringify(localOrder) !== JSON.stringify(newMergedOrder)) {
                  result[localIdx] = newMergedOrder;
                  changed = true;
                }
              }
            });

            return changed ? result : localOrders;
          });
        }
      } catch (e) {
        // silently ignore network errors during poll
      }
    }, 3000);
    return () => clearInterval(poll);
  }, []);

  const handleLogout = () => { if (currentUser.role === 'admin' || currentUser.role === 'superadmin') { navigate('/admin'); } else { const role = currentUser?.role; const locId = localStorage.getItem('currentLocationId'); logout(); if (role === 'superadmin') { navigate('/super-admin'); } else { navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } } };

  if (!currentUser) return null;

  const handleToggleStation = (subcatId) => {
    setActiveStations(prev => 
      prev.includes(subcatId) ? prev.filter(id => id !== subcatId) : [...prev, subcatId]
    );
  };

  const cocinaCategories = categories.filter(c => !c.station || c.station === 'cocina').map(c => c.id);
  const cocinaSubcategories = subcategories ? subcategories.filter(s => cocinaCategories.includes(s.categoryId)) : [];

  // ONLY SHOW COCINA ORDERS
  const cocinaOrders = orders
    .filter(o => (!o.station || o.station === 'cocina') && o.status !== 'ready' && o.status !== 'pending_approval')
    .map(o => {
      if (activeStations.length === 0) return o;
      // Filter items based on selected subcategories
      const filteredItems = o.items.filter(c => {
        const subcatId = c.item.subcategoryId;
        return subcatId && activeStations.includes(subcatId);
      });
      return { ...o, items: filteredItems };
    })
    .filter(o => o.items.length > 0 && o.items.some(i => i.status !== 'ready')); // Hide if all matching items are ready

  return (
    <div className="flex flex-col" style={{ height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <PageHeader
        icon={<ChefHat />}
        iconGradient="135deg, #f59e0b, #ef4444"
        iconGlow="rgba(245,158,11,0.4)"
        title="Tablero de Cocina"
        subtitle="Cocina activa"
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
        badgeColor="var(--warning-color)"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setViewMode('ordenes')}
                style={{ padding: '0.4rem 0.9rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  background: viewMode === 'ordenes' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'ordenes' ? '#fff' : 'var(--text-secondary)'
                }}
              >📋 Órdenes</button>
              <button
                onClick={() => setViewMode('platos')}
                style={{ padding: '0.4rem 0.9rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  background: viewMode === 'platos' ? 'var(--warning-color)' : 'transparent',
                  color: viewMode === 'platos' ? '#fff' : 'var(--text-secondary)'
                }}
              >🍽️ Platos</button>
            </div>
            <button className="btn btn-outline" style={{ color: 'var(--success-color)', borderColor: 'var(--success-color)' }} onClick={() => navigate('/kardex')}>
              📊 Kardex
            </button>
            <button className="btn btn-outline" onClick={handleLogout}>
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
            </button>
          </div>
        }
      />


      {/* ── MODO ÓRDENES ───────────────────── */}
      {viewMode === 'ordenes' && (
        <>
          {cocinaSubcategories.length > 0 && (
            <div className="px-6 pb-2">
              <p className="subtitle mb-2 text-sm">Filtrar por Estación (Múltiple):</p>
              <div className="flex gap-2 flex-wrap">
                <button 
                  className={`btn ${activeStations.length === 0 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveStations([])}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Todas las Estaciones
                </button>
                {cocinaSubcategories.map(s => (
                  <button 
                    key={s.id}
                    className={`btn ${activeStations.includes(s.id) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleToggleStation(s.id)}
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div 
            className="flex-1 p-4 pt-2 overflow-y-auto custom-scrollbar"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              gridAutoRows: 'max-content',
              alignContent: 'start',
              alignItems: 'start',
              gap: windowSize.w <= 768 ? '0.5rem' : '1rem',
            }}
          >
            {cocinaOrders.map(o => (
              <OrderCard 
                key={o.id} 
                order={o} 
                currentTime={currentTime} 
                dispatchOrderItems={dispatchOrderItems}
                setConfirmDispatch={setConfirmDispatch}
              />
            ))}
            {cocinaOrders.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '2rem' }}>
                <p className="subtitle text-xl">No hay pedidos pendientes para las estaciones seleccionadas.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODO PLATOS ────────────────────── */}
      {viewMode === 'platos' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 1rem 1rem' }}>
          {/* Search + stats bar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' }}
                placeholder="Buscar plato..."
                value={platosSearch}
                onChange={e => setPlatosSearch(e.target.value)}
                autoFocus
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>{menu.filter(m => m.active !== false && menuStatus[m.id] !== false).length}</span> activos
              {' / '}
              <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>{menu.filter(m => m.active === false || menuStatus[m.id] === false).length}</span> inactivos
            </span>
          </div>

          {/* Grid of dishes grouped by category */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {categories.map(cat => {
              const catItems = menu.filter(m =>
                m.categoryId === cat.id &&
                (m.name || '').toLowerCase().includes((platosSearch || '').toLowerCase())
              );
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.5rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--border-color)' }}>
                    {cat.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: windowSize.w <= 480 ? '1fr' : windowSize.w <= 768 ? 'repeat(2,1fr)' : windowSize.w <= 1200 ? 'repeat(3,1fr)' : 'repeat(4,1fr)', gap: '0.5rem' }}>
                    {catItems.map(m => {
                      const isActive = m.active !== false && menuStatus[m.id] !== false;
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: `1.5px solid ${isActive ? 'var(--success-color)' : 'var(--danger-color)'}`,
                            backgroundColor: isActive ? 'rgba(16,185,129,0.07)' : 'rgba(255,71,87,0.07)',
                            transition: 'all 0.2s',
                            opacity: isActive ? 1 : 0.7,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {m.name}
                            </p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>S/{parseFloat(m.price).toFixed(2)}</p>
                          </div>
                          {/* Toggle button */}
                          <button
                            onClick={() => updateMenuStatus({ ...menuStatus, [m.id]: isActive ? false : true })}
                            title={isActive ? 'Desactivar plato localmente' : 'Activar plato localmente'}
                            style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0.2rem' }}
                          >
                            {isActive
                              ? <ToggleRight size={28} style={{ color: 'var(--success-color)' }} />
                              : <ToggleLeft size={28} style={{ color: 'var(--danger-color)' }} />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {menu.filter(m => (m.name || '').toLowerCase().includes((platosSearch || '').toLowerCase())).length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No se encontraron platos con "{platosSearch}"
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDispatch && (
        <div className="modal animate-fade-in" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px', backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', width: '90%' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.2rem' }}>Confirmar Despacho</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>¿Estás seguro que sale ese pedido?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary w-full"
                style={{ padding: '0.8rem', fontWeight: 600 }}
                onClick={() => setConfirmDispatch(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary w-full"
                style={{ padding: '0.8rem', fontWeight: 600 }}
                onClick={() => {
                  dispatchOrderItems(confirmDispatch.order.id, confirmDispatch.itemIds);
                  if (confirmDispatch.callback) confirmDispatch.callback();
                  setConfirmDispatch(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
