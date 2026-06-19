import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Plus, Minus, Check, ChevronRight, X, Lock, User as UserIcon, Clock, UtensilsCrossed, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PageHeader from '../components/PageHeader';

export default function Mozo() {
  const navigate = useNavigate();
  const { menu, categories, subcategories, zones, currentUser, logout, businessDay, activeTables, updateTableCart, sendTableOrders, voidTableItem, payTable, users, menuStatus, developerSettings, tableHeadcounts, setTableHeadcounts } = useStore();
  
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [menuSearch, setMenuSearch] = useState('');

  // V5: Session Waiter for the active table
  const [sessionWaiter, setSessionWaiter] = useState(null);
  const [pendingTableAuth, setPendingTableAuth] = useState(null);
  const [authSelectedUser, setAuthSelectedUser] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // V5: Add Item Numpad Modal
  const [pendingItem, setPendingItem] = useState(null);
  const [itemQty, setItemQty] = useState('1');
  const [itemDetails, setItemDetails] = useState('');

  // V5: Headcount Modal
  const [showHeadcountModal, setShowHeadcountModal] = useState(false);
  const [pendingHeadcount, setPendingHeadcount] = useState('1');

  // Admin Auth Modal State
  const [voidItemTarget, setVoidItemTarget] = useState(null);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getOccupiedTime = (cart) => {
    if (!cart || cart.length === 0) return '';
    const start = cart[0].timestamp || Date.now();
    const diff = Math.max(0, currentTime - start);
    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const [adminPassword, setAdminPassword] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  // Responsive: mobile tab switcher
  const [mobileTab, setMobileTab] = useState('menu');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024 && windowWidth > 768;

  useEffect(() => {
    if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } return; } if (currentUser.role !== 'mozo' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') navigate('/');
  }, [currentUser, navigate, developerSettings]);

  const handleLogout = () => { if (currentUser.role === 'admin' || currentUser.role === 'superadmin') { navigate('/admin'); } else { const role = currentUser?.role; const locId = localStorage.getItem('currentLocationId'); logout(); if (role === 'superadmin') { navigate('/super-admin'); } else { navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } } };

  if (!currentUser) return null;

  if (!businessDay.isOpen) {
    return (
      <div className="animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
        <PageHeader
          icon={<UtensilsCrossed />}
          iconGradient="135deg, #ff6b2b, #f43f5e"
          iconGlow="rgba(255,107,43,0.4)"
          title="Terminal de Mozo"
          subtitle="Terminal inactiva"
          badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
          badgeColor="var(--warning-color)"
          actions={
            <button className="btn btn-outline" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }} onClick={handleLogout}>
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
            </button>
          }
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card text-center" style={{ maxWidth: '450px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--danger-color), var(--danger-hover))',
              borderRadius: '20px',
              padding: '1rem',
              boxShadow: '0 0 20px var(--danger-glow)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={36} color="#fff" />
            </div>
            <h1 className="title mb-2" style={{ fontSize: '1.8rem' }}>Caja Cerrada</h1>
            <p className="subtitle" style={{ lineHeight: 1.5 }}>
              La jornada no ha sido iniciada por el administrador. Por favor, solicita la apertura del día para poder gestionar mesas y tomar pedidos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tableKey = selectedZone && selectedTable ? `${selectedZone.id}-${selectedTable}` : null;
  const cart = tableKey ? (activeTables[tableKey] || []) : [];
  const total = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

  // V5 Auth Flow
  const openTableAuth = (tableName) => {
    setPendingTableAuth(tableName);
    setAuthSelectedUser('');
    setAuthPassword('');
    setAuthError('');
  };

  const handleTableAuth = (e) => {
    e.preventDefault();
    const user = users.find(u => u.id === authSelectedUser && u.password === authPassword && u.active);
    if (!user) {
      setAuthError('Credenciales incorrectas');
      return;
    }
    setSessionWaiter(user);
    setSelectedTable(pendingTableAuth);
    setPendingTableAuth(null);
  };

  const closeTable = () => {
    setSelectedTable(null);
    setSessionWaiter(null);
  };

  // V5 Add Item Flow
  const openItemModal = (item) => {
    setPendingItem(item);
    setItemQty('1');
    setItemDetails('');
  };

  const appendQty = (num) => {
    if (itemQty === '0' || itemQty === '1') setItemQty(num);
    else setItemQty(itemQty + num);
  };
  const clearQty = () => setItemQty('1');

  const confirmAddItem = () => {
    const qty = parseInt(itemQty);
    if (isNaN(qty) || qty <= 0) return;

    if (!tableHeadcounts[tableKey] && cart.length === 0) {
      setPendingHeadcount('1');
      setShowHeadcountModal(true);
      return;
    }

    proceedAddItem(qty);
  };

  const proceedAddItem = (qty) => {
    const existing = cart.find(c => c.item.id === pendingItem.id && c.status === 'new' && c.details === itemDetails.trim());
    let newCart;
    if (existing) {
      newCart = cart.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + qty } : c);
    } else {
      newCart = [...cart, { id: uuidv4(), item: pendingItem, quantity: qty, details: itemDetails.trim(), status: 'new', timestamp: Date.now() }];
    }
    updateTableCart(tableKey, newCart);
    setPendingItem(null);
  };

  const confirmHeadcount = () => {
    const hc = parseInt(pendingHeadcount);
    if (isNaN(hc) || hc <= 0) return;
    setTableHeadcounts(prev => ({ ...prev, [tableKey]: hc }));
    setShowHeadcountModal(false);
    if (pendingItem) {
      proceedAddItem(parseInt(itemQty));
    }
  };

  const removeFromCart = (cartItem) => {
    if (!tableKey) return;
    if (cartItem.status === 'sent') {
      setVoidItemTarget(cartItem);
      return;
    }
    updateTableCart(tableKey, cart.filter(c => c.id !== cartItem.id));
  };

  const handleSendOrder = () => {
    if (cart.filter(c => c.status === 'new').length === 0) return;
    sendTableOrders(tableKey, cart, selectedZone.name, selectedTable, sessionWaiter.name);
  };

  const handlePayTable = () => {
    if (cart.length === 0) return;
    payTable(tableKey, total, cart, sessionWaiter.name, selectedZone.name, selectedTable);
    closeTable();
  };

  const executeVoid = (e) => {
    e.preventDefault();
    const adminUser = users.find(u => (u.role === 'admin' || u.role === 'superadmin') && u.password === adminPassword && u.active);
    if (!adminUser) {
      setVoidError('Contraseña incorrecta');
      return;
    }
    if (!voidReason.trim()) {
      setVoidError('Debes escribir un motivo');
      return;
    }
    voidTableItem(tableKey, voidItemTarget.id, voidReason, adminUser);
    setVoidItemTarget(null);
    setAdminPassword('');
    setVoidReason('');
    setVoidError('');
  };

  return (
    <div className="animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {/* Top Nav */}
      <PageHeader
        icon={<UtensilsCrossed />}
        iconGradient="135deg, #ff6b2b, #f43f5e"
        iconGlow="rgba(255,107,43,0.4)"
        title="Terminal de Mozo"
        subtitle="Terminal activa"
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
        badgeColor="var(--warning-color)"
        actions={
          <button className="btn btn-outline" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }} onClick={handleLogout}>
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
          </button>
        }
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: isMobile ? '0.5rem' : '1.5rem' }}>

      {/* Mobile tab bar */}
      {isMobile && (
        <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', marginBottom: '0.75rem' }}>
          <button
            onClick={() => setMobileTab('menu')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              backgroundColor: 'transparent',
              color: mobileTab === 'menu' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: mobileTab === 'menu' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
          >
            🍽️ Menú
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              backgroundColor: 'transparent',
              color: mobileTab === 'cart' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: mobileTab === 'cart' ? '2px solid var(--primary-color)' : '2px solid transparent',
              position: 'relative'
            }}
          >
            🛒 Cuenta {selectedTable ? selectedTable : ''}
            {cart.filter(c => c.status === 'new').length > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '8px', backgroundColor: 'var(--danger-color)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {cart.filter(c => c.status === 'new').length}
              </span>
            )}
          </button>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: '1.5rem', overflow: 'hidden' }}>
        
        {/* Left Side: Tables or Menu — hidden on mobile when cart tab is active */}
        <div style={{
          flex: isMobile ? undefined : 2,
          width: isMobile ? '100%' : undefined,
          minHeight: 0,
          display: isMobile && mobileTab === 'cart' ? 'none' : 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          paddingRight: isMobile ? 0 : '0.5rem'
        }}>
          
          {!selectedZone ? (
            <div className="animate-fade-in">
              <h2 className="title mb-4">Selecciona una Zona</h2>
              <div className="grid grid-cols-2 gap-3">
                {zones.filter(z => z.active).map(z => (
                  <div key={z.id} className="card card-interactive flex justify-between items-center" onClick={() => setSelectedZone(z)}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{z.name}</span>
                    <span className="subtitle">{z.tables.length} mesas</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedTable ? (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setSelectedZone(null)}>Zonas</button>
                <ChevronRight size={16} className="text-secondary" />
                <h2 className="title">{selectedZone.name}</h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {selectedZone.tables.map((tableName, i) => {
                  const tKey = `${selectedZone.id}-${tableName}`;
                  const hasAccount = activeTables[tKey] && activeTables[tKey].length > 0;
                  const borderColor = hasAccount ? 'var(--danger-color)' : 'var(--success-color)';
                  const bgColor = hasAccount ? 'var(--danger-bg)' : 'var(--success-subtle)';

                  return (
                    <div 
                      key={i} 
                      className="card card-interactive flex items-center justify-center flex-col" 
                      style={{ aspectRatio: '1', position: 'relative', border: `2px solid ${borderColor}`, backgroundColor: bgColor, padding: '1rem' }}
                      onClick={() => openTableAuth(tableName)}
                    >
                      <span className="title text-center" style={{ fontSize: tableName.length > 3 ? '1.2rem' : '2rem', wordBreak: 'break-word', lineHeight: 1.2 }}>{tableName}</span>
                      <span style={{ position: 'absolute', bottom: '10px', fontSize: '0.75rem', color: borderColor, fontWeight: 600 }}>
                        {hasAccount ? `OCUPADA • ${getOccupiedTime(activeTables[tKey])}` : 'LIBRE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex mb-4 justify-between" style={{ flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }} onClick={closeTable}>{selectedZone.name}</button>
                  <ChevronRight size={16} className="text-secondary" />
                  <h2 className="title text-primary-color" style={{ fontSize: '1.25rem', margin: 0 }}>{selectedTable}</h2>
                </div>
                <div className="flex items-center gap-2 subtitle" style={{ flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <UserIcon size={16} /> Atendiendo: <strong style={{ color: 'var(--text-color)' }}>{sessionWaiter?.name}</strong>
                  <span style={{ color: 'var(--warning-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> {getOccupiedTime(cart)}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2rem', paddingTop: '0.55rem', paddingBottom: '0.55rem' }}
                  placeholder="Buscar plato por nombre..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                />
                {menuSearch && (
                  <button 
                    onClick={() => setMenuSearch('')} 
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2" style={{ scrollbarWidth: 'none', maxWidth: '100vw' }}>
                {categories.filter(c => c.active).map(c => (
                  <button 
                    key={c.id} 
                    className={`btn ${activeCategory === c.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => { setActiveCategory(c.id); setActiveSubcategory(''); setMenuSearch(''); }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              
              {/* Subcategories */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4" style={{ scrollbarWidth: 'none', maxWidth: '100vw' }}>
                <button 
                  className={`btn ${activeSubcategory === '' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ whiteSpace: 'nowrap', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => { setActiveSubcategory(''); setMenuSearch(''); }}
                >
                  Todas
                </button>
                {subcategories?.filter(s => s.categoryId === activeCategory && s.active !== false).map(s => (
                  <button 
                    key={s.id} 
                    className={`btn ${activeSubcategory === s.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ whiteSpace: 'nowrap', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                    onClick={() => { setActiveSubcategory(s.id); setMenuSearch(''); }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-6">
                {menu
                  .filter(m => {
                    const matchesSearch = (m.name || '').toLowerCase().includes(menuSearch.toLowerCase());
                    if (menuSearch) {
                      return m.active && menuStatus[m.id] !== false && matchesSearch;
                    }
                    return m.active && menuStatus[m.id] !== false && m.categoryId === activeCategory && (activeSubcategory === '' || m.subcategoryId === activeSubcategory);
                  })
                  .map(item => (
                    <div key={item.id} className="card card-interactive flex justify-between items-center" onClick={() => openItemModal(item)}>
                      <div>
                        <h3 style={{ fontWeight: 500 }}>{item.name}</h3>
                        <p className="subtitle" style={{ color: 'var(--primary-color)' }}>S/{item.price.toFixed(2)}</p>
                      </div>
                      <div style={{ backgroundColor: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '50%' }}>
                        <Plus size={20} className="text-primary-color" />
                      </div>
                    </div>
                  ))}
                {menu.filter(m => {
                  const matchesSearch = (m.name || '').toLowerCase().includes(menuSearch.toLowerCase());
                  if (menuSearch) {
                    return m.active && menuStatus[m.id] !== false && matchesSearch;
                  }
                  return m.active && menuStatus[m.id] !== false && m.categoryId === activeCategory && (activeSubcategory === '' || m.subcategoryId === activeSubcategory);
                }).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se encontraron platos.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order / Account Cart — hidden on mobile when menu tab is active */}
        <div className="card" style={{
          flex: isMobile ? undefined : 1,
          width: isMobile ? '100%' : undefined,
          minHeight: 0,
          padding: isMobile ? '1rem' : '1.5rem',
          display: isMobile && mobileTab === 'menu' ? 'none' : 'flex',
          flexDirection: 'column'
        }}>
          <div className="flex-none flex items-center gap-2 mb-4">
            <ShoppingCart size={24} style={{ color: 'var(--primary-color)' }} />
            <h2 className="title" style={{ fontSize: '1.25rem' }}>Cuenta {selectedTable ? selectedTable : ''}</h2>
          </div>

          {/* Scrollable items box */}
          <div style={{ overflowY: 'auto', maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 320px)', paddingRight: '0.25rem', marginBottom: '0.5rem' }}>
            {cart.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Selecciona una mesa y añade productos.
              </div>
            ) : (
              cart.map(c => (
                <div key={c.id} className="flex flex-col gap-1 p-3 mb-3" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-color)', position: 'relative' }}>
                  <div className="flex justify-between items-center">
                    <h4 style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.quantity}x {c.item.name}</h4>
                    <p className="subtitle" style={{ color: 'var(--primary-color)' }}>S/{(c.item.price * c.quantity).toFixed(2)}</p>
                  </div>
                  
                  {c.details && <p style={{ fontSize: '0.8rem', color: 'var(--warning-color)', fontStyle: 'italic', marginBottom: '0.2rem' }}>Nota: {c.details}</p>}
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="subtitle" style={{ fontSize: '0.8rem' }}>S/{c.item.price.toFixed(2)} c/u</span>
                    <div className="flex items-center gap-3">
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderColor: c.status === 'sent' ? 'var(--danger-color)' : 'var(--border-color)', color: c.status === 'sent' ? 'var(--danger-color)' : 'inherit' }} onClick={() => removeFromCart(c)}>
                        {c.status === 'sent' ? 'Eliminar' : 'Quitar'}
                      </button>
                    </div>
                  </div>
                  {c.status === 'sent' && <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--primary-color)', color: '#000', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 'bold' }}>ENVIADO</span>}
                </div>
              ))
            )}
          </div>

          <div className="flex-none" style={{ marginTop: '1rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1rem' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="title" style={{ fontSize: '1.25rem' }}>Total</span>
              <span className="title" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>S/{total.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {cart.some(c => c.status === 'new') && (
                <button className="btn btn-primary w-full" style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }} onClick={handleSendOrder}>
                  <Check size={20} /> Enviar Nuevos a Cocina
                </button>
              )}
              {cart.length > 0 && cart.every(c => c.status === 'sent') && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1.5px dashed var(--primary-color)',
                  backgroundColor: 'rgba(16,185,129,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                    Listo para cobrar
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Dirija al cliente a la <strong style={{ color: 'var(--text-primary)' }}>Caja</strong> para procesar el pago y liberar la mesa.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
{/* V5: Table Auth Modal */}
      {pendingTableAuth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card animate-fade-in" style={{ width: '90vw', maxWidth: '400px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="title flex items-center gap-2"><Lock size={20}/> Acceso a la Mesa</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setPendingTableAuth(null)}><X size={16}/></button>
            </div>
            <p className="subtitle mb-4">Identifícate para gestionar la cuenta de la <strong>{pendingTableAuth}</strong></p>
            
            {authError && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginBottom: '1rem' }}>{authError}</p>}
            
            <form onSubmit={handleTableAuth} className="flex flex-col gap-4">
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Selecciona tu Usuario</label>
                <select className="input mt-1 w-full" value={authSelectedUser} onChange={e => setAuthSelectedUser(e.target.value)} required>
                  <option value="">-- Elige un Mozo --</option>
                  {users.filter(u => u.role === 'mozo' || u.role === 'admin' || u.role === 'superadmin').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Contraseña (PIN)</label>
                <input type="password" className="input mt-1 w-full text-center" style={{ fontSize: '1.25rem', letterSpacing: '0.5rem' }} value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                
                {/* Virtual Numpad — 3 columnas iguales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {['1','2','3','4','5','6','7','8','9','0','C'].map(num => (
                    <button 
                      key={num} 
                      type="button"
                      className="btn btn-outline justify-center" 
                      style={{
                        padding: '0.85rem',
                        fontSize: '1.25rem',
                        gridColumn: num === '0' ? 'span 2' : 'span 1',
                        backgroundColor: num === 'C' ? 'var(--danger-bg)' : 'transparent',
                        color: num === 'C' ? 'var(--danger-color)' : 'inherit',
                        borderColor: num === 'C' ? 'var(--danger-color)' : 'var(--border-color)'
                      }}
                      onClick={() => num === 'C' ? setAuthPassword('') : setAuthPassword(prev => prev + num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary justify-center" style={{ marginTop: '0.5rem', padding: '0.85rem' }}>Abrir Mesa</button>
            </form>
          </div>
        </div>
      )}

      {/* V5: Add Item Details & Numpad Modal */}
      {pendingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '90vw', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="title" style={{ fontSize: '1.25rem' }}>{pendingItem.name}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setPendingItem(null)}><X size={16}/></button>
            </div>
            
            <div className="flex gap-6">
              <div style={{ flex: 1 }}>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Cantidad</label>
                <div className="input mt-1 w-full text-center" style={{ fontSize: '2rem', padding: '1rem', fontWeight: 'bold' }}>
                  {itemQty}
                </div>
                
                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {['1','2','3','4','5','6','7','8','9','C','0'].map(num => (
                    <button 
                      key={num} 
                      type="button"
                      className="btn btn-outline justify-center" 
                      style={{ padding: '1rem', fontSize: '1.25rem', gridColumn: num === '0' ? 'span 2' : 'span 1', backgroundColor: num === 'C' ? 'var(--danger-bg)' : 'transparent', color: num === 'C' ? 'var(--danger-color)' : 'inherit', borderColor: num === 'C' ? 'var(--danger-color)' : 'var(--border-color)' }}
                      onClick={() => num === 'C' ? clearQty() : appendQty(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Detalles / Notas</label>
                <textarea 
                  className="input mt-1 w-full flex-1" 
                  style={{ resize: 'none' }}
                  placeholder="Ej. Sin cebolla, bien cocido..."
                  value={itemDetails}
                  onChange={e => setItemDetails(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary w-full justify-center mt-6" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={confirmAddItem}>
              Añadir a la cuenta (S/{(pendingItem.price * parseInt(itemQty)).toFixed(2)})
            </button>
          </div>
        </div>
      )}

      {/* Admin Auth Modal for Voids */}
      {voidItemTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '400px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="title flex items-center gap-2 text-danger"><Lock size={20}/> Autorización de Administrador</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => { setVoidItemTarget(null); setVoidError(''); }}><X size={16}/></button>
            </div>
            <p className="subtitle mb-4">Se requiere permisos para anular: <strong>{voidItemTarget.item.name}</strong></p>
            
            {voidError && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginBottom: '1rem' }}>{voidError}</p>}
            
            <form onSubmit={executeVoid} className="flex flex-col gap-4">
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Contraseña de Administrador</label>
                <input type="password" className="input mt-1 w-full" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Motivo de la Anulación</label>
                <input type="text" className="input mt-1 w-full" value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="Ej. Cliente cambió de opinión" required />
              </div>
              <button type="submit" className="btn justify-center" style={{ backgroundColor: 'var(--danger-color)', color: 'white', marginTop: '1rem' }}>Anular Plato</button>
            </form>
          </div>
        </div>
      )}

      {/* Headcount Modal */}
      {showHeadcountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '350px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="title flex items-center gap-2"><UserIcon size={20}/> Número de Comensales</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => { setShowHeadcountModal(false); setPendingItem(null); }}><X size={16}/></button>
            </div>
            <p className="subtitle mb-4 text-sm text-gray-400">¿Cuántas personas se van a sentar en esta mesa?</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-4 my-4">
                <button className="btn btn-outline" style={{ padding: '1rem', borderRadius: '50%' }} onClick={() => setPendingHeadcount(Math.max(1, parseInt(pendingHeadcount) - 1).toString())}><Minus size={24}/></button>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', width: '3rem', textAlign: 'center' }}>{pendingHeadcount}</div>
                <button className="btn btn-outline" style={{ padding: '1rem', borderRadius: '50%' }} onClick={() => setPendingHeadcount((parseInt(pendingHeadcount) + 1).toString())}><Plus size={24}/></button>
              </div>
              
              <button className="btn btn-primary w-full justify-center mt-4" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={confirmHeadcount}>
                Confirmar y Añadir Pedido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
