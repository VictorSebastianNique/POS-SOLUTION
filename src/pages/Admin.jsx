import { useAlert } from '../context/AlertContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Settings, Plus, Trash2, Check, X, User, Edit2, Save, LogOut, Lock, Unlock, Eye, EyeOff, Download, Calendar, ChevronRight, Building2, MapPin, TrendingUp, ShieldAlert, FileText } from 'lucide-react';
import Metrics from './Metrics';
import KardexConfigTab from '../components/KardexConfigTab';
import MenuRecipeModal from '../components/MenuRecipeModal';
import CrmTab from '../components/CrmTab';

export default function Admin() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { 
    currentUser, logout,
    users, addUser, updateUser, deleteUser,
    categories, addCategory, updateCategory, deleteCategory,
    subcategories, addSubcategory, updateSubcategory, deleteSubcategory,
    menu, catalogs, setCatalogs, addCatalog, updateCatalog, deleteCatalog,
    menuStatus, setMenuStatus, updateMenuStatus,
    zones, addZone, updateZone, deleteZone,
    isBarActive, setIsBarActive,
    businessDay, pastDays, openDay, closeDay,
    activeTables,
    companies, addCompany, updateCompany, deleteCompany,
    locations, addLocation, updateLocation, deleteLocation, 
    developerSettings, setDeveloperSettings } = useStore();
  
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const currentLoc = locations?.find(l => l.id === localStorage.getItem('currentLocationId'));
  
  const [activeTab, setActiveTab] = useState('caja');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth <= 768;

  // Auditoria State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  
  useEffect(() => {
    if (activeTab === 'auditoria') {
      fetch('/api/audit/logs').then(res => res.json()).then(data => setAuditLogs(data)).catch(console.error);
    }
  }, [activeTab]);

  const exportAuditCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Rol', 'Acción', 'Detalles'];
    const rows = auditLogs.filter(log => 
      Object.values(log).some(v => String(v).toLowerCase().includes(auditSearch.toLowerCase())) ||
      JSON.stringify(log.details).toLowerCase().includes(auditSearch.toLowerCase())
    ).map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.role,
      log.action,
      JSON.stringify(log.details || {}).replace(/"/g, '""')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => `"${e.join('","')}"`)].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close Day State
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [closeDayPassword, setCloseDayPassword] = useState('');
  const [closeDayDeclaredCash, setCloseDayDeclaredCash] = useState('');
  const [closeDayError, setCloseDayError] = useState('');

  const handleOpenCloseDayModal = () => {
    if (Object.keys(activeTables).length > 0) {
      showAlert('No puedes cerrar el día porque aún hay mesas con cuentas abiertas por cobrar.');
      return;
    }
    setShowCloseDayModal(true);
    setCloseDayPassword('');
    setCloseDayDeclaredCash('');
    setCloseDayError('');
  };

  const handleCloseDayConfirm = (e) => {
    e.preventDefault();
    const adminUser = users.find(u => (u.role === 'admin' || u.role === 'superadmin') && u.password === closeDayPassword && u.active);
    if (!adminUser) {
      setCloseDayError('Contraseña incorrecta');
      return;
    }

    const todayTotal = businessDay?.totalSales || 0;
    const todayIncomes = (businessDay?.incomes || []).reduce((sum, inc) => sum + inc.amount, 0);
    const todayExpenses = (businessDay?.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const expectedCash = todayTotal + todayIncomes - todayExpenses;
    const declaredCash = parseFloat(closeDayDeclaredCash || 0);
    
    const diff = Math.abs(declaredCash - expectedCash);

    if (diff > 5 && adminUser.role !== 'superadmin') {
      setCloseDayError(`Descuadre grave (S/${diff.toFixed(2)}). Se requiere PIN de SuperAdmin para forzar cierre.`);
      return;
    }

    closeDay({
      arqueo: { expectedCash, declaredCash, difference: declaredCash - expectedCash }
    });
    setShowCloseDayModal(false);
  };

  // Companies state
  const [newCompany, setNewCompany] = useState({ name: '', ruc: '', address: '', boletaSeries: 'B001', boletaNumber: 0, facturaSeries: 'F001', facturaNumber: 0 });
  const [editCompany, setEditCompany] = useState(null);
  const [editLocation, setEditLocation] = useState(null);
  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.ruc) return;
    addCompany({ ...newCompany, active: true });
    setNewCompany({ name: '', ruc: '', address: '', boletaSeries: 'B001', boletaNumber: 0, facturaSeries: 'F001', facturaNumber: 0 });
  };
  const saveEditCompany = () => { updateCompany(editCompany.id, editCompany.data); setEditCompany(null); };

  useEffect(() => {
    if (!currentUser) { 
      const lastRole = localStorage.getItem('lastRole'); 
      const isIncognito = developerSettings?.isSuperAdminIncognito;
      if (lastRole === 'superadmin' && !isIncognito) { 
        navigate('/super-admin'); 
      } else { 
        const locId = localStorage.getItem('currentLocationId'); 
        navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); 
      } 
      return; 
    } 
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') navigate('/');
  }, [currentUser, navigate, developerSettings]);

  const handleLogout = () => {
    logout();
    const locId = localStorage.getItem('currentLocationId');
    const isIncognito = developerSettings?.isSuperAdminIncognito;
    if (currentUser.role === 'superadmin' && !isIncognito) {
      navigate('/super-admin');
    } else {
      navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/');
    }
  };

  if (!currentUser) return null;

  // --- Users State ---
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'mozo', name: '', locationId: localStorage.getItem('currentLocationId') });
  const [editUser, setEditUser] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;
    const userToSave = { ...newUser };
    if (userToSave.role === 'superadmin') userToSave.locationId = 'all';
    addUser(userToSave);
    setNewUser({ username: '', password: '', role: 'mozo', name: '', locationId: localStorage.getItem('currentLocationId') });
  };
  const saveEditUser = () => {
    updateUser(editUser.id, editUser.data);
    setEditUser(null);
  };

  // --- Categories State ---
  const [newCat, setNewCat] = useState({ name: '', station: 'cocina' });
  const [editCat, setEditCat] = useState(null);
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    addCategory(newCat);
    setNewCat({ name: '', station: 'cocina' });
  };
  const saveEditCat = () => {
    updateCategory(editCat.id, editCat.data);
    setEditCat(null);
  };

  
  // --- Subcategories State ---
  const [newSubcat, setNewSubcat] = useState({ name: '', categoryId: '' });
  const [editSubcat, setEditSubcat] = useState(null);
  const handleAddSubcategory = (e) => {
    e.preventDefault();
    if (!newSubcat.name || !newSubcat.categoryId) return;
    addSubcategory(newSubcat);
    setNewSubcat({ name: '', categoryId: '' });
  };
  const saveEditSubcat = () => {
    updateSubcategory(editSubcat.id, editSubcat.data);
    setEditSubcat(null);
  };

  // --- Menu State ---
  const [newMenu, setNewMenu] = useState({ name: '', price: '', categoryId: '', subcategoryId: '', noDiscount: false, availableDays: [] });
  const [editMenu, setEditMenu] = useState(null);
  const [recipeMenu, setRecipeMenu] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterActive, setMenuFilterActive] = useState('all'); // 'all'|'active'|'inactive'
  const [menuFilterCategory, setMenuFilterCategory] = useState('all');
  
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const workingCatalog = catalogs?.find(c => c.id === (selectedCatalogId || catalogs?.[0]?.id));
  const workingMenu = workingCatalog?.items || [];

  const handleAddMenu = (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.price || !newMenu.categoryId || !workingCatalog) return;
    const newItem = { ...newMenu, price: parseFloat(newMenu.price), id: Date.now().toString(), active: true };
    setCatalogs(prev => prev.map(c => c.id === workingCatalog.id ? { ...c, items: [...c.items, newItem] } : c));
    setNewMenu({ name: '', price: '', categoryId: '', subcategoryId: '', noDiscount: false, availableDays: [] });
  };
  const saveEditMenu = () => {
    setCatalogs(prev => prev.map(c => c.id === workingCatalog.id ? { ...c, items: c.items.map(i => i.id === editMenu.id ? { ...editMenu.data, price: parseFloat(editMenu.data.price) } : i) } : c));
    setEditMenu(null);
  };

  // --- Zones State ---
  const [newZone, setNewZone] = useState({ name: '', tables: '' });
  const [editZone, setEditZone] = useState(null);
  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZone.name) return;
    addZone({ ...newZone, tables: [] });
    setNewZone({ name: '', tables: '' });
  };
  const saveEditZone = () => {
    updateZone(editZone.id, { ...editZone.data });
    setEditZone(null);
  };

  const [selectedAdminZone, setSelectedAdminZone] = useState(null);

  const handleAddTableToZone = (zone) => {
    let prefix = zone.name ? zone.name.charAt(0).toUpperCase() : 'M';
    
    // Check if other zones start with the same letter
    const sameFirstLetter = zones.some(z => z.id !== zone.id && z.name && z.name.toUpperCase().startsWith(prefix));
    
    if (sameFirstLetter && zone.name && zone.name.length >= 2) {
      prefix = zone.name.substring(0, 2).toUpperCase();
      
      const sameFirstTwo = zones.some(z => z.id !== zone.id && z.name && z.name.toUpperCase().startsWith(prefix));
      if (sameFirstTwo && zone.name.length >= 3) {
        prefix = zone.name.substring(0, 3).toUpperCase();
      }
    }

    const newTableName = `${prefix}${zone.tables.length + 1}`;
    updateZone(zone.id, { ...zone, tables: [...zone.tables, newTableName] });
  };

  const handleUpdateTableName = (zone, index, newName) => {
    if (!newName.trim() || newName === zone.tables[index]) return;
    const newTables = [...zone.tables];
    newTables[index] = newName.trim();
    updateZone(zone.id, { ...zone, tables: newTables });
  };

  const handleDeleteTableFromZone = (zone, index) => {
    const tableName = zone.tables[index];
    const tKey = `${zone.id}-${tableName}`;
    
    if (activeTables[tKey] && activeTables[tKey].length > 0) {
      showAlert(`No se puede eliminar la mesa "${tableName}" porque tiene una cuenta abierta. Por favor, cóbrala o anúlala primero.`);
      return;
    }
    
    const newTables = zone.tables.filter((_, i) => i !== index);
    updateZone(zone.id, { ...zone, tables: newTables });
  };

  const downloadExcel = (day) => {
    const dateStr = new Date(day.startTime).toLocaleDateString();
    const endTimeStr = day.endTime ? new Date(day.endTime).toLocaleString() : 'N/A';
    
    // Header summary
    let csv = `REPORTE DE VENTAS\n`;
    csv += `Fecha de apertura:,"${dateStr}"\n`;
    csv += `Fecha de cierre:,"${endTimeStr}"\n\n`;

    let grandTotalSoles = 0;
    const paymentMethodsSummary = {}; // To store totals by payment method

    // Group sales by company
    const salesByCompany = {};
    if (day.sales) {
      day.sales.forEach(sale => {
        const cName = sale.companyName || 'Sin Empresa Especificada';
        if (!salesByCompany[cName]) salesByCompany[cName] = { sales: [], total: 0 };
        
        const saleTotal = sale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        salesByCompany[cName].sales.push(sale);
        salesByCompany[cName].total += saleTotal;
        grandTotalSoles += saleTotal;

        // Payment method summary
        const method = sale.paymentMethod || 'Efectivo';
        const formattedMethod = method.charAt(0).toUpperCase() + method.slice(1);
        if (!paymentMethodsSummary[formattedMethod]) paymentMethodsSummary[formattedMethod] = 0;
        paymentMethodsSummary[formattedMethod] += saleTotal;
      });
    }

    // Render sales by company
    Object.keys(salesByCompany).forEach(cName => {
      csv += `EMPRESA:,"${cName}"\n`;
      csv += 'DETALLE DE VENTAS\n';
      csv += 'Fecha,Hora,Mozo,Zona,Mesa,Producto,Cantidad,Precio Unitario,Total,Medio de Pago,Estado\n';
      
      salesByCompany[cName].sales.forEach(sale => {
        const timeStr = new Date(sale.timestamp).toLocaleTimeString();
        const method = sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Efectivo';

        sale.items.forEach(item => {
          const total = item.quantity * item.price;
          csv += `"${dateStr}","${timeStr}","${sale.waiter}","${sale.zone}","${sale.table}","${item.item}",${item.quantity},"S/ ${item.price.toFixed(2)}","S/ ${total.toFixed(2)}","${method}","Vendido"\n`;
        });
      });
      csv += `,,,,,,,,,,\n`;
      csv += `,,,,,,,,TOTAL VENDIDO (${cName}):,"S/ ${salesByCompany[cName].total.toFixed(2)}",\n\n\n`;
    });

    if (Object.keys(salesByCompany).length > 1) {
      csv += `,,,,,,,,TOTAL GENERAL VENDIDO:,"S/ ${grandTotalSoles.toFixed(2)}",\n\n\n`;
    }

    // Add payment methods summary before voids
    if (Object.keys(paymentMethodsSummary).length > 0) {
      csv += 'RESUMEN POR MEDIOS DE PAGO\n';
      csv += 'Medio de Pago,Total Recaudado\n';
      Object.keys(paymentMethodsSummary).forEach(method => {
        csv += `"${method}","S/ ${paymentMethodsSummary[method].toFixed(2)}"\n`;
      });
      csv += `\n\n`;
    }

    // Incomes
    csv += 'DETALLE DE INGRESOS EXTRAORDINARIOS\n';
    csv += 'Hora,Categoría,Detalle,Medio de Pago,Monto\n';
    let totalInc = 0;
    if (day.incomes && day.incomes.length > 0) {
      day.incomes.forEach(inc => {
        const timeStr = new Date(inc.timestamp).toLocaleTimeString();
        csv += `"${timeStr}","${inc.category}","${inc.details || '-'}","${inc.paymentMethod}","S/ ${inc.amount.toFixed(2)}"\n`;
        totalInc += inc.amount;
      });
    } else {
      csv += `-,Sin registros,-,-,-\n`;
    }
    csv += `,,,TOTAL INGRESOS:,"S/ ${totalInc.toFixed(2)}"\n\n\n`;

    // Expenses
    csv += 'DETALLE DE EGRESOS\n';
    csv += 'Hora,Categoría,Detalle,Medio de Pago,Monto\n';
    let totalExp = 0;
    if (day.expenses && day.expenses.length > 0) {
      day.expenses.forEach(exp => {
        const timeStr = new Date(exp.timestamp).toLocaleTimeString();
        csv += `"${timeStr}","${exp.category}","${exp.details || '-'}","${exp.paymentMethod}","S/ ${exp.amount.toFixed(2)}"\n`;
        totalExp += exp.amount;
      });
    } else {
      csv += `-,Sin registros,-,-,-\n`;
    }
    csv += `,,,TOTAL EGRESOS:,"S/ ${totalExp.toFixed(2)}"\n\n\n`;

    // Voids
    if (day.voids && day.voids.length > 0) {
      csv += 'DETALLE DE ANULACIONES\n';
      csv += 'Fecha,Hora,Autorizado Por,Mesa,Producto,Cantidad,Motivo\n';
      day.voids.forEach(v => {
        const timeStr = new Date(v.timestamp).toLocaleTimeString();
        csv += `"${dateStr}","${timeStr}","${v.admin || '-'}","${v.tableKey}","${v.item}",${v.quantity},"${v.reason}"\n`;
      });
    }

    // Add BOM for correct UTF-8 rendering in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_de_Ventas_${dateStr.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Subcomponents ---
  const ToggleActiveBtn = ({ active, onClick }) => (
    <button 
      className={`btn ${active ? 'btn-outline' : 'btn-danger'}`} 
      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '90px' }}
      onClick={onClick}
    >
      {active ? <span className="flex items-center gap-1"><Check size={14}/> Activo</span> : <span className="flex items-center gap-1"><X size={14}/> Inactivo</span>}
    </button>
  );
  const DaySelector = ({ selectedDays = [], onChange }) => {
    const days = [{ id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' }, { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }];
    const toggleDay = (d) => {
      if (selectedDays.includes(d)) onChange(selectedDays.filter(day => day !== d));
      else onChange([...selectedDays, d]);
    };
    return (
      <div className="flex flex-col gap-1">
        <label className="subtitle" style={{ fontSize: '0.75rem' }}>Días Activos (Vacío = Todos)</label>
        <div className="flex gap-1">
          {days.map(d => (
            <button type="button" key={d.id} onClick={() => toggleDay(d.id)} className={`btn ${selectedDays.includes(d.id) ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', minWidth: '24px' }}>{d.label}</button>
          ))}
        </div>
      </div>
    );
  };
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: '3rem' }}>
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="top-nav" style={{ borderRadius: isMobile ? 0 : 'var(--border-radius)', marginBottom: isMobile ? '1rem' : '2rem', padding: isMobile ? '0.6rem 1rem' : undefined }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontSize: '1.2rem' }}>&#9776;</span>
          </button>
          <Settings size={isMobile ? 20 : 28} style={{ color: 'var(--primary-color)' }} />
          <h1 className="title" style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>{isMobile ? 'Admin' : 'Panel de Administración'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center gap-2 mr-4" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
              <p className="subtitle mr-1" style={{ fontSize: '0.8rem' }}>Supervisar:</p>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigate('/mozo')}><Eye size={14}/> Mozo</button>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigate('/anfitriona')}><Eye size={14}/> Anfitriona</button>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigate('/cocina')}><Eye size={14}/> Cocina</button>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigate('/bar')}><Eye size={14}/> Bar</button>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={() => navigate('/caja')}><Eye size={14}/> Caja</button>
            </div>
          )}
          {currentLoc && <p className="subtitle flex items-center gap-1" style={{ fontSize: '0.8rem', marginRight: '0.5rem' }}><MapPin size={14}/> {currentLoc.name}</p>}
          <p className="subtitle flex items-center gap-1" style={{ fontSize: '0.8rem' }}><User size={14}/> {currentUser.name}</p>
          <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={handleLogout}><LogOut size={18}/></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: isMobile ? '0 1rem' : '0 2rem' }}>
        {/* Sidebar — drawer on mobile, static on desktop */}
        <div style={{
          width: isMobile ? '260px' : '220px',
          flexShrink: 0,
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '0.5rem',
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : undefined,
          left: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          zIndex: isMobile ? 201 : undefined,
          backgroundColor: isMobile ? 'var(--surface-color)' : 'transparent',
          padding: isMobile ? '1.5rem 1rem' : 0,
          overflowY: isMobile ? 'auto' : undefined,
        }}>
          {isMobile && <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Menú Admin</div>}
          {developerSettings?.adminModules?.caja !== false && (
            <button className={`btn ${activeTab === 'caja' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('caja')}>Caja y Reportes</button>
          )}
          {developerSettings?.adminModules?.users !== false && (
            <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('users')}>Usuarios</button>
          )}
          {developerSettings?.adminModules?.crm !== false && (
            <button className={`btn ${activeTab === 'crm' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('crm')}>⭐ CRM y Fidelización</button>
          )}
          {developerSettings?.adminModules?.categories !== false && (
            <button className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('categories')}>Categorías</button>
          )}
          {developerSettings?.adminModules?.subcategories !== false && (
            <button className={`btn ${activeTab === 'subcategories' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('subcategories')}>Subcategorías</button>
          )}
          {developerSettings?.adminModules?.menu !== false && (
            <button className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('menu')}>Platos / Menú</button>
          )}
          {developerSettings?.adminModules?.kardex_config !== false && (
            <button className={`btn ${activeTab === 'kardex_config' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('kardex_config')}>Insumos Kardex</button>
          )}
          {developerSettings?.adminModules?.zones !== false && (
            <button className={`btn ${activeTab === 'zones' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('zones')}>Zonas y Mesas</button>
          )}
          {developerSettings?.adminModules?.empresas !== false && (
            <button className={`btn ${activeTab === 'empresas' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('empresas')}><Building2 size={15}/> Empresas</button>
          )}
          
          {(!developerSettings?.metricsOnlySuperAdmin || isSuperAdmin) && developerSettings?.adminModules?.metrics !== false && (
            <button className={`btn ${activeTab === 'metrics' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('metrics')}><TrendingUp size={15}/> Business Intelligence (BI)</button>
          )}

          {developerSettings?.adminModules?.auditoria !== false && (
            <button className={`btn ${activeTab === 'auditoria' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('auditoria')}><ShieldAlert size={15}/> Auditoría</button>
          )}

          {isSuperAdmin && developerSettings?.adminModules?.locales !== false && (
            <button className={`btn ${activeTab === 'locales' ? 'btn-primary' : 'btn-outline'} w-full justify-start`} onClick={() => handleTabClick('locales')}><MapPin size={15}/> Locales / Sedes</button>
          )}
          
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="subtitle mb-2" style={{ fontSize: '0.875rem' }}>Configuración Global</p>
            <button 
              className={`btn w-full justify-start ${isBarActive ? 'btn-primary' : 'btn-danger'} mb-2`} 
              onClick={() => setIsBarActive(!isBarActive)}
            >
              {isBarActive ? <span className="flex items-center gap-2"><Check size={16}/> Bar Activado</span> : <span className="flex items-center gap-2"><X size={16}/> Bar Desactivado</span>}
            </button>
            <p className="subtitle mt-2 mb-4" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
              {isBarActive ? 'Pedidos de bebidas van al Bar.' : 'Todo va a Cocina.'}
            </p>

            {isSuperAdmin && (
              <>
                <button 
                  className={`btn w-full justify-start ${developerSettings?.metricsOnlySuperAdmin ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setDeveloperSettings(prev => ({ ...prev, metricsOnlySuperAdmin: !prev.metricsOnlySuperAdmin }))}
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  <Lock size={14} className="mr-2"/> 
                  {developerSettings?.metricsOnlySuperAdmin ? 'BI Restringido (Solo Super Admin)' : 'BI Público (Todos los Admins)'}
                </button>
                <p className="subtitle mt-1" style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                  Si está activado, los administradores locales no verán la pestaña de Inteligencia de Negocios.
                </p>
              </>
            )}
          </div>

          {isMobile && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex flex-col gap-1">
                <p className="subtitle" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Supervisar:</p>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/mozo')}><Eye size={14}/> Mozo</button>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/anfitriona')}><Eye size={14}/> Anfitriona</button>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/cocina')}><Eye size={14}/> Cocina</button>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/bar')}><Eye size={14}/> Bar</button>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={() => navigate('/caja')}><Eye size={14}/> Caja</button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0 0 2rem' : undefined }}>

          {/* TAB: METRICS (BI) */}
          {activeTab === 'metrics' && (!developerSettings?.metricsOnlySuperAdmin || isSuperAdmin) && (
            <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
              <Metrics />
            </div>
          )}

          {/* TAB: CAJA Y REPORTES */}
          {activeTab === 'caja' && (
            <div className="animate-fade-in">
              <div className="card mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
                {businessDay.isOpen ? (
                  <>
                    <Unlock size={48} style={{ color: 'var(--success-color)', marginBottom: '1rem' }} />
                    <h2 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Día Abierto</h2>
                    <p className="subtitle mb-6">El sistema está recibiendo pedidos.</p>
                    
                    <div className="flex gap-6 mb-8 w-full justify-center">
                      <div className="card" style={{ backgroundColor: 'var(--bg-color)', minWidth: '200px' }}>
                        <p className="subtitle">Ventas Acumuladas</p>
                        <h3 className="title text-primary-color" style={{ fontSize: '2rem' }}>S/{businessDay.totalSales.toFixed(2)}</h3>
                      </div>
                      <div className="card" style={{ backgroundColor: 'var(--bg-color)', minWidth: '200px' }}>
                        <p className="subtitle">Anulaciones</p>
                        <h3 className="title" style={{ fontSize: '2rem', color: 'var(--danger-color)' }}>{businessDay.voids?.length || 0}</h3>
                      </div>
                    </div>

                    <button className="btn btn-danger" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} onClick={handleOpenCloseDayModal}>
                      Cerrar Día y Guardar Reporte
                    </button>
                  </>
                ) : (
                  <>
                    <Lock size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h2 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Día Cerrado</h2>
                    <p className="subtitle mb-6">Abre la jornada para que los mozos puedan tomar pedidos.</p>
                    
                    {businessDay.lastClosedTotal !== undefined && (
                      <p className="subtitle mb-6" style={{ color: 'var(--success-color)' }}>
                        Venta del día anterior: S/{businessDay.lastClosedTotal.toFixed(2)}
                      </p>
                    )}

                    <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} onClick={openDay}>
                      Abrir Nuevo Día
                    </button>
                  </>
                )}
              </div>

              {businessDay.isOpen && businessDay.voids && businessDay.voids.length > 0 && (
                <div className="card">
                  <h2 className="title mb-4 flex items-center gap-2"><X size={20} className="text-danger" /> Reporte de Anulaciones</h2>
                  <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th className="pb-3 subtitle">Hora</th>
                        <th className="pb-3 subtitle">Mesa</th>
                        <th className="pb-3 subtitle">Producto</th>
                        <th className="pb-3 subtitle">Autorizado por</th>
                        <th className="pb-3 subtitle">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessDay.voids.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="py-3 text-secondary">{new Date(v.timestamp).toLocaleTimeString()}</td>
                          <td className="py-3">{v.tableKey}</td>
                          <td className="py-3" style={{ fontWeight: 500 }}>{v.quantity}x {v.item}</td>
                          <td className="py-3 text-secondary">{v.admin}</td>
                          <td className="py-3" style={{ color: 'var(--danger-color)' }}>{v.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              )}

              {/* Historial de Días */}
              <div className="card mt-6">
                <h2 className="title mb-4 flex items-center gap-2"><Calendar size={20} className="text-primary-color" /> Historial de Cierres (Reportes)</h2>
                {pastDays.length === 0 ? (
                  <p className="text-secondary text-center py-4">No hay días cerrados aún.</p>
                ) : (
                  <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th className="pb-3 subtitle">Fecha de Cierre</th>
                        <th className="pb-3 subtitle">Tickets (Mesas)</th>
                        <th className="pb-3 subtitle">Ingresos (+)</th>
                        <th className="pb-3 subtitle">Egresos (-)</th>
                        <th className="pb-3 subtitle">Ventas Totales</th>
                        <th className="pb-3 subtitle">Flujo de Caja</th>
                        <th className="pb-3 subtitle" style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastDays.map(pd => {
                        const totalInc = (pd.incomes || []).reduce((s, i) => s + i.amount, 0);
                        const totalExp = (pd.expenses || []).reduce((s, i) => s + i.amount, 0);
                        const totalVendido = pd.totalSales || pd.lastClosedTotal || 0;
                        const netCash = totalVendido + totalInc - totalExp;
                        return (
                        <tr key={pd.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="py-4" style={{ fontWeight: 500 }}>{new Date(pd.endTime).toLocaleString()}</td>
                          <td className="py-4 text-secondary">{pd.sales?.length || 0} <span className="text-danger">({pd.voids?.length || 0} anul)</span></td>
                          <td className="py-4 text-success">+S/{totalInc.toFixed(2)}</td>
                          <td className="py-4 text-danger">-S/{totalExp.toFixed(2)}</td>
                          <td className="py-4" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>S/{totalVendido.toFixed(2)}</td>
                          <td className="py-4" style={{ fontWeight: 800 }}>S/{netCash.toFixed(2)}</td>
                          <td className="py-4 flex justify-end">
                            <button className="btn btn-outline flex items-center gap-2" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={() => downloadExcel(pd)}>
                              <Download size={16} /> Excel
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table></div>
                )}
              </div>
            </div>
          )}
          
          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Agregar Nuevo Usuario</h2>
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre Real</label>
                    <input className="input mt-1 w-full" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ej. Juan Pérez" required />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Usuario (Login)</label>
                    <input className="input mt-1" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase()})} placeholder="juanp" required style={{ width: '150px' }} />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Contraseña</label>
                    <input className="input mt-1" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="***" required style={{ width: '120px' }} />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Rol</label>
                    <select className="input mt-1" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '130px' }}>
                      <option value="mozo">Mozo</option>
                      <option value="anfitriona">Anfitriona</option>
                      <option value="cajera">Cajera</option>
                      <option value="cocina">Cocina</option>
                      <option value="bar">Bar</option>
                      <option value="admin">Admin</option>
                      {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/></button>
                </form>
              </div>

              <div className="card">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Usuarios del Sistema</h2>
                <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th className="pb-3 subtitle">Nombre</th>
                      <th className="pb-3 subtitle">Usuario</th>
                      <th className="pb-3 subtitle">Contraseña</th>
                      <th className="pb-3 subtitle">Rol</th>
                      <th className="pb-3 subtitle">Sede</th>
                      <th className="pb-3 subtitle">Estado</th>
                      <th className="pb-3 subtitle" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => isSuperAdmin || u.locationId === currentLoc?.id).map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {editUser?.id === u.id ? (
                          <>
                            <td className="py-2"><input className="input" value={editUser.data.name} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, name: e.target.value } })} /></td>
                            <td className="py-2"><input className="input" value={editUser.data.username} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, username: e.target.value.toLowerCase() } })} /></td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <input type={visiblePasswords[u.id] ? "text" : "password"} className="input w-full" value={editUser.data.password} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, password: e.target.value } })} />
                                <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}>
                                  {visiblePasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-2">
                              <select className="input" value={editUser.data.role} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, role: e.target.value } })}>
                                <option value="mozo">Mozo</option>
                                <option value="anfitriona">Anfitriona</option>
                                <option value="cajera">Cajera</option>
                                <option value="cocina">Cocina</option>
                                <option value="bar">Bar</option>
                                <option value="admin">Admin</option>
                                {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                              </select>
                            </td>
                            <td className="py-2">
                              {editUser.data.role === 'superadmin' ? 'Todas' : (locations.find(l => l.id === editUser.data.locationId)?.name || 'Esta Sede')}
                            </td>
                            <td className="py-2">-</td>
                            <td className="py-2 flex justify-end gap-2">
                              <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={saveEditUser}><Save size={16}/></button>
                              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditUser(null)}><X size={16}/></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4" style={{ fontWeight: 500 }}>{u.name}</td>
                            <td className="py-4 text-secondary">{u.username}</td>
                            <td className="py-4 text-secondary">
                              <div className="flex items-center gap-2">
                                <span style={{ fontFamily: visiblePasswords[u.id] ? 'inherit' : 'monospace', letterSpacing: visiblePasswords[u.id] ? 'normal' : '2px', fontSize: visiblePasswords[u.id] ? '0.875rem' : '1.2rem', lineHeight: 1 }}>
                                  {visiblePasswords[u.id] ? u.password : '••••••••'}
                                </span>
                                <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)', display: 'flex' }} title={visiblePasswords[u.id] ? "Ocultar contraseña" : "Ver contraseña"}>
                                  {visiblePasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-4 capitalize">{u.role}</td>
                            <td className="py-4 text-secondary">{u.role === 'superadmin' ? 'Todas' : (locations.find(l => l.id === u.locationId)?.name || '-')}</td>
                            <td className="py-4">
                              <ToggleActiveBtn active={u.active} onClick={() => updateUser(u.id, { active: !u.active })} />
                            </td>
                            <td className="py-4 flex justify-end gap-2">
                              <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning-color)' }} onClick={() => setEditUser({ id: u.id, data: { ...u } })}><Edit2 size={16}/></button>
                              <button className="btn btn-outline" disabled={u.id === currentUser.id} style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => deleteUser(u.id)}><Trash2 size={16}/></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === 'crm' && (
            <CrmTab />
          )}

          {activeTab === 'categories' && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Agregar Categoría</h2>
                <form onSubmit={handleAddCategory} className="flex gap-4 items-end">
                  <div style={{ flex: 1 }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre de Categoría</label>
                    <input className="input mt-1 w-full" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value.toUpperCase()})} placeholder="Ej. Bebidas Calientes" required />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Estación</label>
                    <select className="input mt-1" value={newCat.station} onChange={e => setNewCat({...newCat, station: e.target.value})}>
                      <option value="cocina">Cocina</option>
                      <option value="bar">Bar</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/></button>
                </form>
              </div>

              <div className="grid grid-cols-2">
                {categories.map(c => (
                  <div key={c.id} className="card flex justify-between items-center">
                    {editCat?.id === c.id ? (
                      <div className="flex gap-2 w-full items-center">
                        <input className="input" style={{ flex: 1 }} value={editCat.data.name} onChange={e => setEditCat({ ...editCat, data: { ...editCat.data, name: e.target.value.toUpperCase() } })} />
                        <select className="input" style={{ width: '120px' }} value={editCat.data.station || 'cocina'} onChange={e => setEditCat({ ...editCat, data: { ...editCat.data, station: e.target.value } })}>
                          <option value="cocina">Cocina</option>
                          <option value="bar">Bar</option>
                        </select>
                        <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={saveEditCat}><Save size={16}/></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditCat(null)}><X size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="title" style={{ fontSize: '1.1rem' }}>{c.name}</h3>
                          <p className="subtitle" style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>Estación: {c.station || 'cocina'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ToggleActiveBtn active={c.active} onClick={() => updateCategory(c.id, { active: !c.active })} />
                          <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning-color)' }} onClick={() => setEditCat({ id: c.id, data: { ...c } })}><Edit2 size={16}/></button>
                          <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => deleteCategory(c.id)}><Trash2 size={16}/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LOCALES / SEDES */}
          {activeTab === 'locales' && isSuperAdmin && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Agregar Nueva Sede</h2>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = e.target.elements.name.value;
                    const brandName = e.target.elements.brandName.value;
                    const address = e.target.elements.address.value;
                    const phone = e.target.elements.phone.value;
                    const openTime = e.target.elements.openTime.value || '08:00';
                    const closeTime = e.target.elements.closeTime.value || '22:00';
                    if (!name) return;
                    addLocation({ name, brandName, address, phone, openTime, closeTime, id: name });
                    e.target.reset();
                  }} 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end"
                >
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre Interno (Sede)</label>
                    <input name="name" className="input mt-1 w-full" placeholder="Ej. Local Norte" required />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Marca (Para Ticket)</label>
                    <input name="brandName" className="input mt-1 w-full" placeholder="Ej. MI CAFE" />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Dirección de la Sede</label>
                    <input name="address" className="input mt-1 w-full" placeholder="Ej. Av. Sol 123" />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Teléfono de la Sede</label>
                    <input name="phone" className="input mt-1 w-full" placeholder="Ej. 987654321" />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Hora Apertura</label>
                    <input type="time" name="openTime" className="input mt-1 w-full" defaultValue="08:00" />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Hora Cierre</label>
                    <input type="time" name="closeTime" className="input mt-1 w-full" defaultValue="22:00" />
                  </div>
                  <button type="submit" className="btn btn-primary h-full md:col-span-2 lg:col-span-1"><Plus size={20}/> Agregar Sede</button>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {locations.map(loc => {
                  const locSlug = (loc.id || loc.name).replace(/\s+/g, '');
                  const loginLink = `${window.location.origin}/login/${encodeURIComponent(locSlug)}`;
                  
                  if (editLocation?.id === loc.id) {
                    return (
                      <div key={loc.id} className="card flex flex-col justify-between gap-4" style={{ border: '1px solid var(--primary-color)' }}>
                        <h3 className="title">Editar Sede</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <input className="input" placeholder="Nombre Interno" value={editLocation.name} onChange={e => setEditLocation({...editLocation, name: e.target.value})} />
                          <input className="input" placeholder="Marca (Ticket)" value={editLocation.brandName || ''} onChange={e => setEditLocation({...editLocation, brandName: e.target.value})} />
                          <input className="input" placeholder="Dirección" value={editLocation.address || ''} onChange={e => setEditLocation({...editLocation, address: e.target.value})} />
                          <input className="input" placeholder="Teléfono" value={editLocation.phone || ''} onChange={e => setEditLocation({...editLocation, phone: e.target.value})} />
                          <div className="flex flex-col"><label className="subtitle" style={{fontSize: '0.75rem', marginBottom: '0.2rem'}}>Apertura</label><input type="time" className="input" value={editLocation.openTime || '08:00'} onChange={e => setEditLocation({...editLocation, openTime: e.target.value})} /></div>
                          <div className="flex flex-col"><label className="subtitle" style={{fontSize: '0.75rem', marginBottom: '0.2rem'}}>Cierre</label><input type="time" className="input" value={editLocation.closeTime || '22:00'} onChange={e => setEditLocation({...editLocation, closeTime: e.target.value})} /></div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <button className="btn btn-outline" onClick={() => setEditLocation(null)}>Cancelar</button>
                          <button className="btn btn-primary" onClick={() => {
                            updateLocation(editLocation.id, editLocation);
                            setEditLocation(null);
                          }}>Guardar Cambios</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                  <div key={loc.id} className="card flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="title" style={{ fontSize: '1.1rem' }}>{loc.name}</h3>
                        <p className="subtitle" style={{ fontSize: '0.8rem' }}>ID Interno: {loc.id}</p>
                        <p className="subtitle mt-2" style={{ fontSize: '0.85rem' }}><strong>Marca:</strong> {loc.brandName || loc.name}</p>
                        <p className="subtitle" style={{ fontSize: '0.85rem' }}><strong>Dirección:</strong> {loc.address || 'No definida'}</p>
                        <p className="subtitle" style={{ fontSize: '0.85rem' }}><strong>Teléfono:</strong> {loc.phone || 'No definido'}</p>
                        <p className="subtitle" style={{ fontSize: '0.85rem' }}><strong>Horario:</strong> {loc.openTime || '08:00'} - {loc.closeTime || '22:00'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--primary-color)' }} onClick={() => setEditLocation(loc)}><Edit2 size={16}/></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => deleteLocation(loc.id)}><Trash2 size={16}/></button>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--primary-color)' }}>
                      <p className="subtitle mb-2" style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>Enlace de Acceso para Empleados:</p>
                      <div className="flex gap-2">
                        <input type="text" readOnly value={loginLink} className="input w-full" style={{ fontSize: '0.8rem', padding: '0.4rem', backgroundColor: 'transparent' }} />
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            navigator.clipboard.writeText(loginLink);
                            showAlert('¡Enlace copiado! Envíalo a los trabajadores de esta sede.');
                          }}
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          
          {/* TAB: SUBCATEGORIES */}
          {activeTab === 'subcategories' && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Agregar Subcategoría</h2>
                <form onSubmit={handleAddSubcategory} className="flex gap-4 items-end">
                  <div style={{ flex: 1 }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre de Subcategoría</label>
                    <input className="input mt-1 w-full" value={newSubcat.name} onChange={e => setNewSubcat({...newSubcat, name: e.target.value.toUpperCase()})} placeholder="Ej. Sopas" required />
                  </div>
                  <div>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Categoría Padre</label>
                    <select className="input mt-1" value={newSubcat.categoryId} onChange={e => setNewSubcat({...newSubcat, categoryId: e.target.value})} required>
                      <option value="">Selecciona...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/></button>
                </form>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {subcategories.map(s => {
                  const parentCat = categories.find(c => c.id === s.categoryId);
                  return (
                  <div key={s.id} className="card flex justify-between items-center">
                    {editSubcat?.id === s.id ? (
                      <div className="flex gap-2 w-full items-center">
                        <input className="input" style={{ flex: 1 }} value={editSubcat.data.name} onChange={e => setEditSubcat({ ...editSubcat, data: { ...editSubcat.data, name: e.target.value.toUpperCase() } })} />
                        <select className="input" style={{ width: '150px' }} value={editSubcat.data.categoryId} onChange={e => setEditSubcat({ ...editSubcat, data: { ...editSubcat.data, categoryId: e.target.value } })}>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={saveEditSubcat}><Save size={16}/></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditSubcat(null)}><X size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="title" style={{ fontSize: '1.1rem' }}>{s.name}</h3>
                          <p className="subtitle" style={{ fontSize: '0.8rem' }}>Categoría: {parentCat?.name || 'Ninguna'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ToggleActiveBtn active={s.active !== false} onClick={() => updateSubcategory(s.id, { active: s.active === false ? true : false })} />
                          <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning-color)' }} onClick={() => setEditSubcat({ id: s.id, data: { ...s } })}><Edit2 size={16}/></button>
                          <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => deleteSubcategory(s.id)}><Trash2 size={16}/></button>
                        </div>
                      </>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* TAB: MENU */}
          {activeTab === 'menu' && (
            <div className="animate-fade-in">
              {/* Selector de Listas / Catálogos */}
              <div className="card mb-6" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label className="subtitle mb-2" style={{ fontSize: '0.875rem' }}>Lista de Precios Actual</label>
                    <select 
                      className="input w-full" 
                      value={selectedCatalogId || catalogs?.[0]?.id || ''} 
                      onChange={e => setSelectedCatalogId(e.target.value)}
                    >
                      {catalogs?.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.active ? '(ACTIVA)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {workingCatalog && !workingCatalog.active && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setCatalogs(prev => prev.map(c => ({ ...c, active: c.id === workingCatalog.id })));
                        }}
                      >
                        <Check size={18} /> Fijar como Activa
                      </button>
                    )}
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        const name = window.prompt('Nombre de la nueva lista (Copia):', workingCatalog ? workingCatalog.name + ' - Copia' : 'Nueva Lista');
                        if (name) {
                          const newCatalog = {
                            id: Date.now().toString(),
                            name,
                            active: false,
                            items: workingCatalog ? workingCatalog.items.map(i => ({ ...i, id: Date.now().toString() + Math.random().toString().slice(2, 6), active: true })) : []
                          };
                          setCatalogs(prev => [...prev, newCatalog]);
                          setSelectedCatalogId(newCatalog.id);
                        }
                      }}
                    >
                      <Plus size={18} /> Crear Copia
                    </button>
                    {workingCatalog && !workingCatalog.active && catalogs?.length > 1 && (
                      <button 
                        className="btn btn-outline" style={{ color: 'var(--danger-color)' }}
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta lista permanentemente?')) {
                            setCatalogs(prev => prev.filter(c => c.id !== workingCatalog.id));
                            setSelectedCatalogId(catalogs.find(c => c.id !== workingCatalog.id)?.id);
                          }
                        }}
                      >
                        <Trash2 size={18} /> Eliminar Lista
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Agregar Nuevo Plato a {workingCatalog?.name}</h2>
                <form onSubmit={handleAddMenu} className="flex gap-4 items-end flex-wrap">
                  <div style={{ flex: '1 1 200px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre</label>
                    <input className="input mt-1 w-full" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value.toUpperCase()})} placeholder="Ej. Torta de Chocolate" required />
                  </div>
                  <div style={{ width: '120px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Precio (S/)</label>
                    <input className="input mt-1 w-full" type="number" step="0.01" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Categoría</label>
                    <select className="input mt-1 w-full" value={newMenu.categoryId} onChange={e => setNewMenu({...newMenu, categoryId: e.target.value, subcategoryId: ''})} required>
                      <option value="">Selecciona...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Subcategoría</label>
                    <select className="input mt-1 w-full" value={newMenu.subcategoryId || ''} onChange={e => setNewMenu({...newMenu, subcategoryId: e.target.value})}>
                      <option value="">Todas / Ninguna</option>
                      {subcategories.filter(s => s.categoryId === newMenu.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', paddingBottom: '0.2rem' }}>
                    <input type="checkbox" checked={newMenu.noDiscount} onChange={e => setNewMenu({...newMenu, noDiscount: e.target.checked})} id="noDiscount" />
                    <label htmlFor="noDiscount" className="subtitle mb-0" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>No permite descuento</label>
                  </div>
                  <div style={{ height: '42px', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem' }}>
                    <DaySelector selectedDays={newMenu.availableDays || []} onChange={days => setNewMenu({...newMenu, availableDays: days})} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/></button>
                </form>
              </div>

              <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 className="title" style={{ fontSize: '1.25rem', flex: 1 }}>Platos Existentes</h2>
                  {/* Search bar */}
                  <input
                    className="input"
                    style={{ width: '180px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
                    placeholder="🔍 Buscar plato..."
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                  />
                  {/* Category Filter */}
                  <select
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem', width: '150px' }}
                    value={menuFilterCategory}
                    onChange={e => setMenuFilterCategory(e.target.value)}
                  >
                    <option value="all">Todas las Categorías</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {/* Status filter */}
                  <div style={{ display: 'flex', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {[['all','Todos'],['active','Activos'],['inactive','Inactivos']].map(([val, label]) => (
                      <button key={val} onClick={() => setMenuFilterActive(val)}
                        style={{ padding: '0.4rem 0.7rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                          backgroundColor: menuFilterActive === val ? 'var(--primary-color)' : 'transparent',
                          color: menuFilterActive === val ? '#000' : 'var(--text-secondary)'
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th className="pb-3 subtitle">Nombre</th>
                      <th className="pb-3 subtitle">Categoría</th>
                      <th className="pb-3 subtitle">Subcategoría</th>
                      <th className="pb-3 subtitle">Precio (S/)</th>
                      <th className="pb-3 subtitle">Días</th>
                      <th className="pb-3 subtitle">Estado</th>
                      <th className="pb-3 subtitle" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingMenu
                      .filter(m => {
                        const matchSearch = m.name.toLowerCase().includes(menuSearch.toLowerCase());
                        const matchActive = menuFilterActive === 'all' ? true : menuFilterActive === 'active' ? m.active !== false : m.active === false;
                        const matchCat = menuFilterCategory === 'all' ? true : m.categoryId === menuFilterCategory;
                        return matchSearch && matchActive && matchCat;
                      })
                      .map(m => {
                      const catName = categories.find(c => c.id === m.categoryId)?.name || 'Sin Categoría';
                      const subcatName = subcategories.find(s => s.id === m.subcategoryId)?.name || '-';
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {editMenu?.id === m.id ? (
                            <>
                              <td className="py-2"><input className="input" value={editMenu.data.name} onChange={e => setEditMenu({ ...editMenu, data: { ...editMenu.data, name: e.target.value.toUpperCase() } })} /></td>
                              <td className="py-2">
                                <select className="input" value={editMenu.data.categoryId} onChange={e => setEditMenu({ ...editMenu, data: { ...editMenu.data, categoryId: e.target.value } })}>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </td>

                              <td className="py-2">
                                <select className="input" value={editMenu.data.subcategoryId || ''} onChange={e => setEditMenu({ ...editMenu, data: { ...editMenu.data, subcategoryId: e.target.value } })}>
                                  <option value="">Todas / Ninguna</option>
                                  {subcategories.filter(s => s.categoryId === editMenu.data.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              </td>

                              <td className="py-2"><input type="number" step="0.01" className="input" style={{ width: '100px' }} value={editMenu.data.price} onChange={e => setEditMenu({ ...editMenu, data: { ...editMenu.data, price: e.target.value } })} /></td>
                              <td className="py-2">
                                <DaySelector selectedDays={editMenu.data.availableDays || []} onChange={days => setEditMenu({ ...editMenu, data: { ...editMenu.data, availableDays: days } })} />
                              </td>
                              <td className="py-2">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={editMenu.data.noDiscount || false} onChange={e => setEditMenu({ ...editMenu, data: { ...editMenu.data, noDiscount: e.target.checked } })} />
                                  Sin Dsc.
                                </label>
                              </td>
                              <td className="py-2 flex justify-end gap-2">
                                <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={saveEditMenu}><Save size={16}/></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditMenu(null)}><X size={16}/></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-4" style={{ fontWeight: 500 }}>{m.name}</td>
                              <td className="py-4 text-secondary">{catName}</td>
                              <td className="py-4 text-secondary">{subcatName}</td>
                              <td className="py-4" style={{ color: 'var(--primary-color)' }}>S/{m.price.toFixed(2)}</td>
                              <td className="py-4" style={{ fontSize: '0.75rem' }}>
                                {(!m.availableDays || m.availableDays.length === 0 || m.availableDays.length === 7) ? 'Todos' : m.availableDays.map(d => ['D','L','M','X','J','V','S'][d]).join(', ')}
                              </td>
                              <td className="py-4">
                                <div className="flex flex-col gap-1">
                                  {isSuperAdmin && (
                                    <button 
                                      className={`btn ${m.active ? 'btn-outline' : 'btn-danger'}`} 
                                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                                      onClick={() => setCatalogs(prev => prev.map(c => c.id === workingCatalog.id ? { ...c, items: c.items.map(i => i.id === m.id ? { ...i, active: !i.active } : i) } : c))}
                                      title="Cambia el estado en TODAS las sedes"
                                    >
                                      Global: {m.active ? 'Activo' : 'Inactivo'}
                                    </button>
                                  )}
                                  <button 
                                    className={`btn ${menuStatus[m.id] !== false ? 'btn-outline' : 'btn-danger'}`} 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '90px' }}
                                    onClick={() => updateMenuStatus({ ...menuStatus, [m.id]: menuStatus[m.id] === false ? true : false })}
                                  >
                                    {menuStatus[m.id] !== false ? <span className="flex items-center gap-1"><Check size={14}/> Local Activo</span> : <span className="flex items-center gap-1"><X size={14}/> Local Inactivo</span>}
                                  </button>
                                  {m.noDiscount && <span style={{ fontSize: '0.65rem', color: 'var(--warning-color)', textAlign: 'center', marginTop: '0.2rem' }}>⚠️ Sin descuento</span>}
                                </div>
                              </td>
                              <td className="py-4 flex justify-end gap-2">
                                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--primary-color)' }} onClick={() => setRecipeMenu(m)} title="Configurar Receta Kardex"><FileText size={16}/></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning-color)' }} onClick={() => setEditMenu({ id: m.id, data: { ...m } })}><Edit2 size={16}/></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => setCatalogs(prev => prev.map(c => c.id === workingCatalog.id ? { ...c, items: c.items.filter(i => i.id !== m.id) } : c))}><Trash2 size={16}/></button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* TAB: ZONES */}
          {activeTab === 'kardex_config' && (
            <KardexConfigTab />
          )}

          {activeTab === 'zones' && (
            <div className="animate-fade-in flex flex-col h-full">
              {!selectedAdminZone ? (
                <>
                  <div className="card mb-6">
                    <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Añadir Nueva Zona</h2>
                    <form onSubmit={handleAddZone} className="flex gap-4 items-end">
                      <div style={{ flex: 1 }}>
                        <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre de la Zona</label>
                        <input className="input mt-1 w-full" value={newZone.name} onChange={e => setNewZone({...newZone, name: e.target.value.toUpperCase()})} placeholder="Ej. Patio Trasero" required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/> Añadir</button>
                    </form>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {zones.map(z => (
                      <div key={z.id} className="card card-interactive flex flex-col justify-between" onClick={() => setSelectedAdminZone(z)}>
                        {editZone?.id === z.id ? (
                          <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                            <input className="input" style={{ flex: 1 }} value={editZone.data.name} onChange={e => setEditZone({ ...editZone, data: { ...editZone.data, name: e.target.value.toUpperCase() } })} />
                            <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={saveEditZone}><Save size={16}/></button>
                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditZone(null)}><X size={16}/></button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <h3 className="title" style={{ fontSize: '1.25rem' }}>{z.name}</h3>
                              <p className="subtitle">{z.tables.length} mesas configuradas</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end" onClick={e => e.stopPropagation()}>
                              <ToggleActiveBtn active={z.active} onClick={() => updateZone(z.id, { active: !z.active })} />
                              <div className="flex gap-2">
                                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning-color)' }} onClick={() => setEditZone({ id: z.id, data: { ...z } })}><Edit2 size={16}/></button>
                                <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => deleteZone(z.id)}><Trash2 size={16}/></button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="animate-fade-in flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setSelectedAdminZone(null)}>Zonas</button>
                    <ChevronRight size={16} className="text-secondary" />
                    <h2 className="title text-primary-color">{zones.find(z => z.id === selectedAdminZone.id)?.name}</h2>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {zones.find(z => z.id === selectedAdminZone.id)?.tables.map((tableName, i) => (
                      <div 
                        key={i} 
                        className="card flex flex-col items-center justify-center relative" 
                        style={{ aspectRatio: '1', padding: '1rem' }}
                      >
                        <button 
                          className="btn btn-outline" 
                          style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem', color: 'var(--danger-color)', borderColor: 'transparent' }}
                          onClick={() => handleDeleteTableFromZone(zones.find(z => z.id === selectedAdminZone.id), i)}
                          title="Eliminar Mesa"
                        >
                          <X size={14} />
                        </button>
                        <input 
                          type="text" 
                          className="input w-full text-center" 
                          style={{ fontSize: '1.2rem', fontWeight: 600, backgroundColor: 'transparent', border: 'none', borderBottom: '2px dashed var(--border-color)', borderRadius: 0, padding: '0.5rem 0' }}
                          defaultValue={tableName}
                          onBlur={(e) => handleUpdateTableName(zones.find(z => z.id === selectedAdminZone.id), i, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        />
                      </div>
                    ))}
                    
                    <div 
                      className="card card-interactive flex flex-col items-center justify-center" 
                      style={{ aspectRatio: '1', border: '2px dashed var(--primary-color)', backgroundColor: 'transparent' }}
                      onClick={() => handleAddTableToZone(zones.find(z => z.id === selectedAdminZone.id))}
                    >
                      <Plus size={40} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
                      <span className="subtitle" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Añadir Mesa</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AUDITORÍA */}
          {activeTab === 'auditoria' && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 className="title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={20} /> Historial de Auditoría</h2>
                  <button className="btn btn-outline" onClick={exportAuditCSV}><Download size={15} /> Exportar CSV</button>
                </div>
                
                <input 
                  type="text" 
                  className="input w-full mb-4" 
                  placeholder="Buscar por acción, usuario o detalle..." 
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                />
                
                <div className="table-responsive">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Acción</th>
                        <th>Usuario (Rol)</th>
                        <th>Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.filter(log => 
                        Object.values(log).some(v => String(v).toLowerCase().includes(auditSearch.toLowerCase())) ||
                        JSON.stringify(log.details).toLowerCase().includes(auditSearch.toLowerCase())
                      ).map((log, i) => (
                        <tr key={i}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td><span className="badge">{log.action}</span></td>
                          <td>{log.user} ({log.role})</td>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(log.details, null, 2)}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay registros de auditoría.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EMPRESAS */}
          {activeTab === 'empresas' && (
            <div className="animate-fade-in">
              <div className="card mb-6">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={20} /> Agregar Empresa Facturadora</h2>
                <form onSubmit={handleAddCompany} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: '2 1 200px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Razón Social *</label>
                    <input className="input mt-1 w-full" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value.toUpperCase()})} placeholder="EMPRESA S.A.C." required />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>RUC *</label>
                    <input className="input mt-1 w-full" value={newCompany.ruc} onChange={e => setNewCompany({...newCompany, ruc: e.target.value.replace(/\D/g, '').slice(0,11)})} placeholder="20XXXXXXXXX" maxLength={11} required />
                  </div>
                  <div style={{ flex: '2 1 200px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Dirección</label>
                    <input className="input mt-1 w-full" value={newCompany.address} onChange={e => setNewCompany({...newCompany, address: e.target.value})} placeholder="Av. Principal 123" />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Serie Boleta</label>
                    <input className="input mt-1 w-full" value={newCompany.boletaSeries} onChange={e => setNewCompany({...newCompany, boletaSeries: e.target.value.toUpperCase().slice(0,4)})} placeholder="B001" maxLength={4} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label className="subtitle" style={{ fontSize: '0.875rem' }}>Serie Factura</label>
                    <input className="input mt-1 w-full" value={newCompany.facturaSeries} onChange={e => setNewCompany({...newCompany, facturaSeries: e.target.value.toUpperCase().slice(0,4)})} placeholder="F001" maxLength={4} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/> Agregar</button>
                </form>
              </div>

              <div className="card">
                <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Empresas Registradas</h2>
                {companies.length === 0 ? (
                  <p className="subtitle" style={{ textAlign: 'center', padding: '2rem' }}>No hay empresas registradas aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {companies.map(c => (
                      <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1rem', position: 'relative' }}>
                        {editCompany?.id === c.id ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: '2 1 180px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Razón Social</label>
                              <input className="input mt-1 w-full" value={editCompany.data.name} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, name: e.target.value.toUpperCase()}})} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>RUC</label>
                              <input className="input mt-1 w-full" value={editCompany.data.ruc} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, ruc: e.target.value.replace(/\D/g,'').slice(0,11)}})} maxLength={11} />
                            </div>
                            <div style={{ flex: '2 1 180px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Dirección</label>
                              <input className="input mt-1 w-full" value={editCompany.data.address || ''} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, address: e.target.value}})} />
                            </div>
                            <div style={{ flex: '1 1 80px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Serie Boleta</label>
                              <input className="input mt-1 w-full" value={editCompany.data.boletaSeries || 'B001'} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, boletaSeries: e.target.value.toUpperCase().slice(0,4)}})} maxLength={4} />
                            </div>
                            <div style={{ flex: '1 1 80px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Nº Boleta</label>
                              <input type="number" className="input mt-1 w-full" value={editCompany.data.boletaNumber || 0} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, boletaNumber: parseInt(e.target.value)||0}})} />
                            </div>
                            <div style={{ flex: '1 1 80px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Serie Factura</label>
                              <input className="input mt-1 w-full" value={editCompany.data.facturaSeries || 'F001'} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, facturaSeries: e.target.value.toUpperCase().slice(0,4)}})} maxLength={4} />
                            </div>
                            <div style={{ flex: '1 1 80px' }}>
                              <label className="subtitle" style={{ fontSize: '0.78rem' }}>Nº Factura</label>
                              <input type="number" className="input mt-1 w-full" value={editCompany.data.facturaNumber || 0} onChange={e => setEditCompany({...editCompany, data: {...editCompany.data, facturaNumber: parseInt(e.target.value)||0}})} />
                            </div>
                            <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={saveEditCompany}><Save size={16}/></button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setEditCompany(null)}><X size={16}/></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</h3>
                                <ToggleActiveBtn active={c.active !== false} onClick={() => updateCompany(c.id, { active: !(c.active !== false) })} />
                              </div>
                              <p className="subtitle" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>RUC: <strong>{c.ruc}</strong>{c.address ? ` • ${c.address}` : ''}</p>
                              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Boleta: <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{c.boletaSeries || 'B001'}-{String((c.boletaNumber||0)+1).padStart(8,'0')}</span> (siguiente)</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Factura: <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{c.facturaSeries || 'F001'}-{String((c.facturaNumber||0)+1).padStart(8,'0')}</span> (siguiente)</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditCompany({ id: c.id, data: { ...c } })}><Edit2 size={15}/></button>
                              <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => { if(window.confirm('¿Eliminar empresa?')) deleteCompany(c.id); }}><Trash2 size={15}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Admin Auth Modal for Close Day */}
      {showCloseDayModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '400px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="title flex items-center gap-2 text-danger"><Lock size={20}/> Confirmar Cierre de Día</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setShowCloseDayModal(false)}><X size={16}/></button>
            </div>
            <p className="subtitle mb-4">Ingresa el efectivo físico en caja y tu contraseña para proceder con el cierre.</p>
            
            {closeDayError && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginBottom: '1rem' }}>{closeDayError}</p>}
            
            <form onSubmit={handleCloseDayConfirm} className="flex flex-col gap-4">
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Efectivo en Caja (S/)</label>
                <input type="number" step="0.01" className="input mt-1 w-full" value={closeDayDeclaredCash} onChange={e => setCloseDayDeclaredCash(e.target.value)} required autoFocus style={{ fontSize: '1.2rem', fontWeight: 'bold' }} />
              </div>
              <div>
                <label className="subtitle" style={{ fontSize: '0.875rem' }}>Contraseña de Administrador</label>
                <input type="password" className="input mt-1 w-full" value={closeDayPassword} onChange={e => setCloseDayPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn justify-center" style={{ backgroundColor: 'var(--danger-color)', color: 'white', marginTop: '1rem', padding: '0.75rem' }}>Confirmar y Cerrar Día</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
