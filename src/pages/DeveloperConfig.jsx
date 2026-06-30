import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Lock, Settings, Database, Trash2, Power, Server, Shield, Users, MapPin, Cloud, HardDrive, RefreshCw, FileText, AlertTriangle, Eye, EyeOff, Printer, LayoutDashboard } from 'lucide-react';

export default function DeveloperConfig() {
  const navigate = useNavigate();
  const { developerSettings, setDeveloperSettings, locations, users, orders, setOrders, setPastDays, setBusinessDay, pastDays, companies } = useStore();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Secure Billing States
  const [secureBilling, setSecureBilling] = useState({});
  const [selectedBillingCompany, setSelectedBillingCompany] = useState('');
  const [companyCreds, setCompanyCreds] = useState({ provider: 'Vercel API', usuarioSOL: '', claveSOL: '', certificado: '' });
  const [showClave, setShowClave] = useState(false);
  const [billingSavedMsg, setBillingSavedMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/store/secure/billing')
        .then(res => res.json())
        .then(data => setSecureBilling(data || {}))
        .catch(err => console.error('Error fetching secure billing:', err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedBillingCompany && secureBilling[selectedBillingCompany]) {
      setCompanyCreds(secureBilling[selectedBillingCompany]);
    } else {
      setCompanyCreds({ provider: 'Vercel API', usuarioSOL: '', claveSOL: '', certificado: '' });
    }
    setBillingSavedMsg('');
  }, [selectedBillingCompany, secureBilling]);

  const handleSaveBilling = async () => {
    if (!selectedBillingCompany) return;
    const newSecureBilling = { ...secureBilling, [selectedBillingCompany]: companyCreds };
    setSecureBilling(newSecureBilling);
    try {
      await fetch('/api/store/secure/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSecureBilling)
      });
      setBillingSavedMsg('¡Guardado!');
      setTimeout(() => setBillingSavedMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setBillingSavedMsg('Error al guardar');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'devmaster2026') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Clave maestra incorrecta');
    }
  };

  const handleToggleIncognito = () => {
    setDeveloperSettings(prev => ({
      ...prev,
      isSuperAdminIncognito: !prev.isSuperAdminIncognito
    }));
  };

  const handleToggleMetricsBI = () => {
    setDeveloperSettings(prev => ({
      ...prev,
      metricsOnlySuperAdmin: !prev.metricsOnlySuperAdmin
    }));
  };

  const handleToggleBillingMode = () => {
    setDeveloperSettings(prev => ({
      ...prev,
      billingMode: prev.billingMode === 'production' ? 'test' : 'production'
    }));
  };

  const handleToggleAdminModule = (moduleKey) => {
    setDeveloperSettings(prev => ({
      ...prev,
      adminModules: {
        ...(prev.adminModules || {}),
        [moduleKey]: !(prev.adminModules || {})[moduleKey]
      }
    }));
  };

  const [selectedPrinterLocation, setSelectedPrinterLocation] = useState('');

  useEffect(() => {
    if (locations.length > 0 && !selectedPrinterLocation) {
      setSelectedPrinterLocation(locations[0].id);
    }
  }, [locations, selectedPrinterLocation]);

  const handlePrinterIdChange = (key, value) => {
    if (!selectedPrinterLocation) return;
    setDeveloperSettings(prev => {
      const currentIds = prev.printerIds || {};
      const locIds = currentIds[selectedPrinterLocation] || { caja: '', barra: '', cocina: '' };
      return {
        ...prev,
        printerIds: {
          ...currentIds,
          [selectedPrinterLocation]: {
            ...locIds,
            [key]: value
          }
        }
      };
    });
  };

  const adminModuleLabels = {
    metrics: 'Business Intelligence (BI)',
    caja: 'Caja y Reportes',
    users: 'Usuarios',
    crm: 'CRM y Fidelización',
    categories: 'Categorías',
    subcategories: 'Subcategorías',
    menu: 'Platos / Menú',
    kardex_config: 'Insumos Kardex',
    zones: 'Zonas y Mesas',
    empresas: 'Empresas (Facturación)',
    auditoria: 'Auditoría',
    locales: 'Locales / Sedes (Solo SuperAdmin)'
  };

  const [showToken, setShowToken] = useState(false);
  const [storageSize, setStorageSize] = useState('Calculando...');

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      setStorageSize((total / 1024).toFixed(2) + ' KB');
    } catch(e) {
      setStorageSize('No disponible');
    }
  }, [isAuthenticated]);

  const handleClearTestHistory = () => {
    if (window.confirm('🚨 ¡CUIDADO! 🚨\nEsto borrará permanentemente todo el historial de pedidos, caja y kardex (Días Pasados) de LA SEDE ACTUAL.\n\n¿Deseas continuar y dejar la base de datos en blanco para iniciar producción?')) {
      setPastDays([]);
      setOrders([]);
      setBusinessDay({ isOpen: false, startTime: null, totalSales: 0, voids: [], sales: [] });
      alert('✅ Historial de pruebas eliminado con éxito. El sistema está limpio.');
    }
  };

  const handleClearSessions = () => {
    if (window.confirm('¿Estás seguro de forzar el cierre de todas las sesiones locales? Esto borrará el localStorage en este dispositivo.')) {
      localStorage.removeItem('currentUserData');
      localStorage.removeItem('currentLocationId');
      localStorage.removeItem('lastRole');
      alert('Sesiones borradas.');
      navigate('/');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '3rem', backgroundColor: '#111', border: '1px solid #333' }}>
          <div className="flex justify-center mb-6">
            <Server size={48} style={{ color: '#00ffcc' }} />
          </div>
          <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff', textAlign: 'center' }}>Developer Access</h1>
          <p className="subtitle" style={{ fontSize: '0.875rem', marginBottom: '2rem', textAlign: 'center', color: '#888' }}>Ingresa la clave maestra del sistema</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input 
                  type="password" 
                  className="input" 
                  placeholder="Master Key" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem', backgroundColor: '#000', color: '#00ffcc', border: '1px solid #333', fontFamily: 'monospace' }}
                  autoFocus
                />
              </div>
            </div>
            {error && <p style={{ color: '#ff4444', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#00ffcc', color: '#000', fontWeight: 'bold' }}>
              Desbloquear Panel
            </button>
            <button type="button" className="btn btn-outline" style={{ borderColor: '#333', color: '#666' }} onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          <h1 className="title flex items-center gap-3" style={{ color: '#00ffcc', fontSize: '1.75rem' }}>
            <Server size={28} /> System Config [DEV]
          </h1>
          <button className="btn btn-outline" style={{ borderColor: '#333', color: '#888' }} onClick={() => navigate('/')}>
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
          
          {/* Card 1: Seguridad y Enrutamiento */}
          <div className="card" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <Shield size={18} style={{ color: '#00ffcc' }} /> Seguridad y Enrutamiento
            </h2>
            <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Modo Incógnito Super Admin</p>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>Bloquea la ruta /super-admin y enmascara los inicios de sesión globales.</p>
              </div>
              <button 
                onClick={handleToggleIncognito}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  backgroundColor: developerSettings.isSuperAdminIncognito ? '#00ffcc' : '#333',
                  color: developerSettings.isSuperAdminIncognito ? '#000' : '#888'
                }}
              >
                {developerSettings.isSuperAdminIncognito ? 'ACTIVADO' : 'APAGADO'}
              </button>
            </div>

            <div className="flex justify-between items-center p-3 rounded mt-3" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Restringir BI a Super Admin</p>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>Oculta la pestaña de Analíticas BI a los administradores locales.</p>
              </div>
              <button 
                onClick={handleToggleMetricsBI}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  backgroundColor: developerSettings.metricsOnlySuperAdmin ? '#00ffcc' : '#333',
                  color: developerSettings.metricsOnlySuperAdmin ? '#000' : '#888'
                }}
              >
                {developerSettings.metricsOnlySuperAdmin ? 'ACTIVADO' : 'APAGADO'}
              </button>
            </div>
          </div>

          {/* Card 2: Mantenimiento */}
          <div className="card" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <Settings size={18} style={{ color: '#ff4444' }} /> Mantenimiento Local
            </h2>
            <div className="flex flex-col gap-3">
              <button className="btn btn-outline flex items-center justify-center gap-2" style={{ borderColor: '#ff4444', color: '#ff4444' }} onClick={handleClearSessions}>
                <Power size={16} /> Forzar Cierre de Sesiones (LocalStorage)
              </button>
            </div>
          </div>

          {/* Card 3: Estado DB */}
          <div className="card md-col-span-2" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <Database size={18} style={{ color: '#44aaff' }} /> Estado de la Base de Datos (En Memoria)
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div style={{ backgroundColor: '#000', padding: '1rem', borderRadius: '8px', border: '1px solid #222', textAlign: 'center' }}>
                <MapPin size={24} style={{ color: '#44aaff', margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{locations.length}</p>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>Sedes Activas</p>
              </div>
              <div style={{ backgroundColor: '#000', padding: '1rem', borderRadius: '8px', border: '1px solid #222', textAlign: 'center' }}>
                <Users size={24} style={{ color: '#44aaff', margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{users.length}</p>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>Usuarios Totales</p>
              </div>
              <div style={{ backgroundColor: '#000', padding: '1rem', borderRadius: '8px', border: '1px solid #222', textAlign: 'center' }}>
                <Database size={24} style={{ color: '#44aaff', margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orders.length}</p>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>Pedidos Históricos</p>
              </div>
            </div>
          </div>

          {/* Card 4: Facturación y APIs Externas */}
          <div className="card md-col-span-1" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <Cloud size={18} style={{ color: '#ffb84d' }} /> API de Facturación Externa
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Entorno de API</p>
                  <p style={{ fontSize: '0.75rem', color: developerSettings.billingMode === 'production' ? '#00ffcc' : '#ffb84d' }}>
                    {developerSettings.billingMode === 'production' ? 'PRODUCCIÓN (SUNAT)' : 'PRUEBAS (Sandbox)'}
                  </p>
                </div>
                <button 
                  onClick={handleToggleBillingMode}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                    backgroundColor: '#333', color: '#fff'
                  }}
                >
                  Cambiar
                </button>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#ffb84d' }}>Credenciales (Bóveda Segura)</p>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#888' }}>Seleccionar Empresa</label>
                  <select 
                    className="input w-full"
                    style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', marginTop: '0.2rem' }}
                    value={selectedBillingCompany}
                    onChange={(e) => setSelectedBillingCompany(e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    {(companies || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.ruc})</option>
                    ))}
                  </select>
                </div>

                {selectedBillingCompany && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#888' }}>Proveedor API</label>
                      <select 
                        className="input w-full"
                        style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', marginTop: '0.2rem' }}
                        value={companyCreds.provider}
                        onChange={(e) => setCompanyCreds({...companyCreds, provider: e.target.value})}
                      >
                        <option value="Vercel API">API Vercel Propia</option>
                        <option value="Nubefact">Nubefact</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#888' }}>Usuario SOL</label>
                      <input 
                        type="text"
                        className="input w-full"
                        placeholder="Ej. MODDATOS"
                        value={companyCreds.usuarioSOL || ''}
                        onChange={(e) => setCompanyCreds({...companyCreds, usuarioSOL: e.target.value})}
                        style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', marginTop: '0.2rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#888' }}>Clave SOL</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showClave ? 'text' : 'password'}
                          className="input w-full"
                          placeholder="••••••••"
                          value={companyCreds.claveSOL || ''}
                          onChange={(e) => setCompanyCreds({...companyCreds, claveSOL: e.target.value})}
                          style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', marginTop: '0.2rem', paddingRight: '2.5rem' }}
                        />
                        <button 
                          onClick={() => setShowClave(!showClave)}
                          style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-30%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                          {showClave ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#888' }}>Certificado (Base64) o Token API</label>
                      <textarea 
                        className="input w-full"
                        placeholder="eyJhbGci..."
                        rows={3}
                        value={companyCreds.certificado || ''}
                        onChange={(e) => setCompanyCreds({...companyCreds, certificado: e.target.value})}
                        style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', marginTop: '0.2rem', fontFamily: 'monospace', fontSize: '0.7rem' }}
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <button className="btn btn-primary" onClick={handleSaveBilling} style={{ flex: 1, padding: '0.5rem' }}>
                        Guardar Credenciales
                      </button>
                      {billingSavedMsg && <span style={{ color: '#00ffcc', fontSize: '0.8rem', fontWeight: 'bold' }}>{billingSavedMsg}</span>}
                    </div>
                  </>
                )}
                {!selectedBillingCompany && (
                  <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '1rem' }}>Seleccione una empresa para gestionar sus credenciales de forma segura.</p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Control de Módulos (Feature Flags) */}
          <div className="card md-col-span-2" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <LayoutDashboard size={18} style={{ color: '#ff44ff' }} /> Control de Módulos del Administrador (Feature Flags)
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Desactiva los módulos que no uses. Se ocultarán para todos los roles (incluyendo SuperAdmin).</p>
            <div className="grid grid-cols-1 md-grid-cols-2 gap-3">
              {Object.entries(adminModuleLabels).map(([key, label]) => {
                const isActive = developerSettings.adminModules?.[key] !== false; // Default true
                return (
                  <div key={key} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                    <span style={{ fontSize: '0.85rem', color: isActive ? '#fff' : '#666' }}>{label}</span>
                    <button 
                      onClick={() => handleToggleAdminModule(key)}
                      style={{
                        padding: '0.3rem 0.6rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem',
                        backgroundColor: isActive ? '#00ffcc' : '#333', color: isActive ? '#000' : '#888'
                      }}
                    >
                      {isActive ? 'ACTIVO' : 'OCULTO'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Configuración de Impresoras */}
          <div className="card md-col-span-2" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <Printer size={18} style={{ color: '#00ffcc' }} /> Configuración de Impresoras (Cloud-to-Local)
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Ingresa los IDs de las computadoras (PrintAgents) encargadas de cada área por Sede.</p>
            
            {locations.length > 0 ? (
              <>
                <div className="mb-4">
                  <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>URL del Servidor de Impresión (Socket.io en Render):</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="https://tu-print-server.onrender.com"
                    value={developerSettings.printServerUrl || ''}
                    onChange={(e) => setDeveloperSettings(prev => ({ ...prev, printServerUrl: e.target.value }))}
                    style={{ backgroundColor: '#111', color: '#00ffcc', borderColor: '#333', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>Seleccionar Sede a configurar:</label>
                  <select 
                    className="input w-full md:w-1/2" 
                    value={selectedPrinterLocation} 
                    onChange={(e) => setSelectedPrinterLocation(e.target.value)}
                    style={{ backgroundColor: '#000', color: '#fff', borderColor: '#333' }}
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
                  <div className="p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#00ffcc' }}>Caja (Pre-cuentas)</p>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder="Ej. caja_principal"
                      value={developerSettings.printerIds?.[selectedPrinterLocation]?.caja || ''}
                      onChange={(e) => handlePrinterIdChange('caja', e.target.value)}
                      style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#ffb84d' }}>Barra (Bebidas)</p>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder="Ej. barra_01"
                      value={developerSettings.printerIds?.[selectedPrinterLocation]?.barra || ''}
                      onChange={(e) => handlePrinterIdChange('barra', e.target.value)}
                      style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#ff4444' }}>Cocina (Platos)</p>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder="Ej. cocina_01"
                      value={developerSettings.printerIds?.[selectedPrinterLocation]?.cocina || ''}
                      onChange={(e) => handlePrinterIdChange('cocina', e.target.value)}
                      style={{ backgroundColor: '#111', color: '#fff', borderColor: '#333', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '1rem', fontStyle: 'italic' }}>* Los tickets serán enviados al servidor en Render y escuchados por los PrintAgents configurados con estos IDs.</p>
              </>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#ff4444' }}>No hay sedes creadas. Crea una sede primero en el panel de SuperAdmin.</p>
            )}
          </div>

          {/* Card 5: Almacenamiento y Limpieza */}
          <div className="card md-col-span-1" style={{ backgroundColor: '#111', border: '1px solid #333' }}>
            <h2 className="title flex items-center gap-2 mb-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
              <HardDrive size={18} style={{ color: '#ff44ff' }} /> Estado de Almacenamiento
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: '#000', border: '1px solid #222' }}>
                <div className="flex items-center gap-3">
                  <Database size={24} style={{ color: '#ff44ff' }} />
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Uso de Memoria Local</p>
                    <p style={{ fontSize: '0.75rem', color: '#888' }}>Tamaño estimado del caché LocalStorage</p>
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ffcc' }}>
                  {storageSize}
                </div>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: '#330000', border: '1px solid #ff4444' }}>
                <p className="flex items-center gap-2 font-bold mb-2" style={{ color: '#ff4444' }}><AlertTriangle size={16} /> Danger Zone</p>
                <p style={{ fontSize: '0.75rem', color: '#ffaaaa', marginBottom: '1rem' }}>
                  Elimina permanentemente el historial de pedidos, caja y Kardex (días pasados) de la Sede Actual. Ideal para preparar a producción.
                </p>
                <button className="btn w-full flex justify-center gap-2 items-center" style={{ backgroundColor: '#ff4444', color: '#fff', border: 'none', padding: '0.6rem', fontWeight: 'bold', borderRadius: '8px' }} onClick={handleClearTestHistory}>
                  <Trash2 size={16} /> Limpiar Historial de Pruebas
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
