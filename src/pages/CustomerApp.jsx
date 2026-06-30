import { useAlert } from '../context/AlertContext';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, Search, User, ChevronLeft, Plus, Minus, X, Check, MapPin, Star, QrCode, ArrowRight, LogOut, Coffee, Pizza, Croissant, CakeSlice, CreditCard, Banknote, Smartphone, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// --- Helper Funcs ---
const getCategoryGradient = (catName) => {
  const { showAlert } = useAlert();
  const name = catName.toLowerCase();
  if (name.includes('cafe') || name.includes('café') || name.includes('caliente')) return 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)';
  if (name.includes('postre') || name.includes('dulce') || name.includes('torta')) return 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)';
  if (name.includes('pan') || name.includes('desayuno') || name.includes('ensalada')) return 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)';
  if (name.includes('bebida') || name.includes('frio')) return 'linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%)';
  return 'linear-gradient(135deg, var(--primary-color) 0%, var(--warning-color) 100%)';
};

const getCategoryIcon = (catName) => {
  const name = (catName || '').toLowerCase();
  if (name.includes('cafe') || name.includes('café') || name.includes('caliente')) return <Coffee size={40} />;
  if (name.includes('postre') || name.includes('dulce') || name.includes('torta')) return <CakeSlice size={40} />;
  if (name.includes('pan') || name.includes('desayuno')) return <Croissant size={40} />;
  if (name.includes('pizza') || name.includes('salado')) return <Pizza size={40} />;
  return <Coffee size={40} />;
};

