import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [loading, setLoading] = React.useState(true);
  const lastSaveTime = React.useRef(0);

  const [currentUser, setCurrentUser] = React.useState(null);
  const [locations, setLocations] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [subcategories, setSubcategories] = React.useState([]);
  const [catalogs, setCatalogs] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [isBarActive, setIsBarActive] = React.useState(true);
  const [businessDay, setBusinessDay] = React.useState({ isOpen: false, startTime: null, totalSales: 0, voids: [], sales: [], cajaDetails: { isOpen: false, fondoInicial: 0, efectivoDeclarado: 0, diferencia: 0, justificacion: '', status: 'closed' } });
  const [pastDays, setPastDays] = React.useState([]);
  const [activeTables, setActiveTables] = React.useState({});
  const [tableHeadcounts, setTableHeadcounts] = React.useState({});
  const [companies, setCompanies] = React.useState([]);
  const [menuStatus, setMenuStatus] = React.useState({});
  const [tableFamilies, setTableFamilies] = React.useState({});
  const defaultDevSettings = {
    isSuperAdminIncognito: false,
    metricsOnlySuperAdmin: false,
    billingMode: 'test',
    billingToken: '',
    printServerUrl: 'https://print-server-production-xxxx.onrender.com',
    printerIds: {}, // Format: { locationId: { caja: '', barra: '', cocina: '' } }
    adminModules: { metrics: true, caja: true, users: true, crm: true, categories: true, subcategories: true, menu: true, kardex_config: true, zones: true, empresas: true, auditoria: true, locales: true }
  };
  const [developerSettings, setDeveloperSettings] = React.useState(defaultDevSettings);
  const [kardexItems, setKardexItems] = React.useState([]);
  const [customers, setCustomers] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const resGlobal = await fetch('/api/store/global');
        const dataGlobal = await resGlobal.json();
        
        let loadedLocations = dataGlobal.locations || [];
        let loadedSuperadmins = dataGlobal.users || [];

        // Fallback si no hay currentLocationId
        if (!localStorage.getItem('currentLocationId') && loadedLocations.length > 0) {
          localStorage.setItem('currentLocationId', loadedLocations[0].id);
        }

        setLocations(loadedLocations);
        if (dataGlobal.categories) setCategories(dataGlobal.categories);
        if (dataGlobal.subcategories) setSubcategories(dataGlobal.subcategories);
        
        // Load catalogs, or migrate existing menu to catalogs
        if (dataGlobal.catalogs && dataGlobal.catalogs.length > 0) {
          setCatalogs(dataGlobal.catalogs);
        } else if (dataGlobal.menu && dataGlobal.menu.length > 0) {
          setCatalogs([{ id: 'default', name: 'Lista Principal', active: true, items: dataGlobal.menu }]);
        } else {
          setCatalogs([{ id: 'default', name: 'Lista Principal', active: true, items: [] }]);
        }
        if (dataGlobal.developerSettings) {
          // Merge fetched settings with defaults to ensure new keys exist
          const mergedAdminModules = { ...defaultDevSettings.adminModules, ...(dataGlobal.developerSettings.adminModules || {}) };
          
          // Migración de IPs antiguas a IDs si es necesario, o mantener printerIds
          let mergedPrinterIds = dataGlobal.developerSettings.printerIds || {};
          // Si existía printerIPs pero no printerIds, lo convertimos al primer local o lo ignoramos
          if (dataGlobal.developerSettings.printerIPs && Object.keys(mergedPrinterIds).length === 0 && loadedLocations.length > 0) {
            mergedPrinterIds[loadedLocations[0].id] = dataGlobal.developerSettings.printerIPs;
          }

          setDeveloperSettings({ ...defaultDevSettings, ...dataGlobal.developerSettings, adminModules: mergedAdminModules, printerIds: mergedPrinterIds });
        }
        if (dataGlobal.kardexItems) setKardexItems(dataGlobal.kardexItems);
        if (dataGlobal.customers) setCustomers(dataGlobal.customers);

        const currentLocId = localStorage.getItem('currentLocationId');
        let localUsers = [];

        if (currentLocId) {
          const resLocal = await fetch(`/api/store/local/${currentLocId}`);
          if (resLocal.ok) {
             const dataLocal = await resLocal.json();
             localUsers = dataLocal.users || [];
             setZones(dataLocal.zones || []);
             setOrders(dataLocal.orders || []);
             setIsBarActive(dataLocal.isBarActive !== undefined ? dataLocal.isBarActive : true);
             setBusinessDay(dataLocal.businessDay || { isOpen: false, startTime: null, totalSales: 0, voids: [], sales: [], cajaDetails: { isOpen: false, fondoInicial: 0, efectivoDeclarado: 0, diferencia: 0, justificacion: '', status: 'closed' } });
             setPastDays(dataLocal.pastDays || []);
             setActiveTables(dataLocal.activeTables || {});
             setTableHeadcounts(dataLocal.tableHeadcounts || {});
             setCompanies(dataLocal.companies || []);
             setMenuStatus(dataLocal.menuStatus || {});
             setTableFamilies(dataLocal.tableFamilies || {});
          } else {
             setZones([]); setOrders([]); setBusinessDay({ isOpen: false, startTime: null, totalSales: 0, voids: [], sales: [] }); setPastDays([]); setActiveTables({}); setCompanies({}); setMenuStatus({}); setTableFamilies({});
          }
        }
        
        setUsers([...loadedSuperadmins, ...localUsers]);
        
        // Restore currentUser from memory if it matches
        const savedUserStr = localStorage.getItem('currentUserData');
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          const found = [...loadedSuperadmins, ...localUsers].find(x => x.id === u.id);
          if (found) setCurrentUser(found);
        }

      } catch (e) {
        console.error('Error loading data from API:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Polling for Real-time Menu Updates
  React.useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      try {
        if (Date.now() - lastSaveTime.current < 2500) return;
        const resGlobal = await fetch(`/api/store/global?t=${Date.now()}`, { cache: 'no-store' });
        if (resGlobal.ok) {
          const dataGlobal = await resGlobal.json();
          if (dataGlobal.categories) setCategories(prev => JSON.stringify(prev) !== JSON.stringify(dataGlobal.categories) ? dataGlobal.categories : prev);
          if (dataGlobal.subcategories) setSubcategories(prev => JSON.stringify(prev) !== JSON.stringify(dataGlobal.subcategories) ? dataGlobal.subcategories : prev);
          if (dataGlobal.catalogs) setCatalogs(prev => JSON.stringify(prev) !== JSON.stringify(dataGlobal.catalogs) ? dataGlobal.catalogs : prev);
        }
        
        const locId = localStorage.getItem('currentLocationId');
        if (locId) {
          const resLocal = await fetch(`/api/store/local/${locId}?t=${Date.now()}`, { cache: 'no-store' });
          if (resLocal.ok) {
            const dataLocal = await resLocal.json();
            if (dataLocal.menuStatus) setMenuStatus(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.menuStatus) ? dataLocal.menuStatus : prev);
            if (dataLocal.orders) setOrders(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.orders) ? dataLocal.orders : prev);
            if (dataLocal.businessDay) setBusinessDay(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.businessDay) ? dataLocal.businessDay : prev);
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 1000);
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          if (Date.now() - lastSaveTime.current < 2500) return;
          const locId = localStorage.getItem('currentLocationId');
          if (locId) {
            const resLocal = await fetch(`/api/store/local/${locId}?t=${Date.now()}`, { cache: 'no-store' });
            if (resLocal.ok) {
              const dataLocal = await resLocal.json();
              if (dataLocal.menuStatus) setMenuStatus(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.menuStatus) ? dataLocal.menuStatus : prev);
              if (dataLocal.orders) setOrders(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.orders) ? dataLocal.orders : prev);
              if (dataLocal.businessDay) setBusinessDay(prev => JSON.stringify(prev) !== JSON.stringify(dataLocal.businessDay) ? dataLocal.businessDay : prev);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading]);

  const saveState = async (key, value, isGlobal = false) => {
    try {
      lastSaveTime.current = Date.now();
      const locId = localStorage.getItem('currentLocationId') || 'default';
      const endpoint = isGlobal ? `/api/store/global/${key}` : `/api/store/local/${locId}/${key}`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
    } catch (e) {
      console.error(`Error saving ${key} to API:`, e);
    }
  };

  React.useEffect(() => { if (!loading && currentUser) saveState('currentUser', currentUser, true); }, [currentUser, loading]);
  React.useEffect(() => { if (!loading && locations.length > 0) saveState('locations', locations, true); }, [locations, loading]);
  React.useEffect(() => { if (!loading && kardexItems.length > 0) saveState('kardexItems', kardexItems, true); }, [kardexItems, loading]);
  React.useEffect(() => { if (!loading && customers.length > 0) saveState('customers', customers, true); }, [customers, loading]);
  
  // Custom user saving to split superadmins and locals
  React.useEffect(() => { 
    if (!loading && users.length > 0) {
      const superadmins = users.filter(u => u.role === 'superadmin');
      const localUsers = users.filter(u => u.role !== 'superadmin');
      if (superadmins.length > 0) saveState('users', superadmins, true);
      saveState('users', localUsers, false);
    } 
  }, [users, loading]);
  React.useEffect(() => { if (!loading && categories.length > 0) saveState('categories', categories, true); }, [categories, loading]);
  React.useEffect(() => { if (!loading && subcategories.length > 0) saveState('subcategories', subcategories, true); }, [subcategories, loading]);
  React.useEffect(() => { if (!loading && developerSettings) saveState('developerSettings', developerSettings, true); }, [developerSettings, loading]);
  React.useEffect(() => { if (!loading && catalogs.length > 0) saveState('catalogs', catalogs, true); }, [catalogs, loading]);
  
  React.useEffect(() => { if (!loading && zones.length > 0) saveState('zones', zones); }, [zones, loading]);
  React.useEffect(() => { if (!loading) saveState('orders', orders); }, [orders, loading]);
  React.useEffect(() => { if (!loading) saveState('isBarActive', isBarActive); }, [isBarActive, loading]);
  React.useEffect(() => { if (!loading) saveState('businessDay', businessDay); }, [businessDay, loading]);
  React.useEffect(() => { if (!loading) saveState('pastDays', pastDays); }, [pastDays, loading]);
  React.useEffect(() => { if (!loading) saveState('activeTables', activeTables); }, [activeTables, loading]);
  React.useEffect(() => { if (!loading) saveState('tableHeadcounts', tableHeadcounts); }, [tableHeadcounts, loading]);
  React.useEffect(() => { if (!loading) saveState('companies', companies); }, [companies, loading]);
  React.useEffect(() => { if (!loading) saveState('tableFamilies', tableFamilies); }, [tableFamilies, loading]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: 'white' }}>Cargando sistema...</div>;
  }
  const logAudit = async (action, details = {}) => {
    try {
      // Intenta usar el currentUser del estado, o el del localStorage, o un default
      let user = currentUser;
      if (!user) {
        const stored = localStorage.getItem('currentUserData');
        if (stored) user = JSON.parse(stored);
      }
      
      const logData = {
        action,
        user: user ? user.username : 'Sistema',
        role: user ? user.role : 'system',
        details,
        locationId: localStorage.getItem('currentLocationId') || 'global'
      };
      
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (e) {
      console.error('Failed to log audit event', e);
    }
  };

  const login = (username, password, locId) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (!user.active) return { success: false, error: 'Usuario desactivado' };
      if (user.role !== 'superadmin' && user.locationId !== locId) {
         return { success: false, error: 'Usuario no pertenece a esta sucursal' };
      }
      
      const currentLoc = localStorage.getItem('currentLocationId');
      localStorage.setItem('currentLocationId', locId);
      localStorage.setItem('currentUserData', JSON.stringify(user));
      
      // We set currentUser manually to ensure logAudit captures it if state hasn't updated yet, 
      // but logAudit reads from localStorage as fallback anyway.
      logAudit('LOGIN', { location: locId });

      if (currentLoc !== locId) {
        return { success: true, user, needsReload: true };
      } else {
        setCurrentUser(user);
        return { success: true, user, needsReload: false };
      }
    }
    return { success: false, error: 'Credenciales inválidas' };
  };

  const logout = () => { 
    if (currentUser) { 
      logAudit('LOGOUT', {});
      localStorage.setItem('lastRole', currentUser.role); 
    } 
    setCurrentUser(null); 
    localStorage.removeItem('currentUserData'); 
  };

  // V3 Actions: Day
  const openDay = () => setBusinessDay({ id: uuidv4(), isOpen: true, startTime: Date.now(), totalSales: 0, voids: [], sales: [], incomes: [], expenses: [], cajaDetails: { isOpen: false, fondoInicial: 0, efectivoDeclarado: 0, diferencia: 0, justificacion: '', status: 'closed' } });

  const openCaja = (fondoInicial, aperturaDiferencia = 0, aperturaJustificacion = '') => {
    setBusinessDay(prev => ({
      ...prev,
      cajaDetails: {
        ...(prev.cajaDetails || {}),
        isOpen: true,
        fondoInicial: parseFloat(fondoInicial) || 0,
        aperturaDiferencia,
        aperturaJustificacion,
        openTime: Date.now(),
        status: 'open'
      }
    }));
  };

  const closeCaja = (efectivoDeclarado, justificacion, diferencia) => {
    setBusinessDay(prev => ({
      ...prev,
      cajaDetails: {
        ...(prev.cajaDetails || {}),
        isOpen: false,
        efectivoDeclarado: parseFloat(efectivoDeclarado) || 0,
        diferencia: parseFloat(diferencia) || 0,
        justificacion: justificacion || '',
        closeTime: Date.now(),
        status: 'counted'
      }
    }));
  };
  const updateKardexData = (kardexId, data) => {
    setBusinessDay(prev => {
      const nextKardex = { ...(prev.kardex || {}) };
      if (!nextKardex[kardexId]) {
        nextKardex[kardexId] = { inicial: 0, ingresos: 0, mermas: 0, observacion: '', ventas: 0 };
      }
      nextKardex[kardexId] = { ...nextKardex[kardexId], ...data };
      return { ...prev, kardex: nextKardex };
    });
  };

  const closeDay = (closeDetails) => {
    setPastDays(prev => [{ ...businessDay, endTime: Date.now() }, ...prev]);
    setBusinessDay(prev => ({ isOpen: false, lastClosedTotal: prev.totalSales, sales: [], voids: [], incomes: [], expenses: [] }));
  };

  // V3 Actions: Tables
  const updateTableCart = (tableKey, cart) => {
    setActiveTables(prev => ({ ...prev, [tableKey]: cart }));
  };

  const sendTableOrders = (tableKey, cart, zoneName, tableNum, waiterName) => {
    // 1. Mark items as sent in the table's persistent account
    const newCart = cart.map(c => ({ ...c, status: 'sent' }));
    setActiveTables(prev => ({ ...prev, [tableKey]: newCart }));

    // 2. Dispatch to Cocina/Bar tickets (orders array)
    const itemsToSend = cart.filter(c => c.status === 'new');
    if (itemsToSend.length === 0) return;

    const cocinaCart = [];
    const barCart = [];
    
    itemsToSend.forEach(c => {
      const category = categories.find(cat => cat.id === c.item.categoryId);
      const station = category?.station || 'cocina';
      if (isBarActive && station === 'bar') barCart.push(c);
      else cocinaCart.push(c);
    });

if (cocinaCart.length > 0) {
      setOrders(prev => {
        const existingIdx = prev.findIndex(o => o.zone === zoneName && o.table === tableNum && (!o.station || o.station === 'cocina') && o.status !== 'ready');
        if (existingIdx >= 0) {
          const newOrders = [...prev];
          newOrders[existingIdx] = {
            ...newOrders[existingIdx],
            items: [...newOrders[existingIdx].items, ...cocinaCart],
            status: 'pending' // reset status to pending in case it was preparing
          };
          return newOrders;
        }
        return [...prev, {
          id: uuidv4(), zone: zoneName, table: tableNum, waiter: waiterName, items: cocinaCart, station: 'cocina', status: 'pending', timestamp: Date.now()
        }];
      });
    }

if (barCart.length > 0) {
      setOrders(prev => {
        const existingIdx = prev.findIndex(o => o.zone === zoneName && o.table === tableNum && o.station === 'bar' && o.status !== 'ready');
        if (existingIdx >= 0) {
          const newOrders = [...prev];
          newOrders[existingIdx] = {
            ...newOrders[existingIdx],
            items: [...newOrders[existingIdx].items, ...barCart],
            status: 'pending'
          };
          return newOrders;
        }
        return [...prev, {
          id: uuidv4(), zone: zoneName, table: tableNum, waiter: waiterName, items: barCart, station: 'bar', status: 'pending', timestamp: Date.now()
        }];
      });
    }
  };

  const voidTableItem = (tableKey, itemId, reason, adminUser) => {
    setActiveTables(prev => {
      const cart = prev[tableKey] || [];
      const itemToVoid = cart.find(c => c.id === itemId);
      
      // Log the void
      if (itemToVoid) {
        logAudit('ANULACION_ITEM', { item: itemToVoid.item.name, quantity: itemToVoid.quantity, reason, table: tableKey, admin: adminUser.name });
        setBusinessDay(day => ({
          ...day,
          voids: [...(day.voids || []), { 
            item: itemToVoid.item.name, quantity: itemToVoid.quantity, reason, admin: adminUser.name, timestamp: Date.now(), tableKey
          }]
        }));
      }
      
      return { ...prev, [tableKey]: cart.filter(c => c.id !== itemId) };
    });
  };

  const payTable = (tableKey, amount, cartDetails, waiter, zoneName, tableNum, billingInfo = {}) => {
    logAudit('COBRO_MESA', { table: tableKey, amount, waiter });
    const headcount = tableHeadcounts[tableKey] || 1;
    setBusinessDay(prev => {
      const nextKardex = { ...(prev.kardex || {}) };
      
      cartDetails.forEach(c => {
        if (c.item.kardexRecipe && Array.isArray(c.item.kardexRecipe)) {
          c.item.kardexRecipe.forEach(recipeItem => {
            const deduction = c.quantity * (parseFloat(recipeItem.qty) || 1);
            if (!nextKardex[recipeItem.kardexId]) {
              nextKardex[recipeItem.kardexId] = { inicial: 0, ingresos: 0, mermas: 0, observacion: '', ventas: 0 };
            }
            nextKardex[recipeItem.kardexId].ventas = (nextKardex[recipeItem.kardexId].ventas || 0) + deduction;
          });
        }
      });

      return { 
        ...prev, 
        totalSales: prev.totalSales + amount,
        kardex: nextKardex,
        sales: [...(prev.sales || []), {
          id: uuidv4(), tableKey, waiter, zone: zoneName, table: tableNum, total: amount, timestamp: Date.now(),
          headcount,
          items: cartDetails.map(c => ({ item: c.item.name, quantity: c.quantity, price: c.item.price })),
          cartItems: cartDetails,
          ...billingInfo
        }]
      };
    });
    // Auto-increment document number on the company
    if (billingInfo.companyId && billingInfo.documentType) {
      setCompanies(prev => prev.map(c => {
        if (c.id !== billingInfo.companyId) return c;
        return billingInfo.documentType === 'boleta'
          ? { ...c, boletaNumber: (c.boletaNumber || 0) + 1 }
          : { ...c, facturaNumber: (c.facturaNumber || 0) + 1 };
      }));
    }
    setActiveTables(prev => {
      const next = { ...prev };
      const currentCart = next[tableKey] || [];
      
      const paidQuantities = {};
      cartDetails.forEach(c => { paidQuantities[c.id] = (paidQuantities[c.id] || 0) + c.quantity; });
      
      const remainingCart = currentCart.map(c => {
        if (paidQuantities[c.id]) {
          return { ...c, quantity: Math.max(0, c.quantity - paidQuantities[c.id]) };
        }
        return c;
      }).filter(c => c.quantity > 0.001); // Handle small floating point remaining
      
      if (remainingCart.length === 0) {
        delete next[tableKey];
        setTableHeadcounts(th => { const n = { ...th }; delete n[tableKey]; return n; });
        setTableFamilies(tf => { const n = { ...tf }; delete n[tableKey]; return n; });
      } else {
        next[tableKey] = remainingCart;
      }
      return next;
    });
  };

  const closeTable = (tableKey) => {
    setActiveTables(prev => {
      const next = { ...prev };
      delete next[tableKey];
      return next;
    });

    setTableHeadcounts(prev => {
      const next = { ...prev };
      delete next[tableKey];
      return next;
    });

    setTableFamilies(prev => {
      const next = { ...prev };
      delete next[tableKey];
      return next;
    });
  };

  const voidSaleAndReopenTable = async (saleId, reason, adminUser, targetTableKey = null) => {
    const saleToVoid = (businessDay.sales || []).find(s => s.id === saleId);
    if (!saleToVoid) return { success: false, error: 'Venta no encontrada.' };
    
    const finalTableKey = targetTableKey || saleToVoid.tableKey;

    const currentCart = activeTables[finalTableKey] || [];
    if (currentCart.length > 0) {
      return { success: false, error: `No se puede reabrir la cuenta porque la mesa seleccionada está ocupada actualmente. Transfiera la mesa actual a otra primero.` };
    }
    
    // Llamar a SUNAT si es Boleta o Factura
    let sunatTicket = null;
    if (saleToVoid.documentType === 'boleta' || saleToVoid.documentType === 'factura') {
      try {
        const apiUrl = developerSettings?.printServerUrl || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/anular`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: saleToVoid.id,
            documentType: saleToVoid.documentType,
            documentNumber: saleToVoid.documentNumber,
            total: saleToVoid.total,
            reason: reason,
            customerRuc: saleToVoid.companyRuc || saleToVoid.customerRuc,
            customerName: saleToVoid.companyName || saleToVoid.customerName,
            date: new Date().toISOString()
          })
        });
        
        if (!res.ok) {
           console.warn("API de anulación SUNAT falló, pero continuaremos internamente.");
        } else {
           const data = await res.json();
           if (data.ticket) sunatTicket = data.ticket;
        }
      } catch (err) {
         console.warn("No se pudo conectar a la API de anulación SUNAT.", err);
      }
    }

    logAudit('ANULACION_VENTA', { saleId, reason, admin: adminUser.name, amount: saleToVoid.total, sunatTicket });
    setBusinessDay(prev => {
      const nextKardex = { ...(prev.kardex || {}) };
      
      (saleToVoid.cartItems || []).forEach(c => {
        if (c.item.kardexRecipe && Array.isArray(c.item.kardexRecipe)) {
          c.item.kardexRecipe.forEach(recipeItem => {
            const deduction = c.quantity * (parseFloat(recipeItem.qty) || 1);
            if (nextKardex[recipeItem.kardexId]) {
              nextKardex[recipeItem.kardexId].ventas = Math.max(0, (nextKardex[recipeItem.kardexId].ventas || 0) - deduction);
            }
          });
        }
      });

      return {
        ...prev,
        totalSales: prev.totalSales - saleToVoid.total,
        kardex: nextKardex,
        sales: prev.sales.filter(s => s.id !== saleId),
        voids: [...(prev.voids || []), {
          item: `Comprobante ${saleToVoid.documentType === 'boleta' ? 'B' : saleToVoid.documentType === 'factura' ? 'F' : 'P'}-${saleToVoid.documentNumber}`,
          quantity: 1,
          reason: reason || 'Anulación de Venta',
          admin: adminUser.name,
          timestamp: Date.now(),
          tableKey: saleToVoid.tableKey,
          amount: saleToVoid.total,
          sunatTicket
        }]
      };
    });

    setActiveTables(prev => {
      const next = { ...prev };
      const currentCart = next[finalTableKey] || [];
      
      // Regenerate unique IDs for cart items to avoid conflicts and force status to 'sent'
      const restoredCartItems = (saleToVoid.cartItems || []).map(c => ({
        ...c,
        id: uuidv4(),
        status: 'sent',
        isRecovered: true
      }));

      next[finalTableKey] = [...currentCart, ...restoredCartItems];
      return next;
    });
    
    // Also ensure headcount is restored if table was completely closed
    setTableHeadcounts(prev => {
      if (!prev[finalTableKey]) {
        return { ...prev, [finalTableKey]: saleToVoid.headcount || 1 };
      }
      return prev;
    });

    return { success: true };
  };

  const issueCreditNote = async (saleId, refundAmount, itemsToRefund, reason, adminUser, refacturar = false, targetTableKey = null) => {
    let sale = null;
    let isHistorical = false;
    let pastDayIndex = -1;

    if (businessDay && businessDay.sales) {
      sale = businessDay.sales.find(s => s.id === saleId);
    }

    if (!sale && pastDays) {
      for (let i = 0; i < pastDays.length; i++) {
        const found = (pastDays[i].sales || []).find(s => s.id === saleId);
        if (found) {
          sale = found;
          isHistorical = true;
          pastDayIndex = i;
          break;
        }
      }
    }

    if (!sale) return { success: false, error: 'Venta no encontrada.' };

    let sunatTicket = null;
    if (sale.documentType === 'boleta' || sale.documentType === 'factura') {
      try {
        const apiUrl = developerSettings?.printServerUrl || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/nota-credito`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            documentType: sale.documentType,
            documentNumber: sale.documentNumber,
            refundAmount,
            itemsToRefund,
            reason,
            date: new Date().toISOString()
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ticket) sunatTicket = data.ticket;
        }
      } catch (err) {
        console.warn("No se pudo conectar a la API SUNAT para Nota de Crédito.", err);
      }
    }

    const creditNoteData = {
      id: uuidv4(),
      date: Date.now(),
      amount: refundAmount,
      reason,
      admin: adminUser.name,
      items: itemsToRefund,
      sunatTicket
    };

    logAudit('NOTA_CREDITO', { saleId, reason, admin: adminUser.name, amount: refundAmount, sunatTicket, isHistorical });

    if (!isHistorical) {
      setBusinessDay(prev => ({
        ...prev,
        totalSales: prev.totalSales - refundAmount,
        sales: prev.sales.map(s => s.id === saleId ? {
          ...s,
          hasCreditNote: true,
          creditNotes: [...(s.creditNotes || []), creditNoteData]
        } : s)
      }));
    } else {
      setBusinessDay(prev => ({
        ...prev,
        totalSales: prev.totalSales - refundAmount
      }));
      setPastDays(prev => {
        const newPast = [...prev];
        newPast[pastDayIndex] = {
          ...newPast[pastDayIndex],
          sales: newPast[pastDayIndex].sales.map(s => s.id === saleId ? {
            ...s,
            hasCreditNote: true,
            creditNotes: [...(s.creditNotes || []), creditNoteData]
          } : s)
        };
        return newPast;
      });
    }

    if (refacturar) {
      const finalTableKey = targetTableKey || sale.tableKey;
      setActiveTables(prev => {
        const next = { ...prev };
        const currentCart = next[finalTableKey] || [];
        const restoredCartItems = itemsToRefund.map(c => ({
          ...c,
          id: uuidv4(),
          status: 'sent',
          isRecovered: true
        }));
        next[finalTableKey] = [...currentCart, ...restoredCartItems];
        return next;
      });
    }

    return { success: true, ticket: sunatTicket, sale };
  };

  const updateOrderStatus = (orderId, newStatus) => setOrders(prev => prev.map(o => 
    o.id === orderId ? { ...o, status: newStatus, completedAt: newStatus === 'ready' ? Date.now() : o.completedAt } : o
  ));

  const registerOnlineSale = (order) => {
    setBusinessDay(prev => ({
      ...prev,
      totalSales: (prev.totalSales || 0) + order.total,
      sales: [...(prev.sales || []), {
        id: uuidv4(),
        tableKey: `online-${order.id}`,
        waiter: 'App Cliente',
        zone: order.type === 'delivery' ? 'Delivery' : 'Recojo',
        table: 'App',
        total: order.total,
        timestamp: Date.now(),
        headcount: 1,
        items: order.items.map(c => ({ item: c.item.name, quantity: c.quantity, price: c.item.price })),
        cartItems: order.items,
        documentType: order.paymentData?.receipt?.type || 'boleta',
        documentNumber: order.paymentData?.receipt?.docNum || '000000',
        companyId: '',
        companyName: 'Venta Online',
        companyRuc: '',
        customerDni: order.paymentData?.receipt?.docNum || '',
        customerRuc: order.paymentData?.receipt?.docNum || '',
        customerName: order.paymentData?.receipt?.razonSocial || order.customerName,
        customerAddress: order.address || order.paymentData?.receipt?.fiscalAddress || '',
        paymentMethod: order.paymentData?.method || 'online'
      }]
    }));
  };

  const addIncome = (amount, category, details, paymentMethod) => {
    setBusinessDay(prev => ({
      ...prev,
      incomes: [...(prev.incomes || []), { id: uuidv4(), amount, category, details, paymentMethod, timestamp: Date.now() }]
    }));
  };

  const addExpense = (amount, category, details, paymentMethod) => {
    setBusinessDay(prev => ({
      ...prev,
      expenses: [...(prev.expenses || []), { id: uuidv4(), amount, category, details, paymentMethod, timestamp: Date.now() }]
    }));
  };

  const dispatchOrderItems = (orderId, itemIds) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = o.items.map(i => itemIds.includes(i.id) ? { ...i, status: 'ready' } : i);
      const allReady = newItems.every(i => i.status === 'ready');
      return { ...o, items: newItems, status: allReady ? 'ready' : o.status };
    }));
  };

  const updateOrderItemStatus = (orderId, itemId, newStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = o.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
      const allReady = newItems.every(i => i.status === 'ready');
      return { ...o, items: newItems, status: allReady ? 'ready' : o.status };
    }));
  };

  const updateCustomerPoints = (customerId, pointsToAdd, totalSpentToAdd = 0) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const newPoints = (c.points || 0) + pointsToAdd;
        const newSpent = (c.totalSpent || 0) + totalSpentToAdd;
        let newLevel = 'Bronce';
        if (newPoints >= 2000) newLevel = 'Platinum';
        else if (newPoints >= 1000) newLevel = 'VIP';
        else if (newPoints >= 500) newLevel = 'Oro';
        else if (newPoints >= 200) newLevel = 'Plata';
        
        return { ...c, points: newPoints, totalSpent: newSpent, level: newLevel };
      }
      return c;
    }));
  };

  const addItem = (setter) => (item) => setter(prev => [...prev, { ...item, id: uuidv4(), active: true }]);
  const updateItem = (setter) => (id, updated) => setter(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  const deleteItem = (setter) => (id) => setter(prev => prev.filter(item => item.id !== id));
  
  const setTableFamily = (tableKey, familyName, status) => {
    if (!familyName) {
      setTableFamilies(prev => {
        const next = { ...prev };
        delete next[tableKey];
        return next;
      });
    } else {
      setTableFamilies(prev => ({
        ...prev,
        [tableKey]: { familyName, status, timestamp: Date.now() }
      }));
    }
  };

  return (
    <StoreContext.Provider value={{
      currentUser, setCurrentUser,
      login, logout, logAudit,
      users, addUser: addItem(setUsers), updateUser: updateItem(setUsers), deleteUser: deleteItem(setUsers),
      customers, addCustomer: addItem(setCustomers), updateCustomer: updateItem(setCustomers), deleteCustomer: deleteItem(setCustomers), updateCustomerPoints,
      locations, addLocation: addItem(setLocations), updateLocation: updateItem(setLocations), deleteLocation: deleteItem(setLocations),
      categories, addCategory: addItem(setCategories), updateCategory: updateItem(setCategories), deleteCategory: deleteItem(setCategories),
      subcategories, addSubcategory: addItem(setSubcategories), updateSubcategory: updateItem(setSubcategories), deleteSubcategory: deleteItem(setSubcategories),
      menu: catalogs.find(c => c.active)?.items || [], catalogs, setCatalogs, addCatalog: addItem(setCatalogs), updateCatalog: updateItem(setCatalogs), deleteCatalog: deleteItem(setCatalogs),
      menuStatus, setMenuStatus, 
      updateMenuStatus: async (newStatus) => {
        setMenuStatus(newStatus);
        await saveState('menuStatus', newStatus);
      },
      zones, addZone: addItem(setZones), updateZone: updateItem(setZones), deleteZone: deleteItem(setZones),
      orders, setOrders, updateOrderStatus, dispatchOrderItems, updateOrderItemStatus, registerOnlineSale,
      isBarActive, setIsBarActive,
      businessDay, setBusinessDay, pastDays, setPastDays, openDay, closeDay, openCaja, closeCaja,
      addIncome, addExpense,
      activeTables, setActiveTables, updateTableCart, sendTableOrders, voidTableItem, payTable, voidSaleAndReopenTable, issueCreditNote,
      tableHeadcounts, setTableHeadcounts,
      companies, addCompany: addItem(setCompanies), updateCompany: updateItem(setCompanies), deleteCompany: deleteItem(setCompanies),
      developerSettings, setDeveloperSettings,
      kardexItems, addKardexItem: addItem(setKardexItems), updateKardexItem: updateItem(setKardexItems), deleteKardexItem: deleteItem(setKardexItems),
      updateKardexData,
      tableFamilies, setTableFamily
    }}>
      {children}
    </StoreContext.Provider>
  );
};