export default function CustomerApp() {
  const navigate = useNavigate();
  const { locations, menu, categories, subcategories, customers, addCustomer, orders, setOrders, updateCustomerPoints, updateOrderStatus, menuStatus, registerOnlineSale } = useStore();

  // Estados de Navegación Interna
  // 'login' | 'dashboard' | 'scanner' | 'location_select' | 'menu' | 'checkout_method' | 'checkout_payment' | 'checkout_success'
  const [currentScreen, setCurrentScreen] = useState('login');

  // Auth
  const [loggedCustomer, setLoggedCustomer] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // Menú y Carrito
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout
  const [deliveryMethod, setDeliveryMethod] = useState(''); // 'delivery' | 'recojo'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'yape' | 'izipay' | 'cash'
  
  // Datos de Pago
  const [yapePhone, setYapePhone] = useState('');
  const [yapeOp, setYapeOp] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [receiptType, setReceiptType] = useState('boleta'); // 'boleta' | 'factura'
  const [docNum, setDocNum] = useState(''); // DNI or RUC
  const [razonSocial, setRazonSocial] = useState(''); 
  const [fiscalAddress, setFiscalAddress] = useState(''); 
  const [payingOrderId, setPayingOrderId] = useState(null); // ID del pedido aprobado a pagar

  // Item Modal (Mozo Style)
  const [pendingItem, setPendingItem] = useState(null);
  const [itemQty, setItemQty] = useState('1');
  const [itemDetails, setItemDetails] = useState('');

  // QR
  const [scanning, setScanning] = useState(false);
  const [scannedTable, setScannedTable] = useState('');

  // Auto-login al cargar
  useEffect(() => {
    const savedId = localStorage.getItem('customerId');
    if (savedId && customers) {
      const c = customers.find(x => x.id === savedId);
      if (c) {
        setLoggedCustomer(c);
        setCurrentScreen('dashboard');
      }
    }
  }, [customers]);

  // Mis pedidos actuales
  const myActiveOrders = useMemo(() => {
    if (!loggedCustomer || !orders) return [];
    return orders.filter(o => o.customerId === loggedCustomer.id && o.status !== 'completed' && o.status !== 'cancelled').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [orders, loggedCustomer]);

  // Auth Handlers
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!phone || !pin) return setAuthError('Por favor completa todos los campos.');

    if (authMode === 'login') {
      const existing = customers?.find(c => c.phone === phone && c.pin === pin);
      if (existing) {
        setLoggedCustomer(existing);
        localStorage.setItem('customerId', existing.id);
        setCurrentScreen('dashboard');
      } else {
        setAuthError('Celular o PIN incorrectos. Si no tienes cuenta, regístrate.');
      }
    } else {
      if (!name) return setAuthError('Por favor ingresa tu nombre.');
      if (customers?.find(c => c.phone === phone)) return setAuthError('Este número ya está registrado. Inicia sesión.');
      
      const newCustomer = { id: Date.now().toString(), name, phone, pin, points: 0, level: 'Bronce', totalSpent: 0 };
      addCustomer(newCustomer);
      setLoggedCustomer(newCustomer);
      localStorage.setItem('customerId', newCustomer.id);
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setLoggedCustomer(null);
    localStorage.removeItem('customerId');
    setCurrentScreen('login');
    setCart([]);
  };

  const handleSimulateScan = () => {
    if (!scannedTable) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      updateCustomerPoints(loggedCustomer.id, 10);
      showAlert(`¡Check-in exitoso en la Mesa ${scannedTable}! Has ganado 10 puntos.`);
      setScannedTable('');
      setCurrentScreen('dashboard');
    }, 1500);
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (item.active === false) return false;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCat === 'all' || item.categoryId === selectedCat;
      const matchesSubcat = selectedSubcat === 'all' || item.subcategoryId === selectedSubcat;
      return matchesSearch && matchesCat && matchesSubcat;
    });
  }, [menu, search, selectedCat, selectedSubcat]);

  const addToCart = (item) => {
    handleOpenItemModal(item);
  };

  const removeFromCart = (id, details = '') => {
    setCart(prev => {
      const ex = prev.find(i => i.item.id === id && (i.details || '') === details);
      if (!ex) return prev;
      if (ex.quantity > 1) {
        return prev.map(i => (i.item.id === id && (i.details || '') === details) ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => !(i.item.id === id && (i.details || '') === details));
    });
  };

  const handleOpenItemModal = (item) => {
    setPendingItem(item);
    setItemQty('');
    setItemDetails('');
  };

  const appendQty = (num) => {
    if (itemQty.length < 3) setItemQty(prev => prev + num);
  };
  
  const clearQty = () => setItemQty('');

  const confirmAddItem = () => {
    const qty = parseInt(itemQty) || 1;
    setCart(prev => {
       const ex = prev.find(i => i.item.id === pendingItem.id && i.details === itemDetails);
       if (ex) return prev.map(i => (i.item.id === pendingItem.id && i.details === itemDetails) ? { ...i, quantity: i.quantity + qty } : i);
       return [...prev, { item: pendingItem, quantity: qty, details: itemDetails }];
    });
    setPendingItem(null);
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  // === Flujo de Checkout ===
  const startCheckout = () => {
    setIsCartOpen(false);
    setCurrentScreen('checkout_method');
  };

  const handleDeliverySelect = (method) => {
    setDeliveryMethod(method);
    if (method === 'delivery') {
      // Pedir dirección luego enviar a caja como pending_approval
    } else {
      // Recojo: Pasar a elegir medio de pago
      setCurrentScreen('checkout_payment');
    }
  };

  const submitDeliveryOrder = (e) => {
    e.preventDefault();
    if (!deliveryAddress) return showAlert('Ingresa tu dirección');
    
    // Delivery sin pagar, va a caja para aprobación
    const newOrder = {
      id: Date.now().toString(),
      type: 'delivery',
      locationId: selectedLocation.id,
      items: cart,
      total: cartTotal,
      status: 'pending_approval',
      customerId: loggedCustomer.id,
      customerName: loggedCustomer.name,
      customerPhone: loggedCustomer.phone,
      address: deliveryAddress,
      timestamp: new Date().toISOString()
    };
    
    setOrders(prev => [...(prev || []), newOrder]);
    setCart([]);
    setCurrentScreen('checkout_success');
  };

  const submitPaidOrder = (e) => {
    if(e) e.preventDefault();
    
    if ((paymentMethod === 'yape' || paymentMethod === 'izipay') && receiptType === 'factura') {
      if (!docNum || !razonSocial || !fiscalAddress) {
        return showAlert('Para factura, por favor completa RUC, Razón Social y Dirección Fiscal.');
      }
    }

    // Construir metadata del pago
    const paymentData = {
      method: paymentMethod,
      yapePhone: paymentMethod === 'yape' ? yapePhone : null,
      yapeOp: paymentMethod === 'yape' ? yapeOp : null,
      cardNum: paymentMethod === 'izipay' ? cardNum.slice(-4) : null,
      receipt: paymentMethod !== 'cash' ? {
        type: receiptType,
        docNum,
        razonSocial,
        fiscalAddress
      } : null
    };

    const isPaid = paymentMethod === 'yape' || paymentMethod === 'izipay';
    
    const pointsGained = Math.floor(cartTotal * 0.5); 
    updateCustomerPoints(loggedCustomer.id, pointsGained, cartTotal);

    const newOrder = {
      id: Date.now().toString(),
      type: 'recojo',
      locationId: selectedLocation.id,
      items: cart,
      total: cartTotal,
      status: 'pending', // Va a preparación
      customerId: loggedCustomer.id,
      customerName: loggedCustomer.name,
      customerPhone: loggedCustomer.phone,
      paymentData,
      receiptEmitted: isPaid,
      timestamp: Date.now() // Changed to Date.now() for consistency
    };

    if (isPaid) {
      registerOnlineSale(newOrder);
    }
    
    setOrders(prev => [...(prev || []), newOrder]);
    setCart([]);
    setCurrentScreen('checkout_success');
  };

  // Pagar un delivery previamente aprobado
  const handlePayApprovedDelivery = (orderId, method) => {
    if ((method === 'yape' || method === 'izipay') && receiptType === 'factura') {
      if (!docNum || !razonSocial || !fiscalAddress) {
        return showAlert('Para factura, por favor completa RUC, Razón Social y Dirección Fiscal.');
      }
    }

    const orderToPay = orders.find(o => o.id === orderId);
    if (!orderToPay) return;

    const pointsGained = Math.floor(orderToPay.total * 0.5); 
    updateCustomerPoints(loggedCustomer.id, pointsGained, orderToPay.total);
    
    const isPaid = method === 'yape' || method === 'izipay';

    const paymentData = {
      method,
      yapePhone: method === 'yape' ? yapePhone : null,
      yapeOp: method === 'yape' ? yapeOp : null,
      cardNum: method === 'izipay' ? cardNum.slice(-4) : null,
      receipt: isPaid ? {
        type: receiptType,
        docNum,
        razonSocial,
        fiscalAddress
      } : null
    };

    const updatedOrder = {
      ...orderToPay,
      status: 'pending',
      paymentData,
      receiptEmitted: isPaid
    };

    if (isPaid) {
      registerOnlineSale(updatedOrder);
    }

    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

    setPayingOrderId(null);
    setCurrentScreen('checkout_success');
  };

  // ================= UI RENDERERS =================

  const renderLogin = () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', backgroundImage: 'var(--bg-gradient)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--primary-color), var(--warning-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: 'var(--glow-primary)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Star size={45} color="white" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.03em' }}>
          {authMode === 'login' ? 'Hola de nuevo' : 'Únete a nosotros'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Acumula puntos, obtén descuentos y vive la experiencia premium.
        </p>

        <div style={{ width: '100%', maxWidth: '380px', backgroundColor: 'var(--surface-color)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', backdropFilter: 'var(--glass-blur)' }}>
          {authError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(255,77,109,0.3)' }}>
              {authError}
            </div>
          )}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Tu Nombre Completo</label>
                <input type="text" className="input w-full" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.85rem 1rem', fontSize: '1rem' }} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Número de Celular</label>
              <input type="tel" className="input w-full" placeholder="Ej. 987654321" value={phone} onChange={e => setPhone(e.target.value)} maxLength={15} style={{ padding: '0.85rem 1rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>PIN de 6 dígitos</label>
              <input type="password" className="input w-full" placeholder="••••••" value={pin} onChange={e => setPin(e.target.value)} maxLength={6} style={{ padding: '0.85rem 1rem', fontSize: '1rem', letterSpacing: '0.2em' }} />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ padding: '1rem', marginTop: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: 'var(--shadow-md)' }}>
              {authMode === 'login' ? 'Iniciar Sesión' : 'Crear mi Cuenta VIP'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro VIP?'}
            </span>
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, marginLeft: '0.5rem', cursor: 'pointer' }}
            >
              {authMode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', backgroundImage: 'var(--bg-gradient)', paddingBottom: '2rem' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--surface-solid), transparent)', padding: '3rem 1.5rem 2rem', borderBottom: '1px solid var(--border-color)', position: 'relative', backdropFilter: 'blur(10px)' }}>
        <button onClick={handleLogout} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer' }}>
          <LogOut size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary-color), var(--warning-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', boxShadow: 'var(--glow-primary)' }}>
            {loggedCustomer.name.charAt(0)}
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>Bienvenido de nuevo,</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{loggedCustomer.name}</h2>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem', marginTop: '2rem' }}>
        {/* Loyalty Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', padding: '1.8rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', backdropFilter: 'var(--glass-blur-heavy)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.2rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nivel de Lealtad</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                {loggedCustomer.level} <Star size={24} color="var(--warning-color)" fill="var(--warning-color)" />
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.2rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tus Puntos</p>
              <h3 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--primary-color)', fontWeight: 800 }}>{loggedCustomer.points}</h3>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => setCurrentScreen('scanner')}
            style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--text-primary)' }}>
              <QrCode size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>Check-in en Mesa</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Escanea el QR de tu mesa y gana puntos</p>
            </div>
            <ArrowRight size={20} color="var(--text-secondary)" />
          </button>

          <button 
            onClick={() => setCurrentScreen('location_select')}
            style={{ background: 'linear-gradient(to right, var(--primary-color), var(--warning-color))', border: 'none', padding: '1.2rem', borderRadius: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-md)', transition: 'var(--transition)' }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', color: 'white' }}>
              <ShoppingCart size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>Hacer un Pedido</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Delivery o Recojo en tienda</p>
            </div>
            <ArrowRight size={20} color="white" />
          </button>
        </div>

        {/* Mis Pedidos Activos */}
        {myActiveOrders.length > 0 && (
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-color)"/> Mis Pedidos en Curso
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {myActiveOrders.map(o => (
                <div key={o.id} style={{ background: 'var(--surface-color)', padding: '1.2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{o.type === 'delivery' ? '🛵 Delivery' : '🏪 Recojo'}</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>S/ {o.total.toFixed(2)}</span>
                  </div>
                  {o.deliveryFee > 0 && (
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Incluye S/ {o.deliveryFee.toFixed(2)} de costo de envío
                    </p>
                  )}
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Estado: <span style={{ color: o.status === 'pending_approval' ? 'var(--warning-color)' : o.status === 'accepted_awaiting_payment' ? 'var(--info-color)' : 'var(--success-color)' }}>
                      {o.status === 'pending_approval' ? 'Esperando aprobación del local' : o.status === 'accepted_awaiting_payment' ? 'Aprobado, esperando tu pago' : o.status === 'pending' ? 'En preparación' : (o.type === 'delivery' ? '¡En camino!' : '¡Listo para recojo!')}
                    </span>
                  </p>
                  
                  {o.status === 'accepted_awaiting_payment' && (
                    <button 
                      onClick={() => {
                        setPayingOrderId(o.id);
                        setCurrentScreen('checkout_payment');
                      }}
                      className="btn btn-primary w-full" style={{ padding: '0.8rem', borderRadius: '0.5rem' }}
                    >
                      Realizar Pago Ahora
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationSelect = () => (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', backgroundImage: 'var(--bg-gradient)' }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setCurrentScreen('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Elige tu sucursal</h2>
      </div>
      
      <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        {locations.map(loc => {
          const now = new Date();
          const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          const openTime = loc.openTime || '08:00';
          const closeTime = loc.closeTime || '22:00';
          const isOpen = currentHour >= openTime && currentHour <= closeTime;
          
          return (
          <button 
            key={loc.id}
            onClick={() => {
              if (!isOpen) return;
              localStorage.setItem('currentLocationId', loc.id);
              setSelectedLocation(loc); 
              setCurrentScreen('menu'); 
            }}
            style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.2rem', textAlign: 'left', cursor: isOpen ? 'pointer' : 'not-allowed', transition: 'var(--transition)', opacity: isOpen ? 1 : 0.6 }}
            onMouseOver={e => { if (isOpen) e.currentTarget.style.borderColor = 'var(--primary-color)' }}
            onMouseOut={e => { if (isOpen) e.currentTarget.style.borderColor = 'var(--border-color)' }}
          >
            <div style={{ background: isOpen ? 'var(--primary-subtle)' : 'var(--surface-hover)', padding: '1rem', borderRadius: '50%', color: isOpen ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.3rem' }}>{loc.name}</h3>
              {isOpen ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: 600 }}>Abierto ahora ({openTime} - {closeTime})</p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: 600 }}>Cerrado (Horario: {openTime} - {closeTime})</p>
              )}
            </div>
          </button>
        )})}
      </div>
    </div>
  );

  // Detectar mobile para diseño responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderMenu = () => {
    const pointsToEarn = Math.floor(cartTotal * 0.5);
    
    return (
      <div className="animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
        <PageHeader
          icon={<MapPin />}
          iconGradient="135deg, var(--primary-color), var(--warning-color)"
          iconGlow="var(--primary-glow)"
          title={selectedLocation?.name || 'Local'}
          subtitle="Recibiendo pedidos"
          badge="Modo Cliente"
          badgeColor="var(--success-color)"
          actions={
            <div className="flex items-center gap-2">
              <button className="btn btn-outline" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }} onClick={() => setCurrentScreen('location_select')}>
                <ChevronLeft size={16} /> Volver
              </button>
              {isMobile && (
                <button onClick={() => setIsCartOpen(true)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', position: 'relative' }}>
                  <ShoppingCart size={16} />
                  {cart.length > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger-color)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-solid)' }}>
                      {cart.reduce((s,c)=>s+c.quantity,0)}
                    </span>
                  )}
                </button>
              )}
            </div>
          }
        />
        
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: isMobile ? '0.5rem' : '1.5rem' }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: '1.5rem', overflow: 'hidden' }}>
            
            {/* Lado Izquierdo: Menú */}
            <div style={{ 
              flex: isMobile ? undefined : 2, 
              width: isMobile ? '100%' : undefined, 
              minHeight: 0, 
              display: isMobile && isCartOpen ? 'none' : 'flex', 
              flexDirection: 'column', 
              overflowY: 'auto', 
              paddingRight: isMobile ? 0 : '0.5rem' 
            }}>
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input w-full" 
                  style={{ paddingLeft: '3rem', borderRadius: '99px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
                  placeholder="Buscar plato por nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-2" style={{ scrollbarWidth: 'none', maxWidth: '100vw' }}>
                <button 
                  onClick={() => { setSelectedCat('all'); setSelectedSubcat('all'); }}
                  className={`btn ${selectedCat === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >Todos</button>
                {categories.filter(c => c.active).map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => { setSelectedCat(cat.id); setSelectedSubcat('all'); }}
                    className={`btn ${selectedCat === cat.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >{cat.name}</button>
                ))}
              </div>
              
              {selectedCat !== 'all' && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4" style={{ scrollbarWidth: 'none', maxWidth: '100vw' }}>
                  <button 
                    onClick={() => setSelectedSubcat('all')}
                    className={`btn ${selectedSubcat === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ whiteSpace: 'nowrap', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                  >Todas</button>
                  {subcategories?.filter(s => s.categoryId === selectedCat && s.active !== false).map(sub => (
                    <button 
                      key={sub.id}
                      onClick={() => setSelectedSubcat(sub.id)}
                      className={`btn ${selectedSubcat === sub.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ whiteSpace: 'nowrap', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                    >{sub.name}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filteredMenu.map(item => {
                  const currentDay = new Date().getDay();
                  const availableToday = !item.availableDays || item.availableDays.length === 0 || item.availableDays.includes(currentDay);
                  const isAgotado = menuStatus && menuStatus[item.id] === false;
                  return (
                    <div key={item.id} className="card card-interactive flex justify-between items-center" style={{ gap: '0.5rem', padding: '1.2rem', opacity: (isAgotado || !availableToday) ? 0.6 : 1, filter: (isAgotado || !availableToday) ? 'grayscale(1)' : 'none' }} onClick={() => {
                      if (!availableToday) {
                        showAlert(`Este plato solo está disponible los días: ${item.availableDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}`);
                        return;
                      }
                      if (!isAgotado) {
                        handleOpenItemModal(item);
                      } else {
                        showAlert("Este plato se encuentra agotado actualmente.");
                      }
                    }}>
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, wordBreak: 'break-word' }}>{item.name}</h3>
                           {availableToday && isAgotado && <span style={{ background: 'var(--danger-color)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>AGOTADO</span>}
                        </div>
                        {item.description ? (
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{item.description}</p>
                        ) : (
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3, fontStyle: 'italic' }}>Sin detalles adicionales.</p>
                        )}
                        {!availableToday && <p style={{ fontSize: '0.75rem', color: 'var(--warning-color)', margin: '0 0 0.5rem', fontWeight: 700 }}>Solo disponible: {item.availableDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}</p>}
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '1rem' }}>S/ {item.price.toFixed(2)}</span>
                      </div>
                      <div style={{ backgroundColor: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isAgotado || !availableToday) ? 0.3 : 1 }}>
                        <Plus size={18} style={{ color: 'var(--primary-color)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lado Derecho: Carrito */}
            {(!isMobile || isCartOpen) && (
              <div className={!isMobile ? "card" : ""} style={{ 
                flex: isMobile ? undefined : 1, 
                width: isMobile ? '100%' : undefined, 
                background: isMobile ? 'var(--surface-solid)' : undefined, 
                display: 'flex', 
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                inset: isMobile ? 0 : 'auto',
                zIndex: isMobile ? 100 : 1,
                padding: isMobile ? 0 : '1.5rem',
                minHeight: 0
              }}>
                <div style={{ padding: isMobile ? '1.5rem' : '0 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isMobile && <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}><X size={24}/></button>}
                  <ShoppingCart size={24} color="var(--primary-color)" />
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tu Pedido</h2>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1.5rem' : '1.5rem 0' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                      <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Tu carrito está vacío.</p>
                    </div>
                  ) : cart.map(c => (
                    <div key={`${c.item.id}-${c.details}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <p style={{ margin: '0 0 0.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '0.3rem' }}>{c.quantity}x</span> 
                          {c.item.name}
                        </p>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>S/ {c.item.price.toFixed(2)} c/u</span>
                        {c.details && <p style={{ fontSize: '0.8rem', color: 'var(--warning-color)', fontStyle: 'italic', margin: '0.2rem 0 0' }}>Nota: {c.details}</p>}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>S/ {(c.item.price * c.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(c.item.id, c.details || '')} style={{ background: 'none', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  {cartTotal > 0 && (
                    <div style={{ background: 'rgba(16, 217, 144, 0.1)', border: '1px dashed var(--success-color)', padding: '0.8rem', borderRadius: '0.8rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Star size={18} color="var(--success-color)" />
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Con este pedido ganarás <strong style={{ color: 'var(--success-color)' }}>+{pointsToEarn} pts</strong></span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary-color)' }}>S/ {cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={startCheckout} 
                    disabled={cart.length === 0}
                    className="btn btn-primary w-full" 
                    style={{ padding: '1.2rem', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 800, background: cart.length === 0 ? 'var(--surface-color)' : 'linear-gradient(135deg, var(--primary-color), var(--warning-color))', opacity: cart.length === 0 ? 0.5 : 1 }}
                  >
                    Confirmar Pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón Flotante Mobile */}
        {isMobile && cart.length > 0 && !isCartOpen && (
          <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 50 }}>
            <button onClick={() => setIsCartOpen(true)} style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary-color), var(--warning-color))', border: 'none', padding: '1.2rem 1.5rem', borderRadius: '99px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: 'var(--glow-primary)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{cart.reduce((s, c) => s + c.quantity, 0)}</div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ver Carrito</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>S/ {cartTotal.toFixed(2)}</span>
            </button>
          </div>
        )}
        {/* Item Details & Numpad Modal (Mozo Style) */}
        {pendingItem && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-fade-in" style={{ width: '90vw', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="title" style={{ fontSize: '1.25rem' }}>{pendingItem.name}</h2>
                <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={(e) => { e.stopPropagation(); setPendingItem(null); }}><X size={16}/></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="subtitle" style={{ fontSize: '0.875rem' }}>Cantidad</label>
                  <div className="input mt-1 w-full text-center" style={{ fontSize: '2rem', padding: '1rem', fontWeight: 'bold' }}>
                    {itemQty || '1'}
                  </div>
                  
                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2 mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {['1','2','3','4','5','6','7','8','9','C','0'].map(num => (
                      <button 
                        key={num} 
                        type="button"
                        className="btn btn-outline justify-center" 
                        style={{ padding: '1rem', fontSize: '1.25rem', gridColumn: num === '0' ? 'span 2' : 'span 1', backgroundColor: num === 'C' ? 'var(--danger-bg)' : 'transparent', color: num === 'C' ? 'var(--danger-color)' : 'inherit', borderColor: num === 'C' ? 'var(--danger-color)' : 'var(--border-color)' }}
                        onClick={(e) => { e.stopPropagation(); num === 'C' ? clearQty() : appendQty(num); }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="subtitle" style={{ fontSize: '0.875rem' }}>Detalles / Notas (Opcional)</label>
                  <textarea 
                    className="input mt-1 w-full" 
                    style={{ resize: 'none', minHeight: isMobile ? '80px' : '150px' }}
                    placeholder="Ej. Sin cebolla, bien cocido..."
                    value={itemDetails}
                    onChange={e => setItemDetails(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <button className="btn btn-primary w-full justify-center mt-6" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={(e) => { e.stopPropagation(); confirmAddItem(); }}>
                Añadir al carrito (S/{(pendingItem.price * parseInt(itemQty || '1')).toFixed(2)})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckoutMethod = () => (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setCurrentScreen('menu')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}><ChevronLeft size={24}/></button>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Método de Entrega</h2>
      </div>
      <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <button onClick={() => handleDeliverySelect('recojo')} style={{ width: '100%', background: 'var(--surface-solid)', border: `2px solid ${deliveryMethod === 'recojo' ? 'var(--primary-color)' : 'var(--border-color)'}`, padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', transition: 'var(--transition)' }}>
          <div style={{ background: 'var(--primary-subtle)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}><MapPin size={24}/></div>
          <div><h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Recojo en Tienda</h3><p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pasa por tu pedido al local.</p></div>
        </button>
        <button onClick={() => handleDeliverySelect('delivery')} style={{ width: '100%', background: 'var(--surface-solid)', border: `2px solid ${deliveryMethod === 'delivery' ? 'var(--primary-color)' : 'var(--border-color)'}`, padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', transition: 'var(--transition)' }}>
          <div style={{ background: 'var(--info-bg)', padding: '1rem', borderRadius: '50%', color: 'var(--info-color)' }}><Star size={24}/></div>
          <div><h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Delivery</h3><p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Te lo llevamos a casa (Sujeto a aprobación).</p></div>
        </button>

        {deliveryMethod === 'delivery' && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Dirección de Envío</h4>
            <input type="text" className="input w-full" placeholder="Ej. Av. Larco 123, Miraflores" value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} style={{ padding: '1rem' }} />
            <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: 'var(--warning-color)' }}>* El pago de delivery se habilita una vez el local apruebe tu pedido y asigne el costo de envío.</p>
            <button onClick={submitDeliveryOrder} className="btn btn-primary w-full" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '1rem', fontWeight: 800 }}>Enviar Pedido a Revisión</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCheckoutPayment = () => {
    const orderToPay = payingOrderId ? orders.find(o => o.id === payingOrderId) : null;
    const amountToPay = orderToPay ? orderToPay.total : cartTotal;
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => {
            if (payingOrderId) {
              setPayingOrderId(null);
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('checkout_method');
            }
          }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}><ChevronLeft size={24}/></button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Medio de Pago</h2>
        </div>
        <div style={{ padding: '2rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Total a pagar: <span style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800, marginLeft: '0.5rem' }}>S/ {amountToPay.toFixed(2)}</span></h3>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setPaymentMethod('yape')} style={{ background: 'var(--surface-solid)', border: `2px solid ${paymentMethod === 'yape' ? '#742384' : 'var(--border-color)'}`, padding: '1.2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(116, 35, 132, 0.1)', padding: '0.8rem', borderRadius: '50%', color: '#742384' }}><Smartphone size={24}/></div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pago con Yape / Plin</span>
            </button>
            <button onClick={() => setPaymentMethod('izipay')} style={{ background: 'var(--surface-solid)', border: `2px solid ${paymentMethod === 'izipay' ? '#e2001a' : 'var(--border-color)'}`, padding: '1.2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(226, 0, 26, 0.1)', padding: '0.8rem', borderRadius: '50%', color: '#e2001a' }}><CreditCard size={24}/></div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tarjeta (IziPay)</span>
            </button>
            <button onClick={() => setPaymentMethod('cash')} style={{ background: 'var(--surface-solid)', border: `2px solid ${paymentMethod === 'cash' ? 'var(--success-color)' : 'var(--border-color)'}`, padding: '1.2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--success-subtle)', padding: '0.8rem', borderRadius: '50%', color: 'var(--success-color)' }}><Banknote size={24}/></div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pago Contra Entrega / Local</span>
            </button>
          </div>

          {(paymentMethod === 'yape' || paymentMethod === 'izipay') && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Tipo de Comprobante</h4>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <input type="radio" name="receiptType" value="boleta" checked={receiptType === 'boleta'} onChange={() => setReceiptType('boleta')} /> Boleta
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <input type="radio" name="receiptType" value="factura" checked={receiptType === 'factura'} onChange={() => setReceiptType('factura')} /> Factura
                </label>
              </div>
              <input type="text" placeholder={receiptType === 'boleta' ? "DNI (Opcional)" : "RUC (Requerido)"} value={docNum} onChange={e=>setDocNum(e.target.value)} className="input w-full mb-3" />
              {receiptType === 'factura' && (
                <>
                  <input type="text" placeholder="Razón Social" value={razonSocial} onChange={e=>setRazonSocial(e.target.value)} className="input w-full mb-3" />
                  <input type="text" placeholder="Dirección Fiscal" value={fiscalAddress} onChange={e=>setFiscalAddress(e.target.value)} className="input w-full" />
                </>
              )}
            </div>
          )}

          {paymentMethod === 'yape' && (
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #742384' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '150px', height: '150px', background: '#fff', padding: '0.5rem', borderRadius: '1rem', margin: '0 auto 1rem', display: 'inline-block' }}>
                  <QrCode size={134} color="#742384" />
                </div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Yapea a: 987 654 321</p>
              </div>
              <input type="tel" placeholder="Tu celular (con el que yapeaste)" value={yapePhone} onChange={e=>setYapePhone(e.target.value)} className="input w-full mb-3" />
              <input type="text" placeholder="N° de Operación o Aprobación" value={yapeOp} onChange={e=>setYapeOp(e.target.value)} className="input w-full mb-4" />
              <button onClick={() => payingOrderId ? handlePayApprovedDelivery(payingOrderId, 'yape') : submitPaidOrder()} className="btn w-full" style={{ background: '#742384', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: 800 }}>Confirmar Pago Yape</button>
            </div>
          )}

          {paymentMethod === 'izipay' && (
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2001a' }}>
              <h4 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Datos de Tarjeta</h4>
              <input type="text" placeholder="Número de Tarjeta" value={cardNum} onChange={e=>setCardNum(e.target.value)} className="input w-full mb-3" />
              <input type="text" placeholder="Nombre en la Tarjeta" value={cardName} onChange={e=>setCardName(e.target.value)} className="input w-full mb-3" />
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="MM/YY" value={cardExp} onChange={e=>setCardExp(e.target.value)} className="input w-full" />
                <input type="text" placeholder="CVV" value={cardCvv} onChange={e=>setCardCvv(e.target.value)} className="input w-full" />
              </div>
              <button onClick={() => payingOrderId ? handlePayApprovedDelivery(payingOrderId, 'izipay') : submitPaidOrder()} className="btn w-full" style={{ background: '#e2001a', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: 800 }}>Pagar S/ {amountToPay.toFixed(2)}</button>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <button onClick={() => payingOrderId ? handlePayApprovedDelivery(payingOrderId, 'cash') : submitPaidOrder()} className="btn btn-primary w-full" style={{ padding: '1.2rem', borderRadius: '1rem', fontWeight: 800 }}>Confirmar (Pago Contra Entrega / En el local)</button>
          )}
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: 'var(--glow-success)' }}>
        <Check size={45} color="white" />
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.1 }}>¡Pedido Exitoso!</h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        {deliveryMethod === 'delivery' 
          ? 'Tu pedido ha sido enviado al local. Te avisaremos cuando lo aprueben para que realices el pago.'
          : 'Tu pedido está confirmado y pagado. ¡Pasa por el local a recogerlo!'}
      </p>
      <button onClick={() => setCurrentScreen('dashboard')} className="btn btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '99px', fontSize: '1.1rem', fontWeight: 800 }}>
        Ir al Dashboard
      </button>
    </div>
  );

  switch (currentScreen) {
    case 'login': return renderLogin();
    case 'dashboard': return renderDashboard();
    case 'scanner': return renderScanner();
    case 'location_select': return renderLocationSelect();
    case 'menu': return renderMenu();
    case 'checkout_method': return renderCheckoutMethod();
    case 'checkout_payment': return renderCheckoutPayment();
    case 'checkout_success': return renderSuccess();
    default: return renderLogin();
  }
}
