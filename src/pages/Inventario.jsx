import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAlert } from '../context/AlertContext';
import { Package, ScanBarcode, Barcode, Plus, Save, Printer, ArrowLeft, RefreshCw, Camera, ArrowDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import CustomCreatableSelect from '../components/CustomCreatableSelect';
import { QRCodeSVG } from 'qrcode.react';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function Inventario() {
  const { showAlert } = useAlert();
  const { getAuthHeaders, developerSettings, currentUser } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'catalog', 'batches'
  
  const [catalog, setCatalog] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeForm, setConsumeForm] = useState({ product_barcode: '', quantity: 1, reason: 'MERMA / DESPERDICIO' });

  const [catalogForm, setCatalogForm] = useState({ barcode: '', name: '', category: 'General', unit_of_measure: 'UNIDAD', min_stock_alert: 10, has_expiration: true });
  const [batchForm, setBatchForm] = useState({ product_barcode: '', batch_number: '', initial_quantity: '', expiration_date: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [catRes, batRes] = await Promise.all([
        fetch('/api/inventory/catalog', { headers: getAuthHeaders() }),
        fetch('/api/inventory/batches', { headers: getAuthHeaders() })
      ]);
      if (catRes.ok) setCatalog(await catRes.json());
      if (batRes.ok) setBatches(await batRes.json());
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar el inventario', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(catalogForm)
      });
      if (res.ok) {
        showAlert('Producto registrado correctamente', 'success');
        setShowCatalogModal(false);
        fetchInventory();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Server error:', errData);
        showAlert(`Error: ${errData.message || res.statusText}`, 'error');
      }
    } catch (e) {
      console.error('Fetch exception:', e);
      showAlert('Error al registrar producto: ' + e.message, 'error');
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...batchForm,
        initial_quantity: parseFloat(batchForm.initial_quantity)
      };
      if (!payload.batch_number) payload.batch_number = `LOTE-${Date.now()}`;

      const res = await fetch('/api/inventory/batches/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showAlert('Lote recibido correctamente', 'success');
        setShowBatchModal(false);
        fetchInventory();
      }
    } catch (e) {
      showAlert('Error al recibir lote', 'error');
    }
  };

  const generateInternalBarcode = () => {
    const code = `INT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setCatalogForm(prev => ({ ...prev, barcode: code }));
  };

  const handleConsume = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/fefo-consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          items: [{ barcode: consumeForm.product_barcode, qty: parseFloat(consumeForm.quantity) }],
          trigger: 'MANUAL_OUT',
          reference_id: consumeForm.reason,
          user: currentUser?.username || 'Sistema'
        })
      });
      if (res.ok) {
        showAlert('Salida registrada correctamente', 'success');
        setShowConsumeModal(false);
        fetchInventory();
      } else {
        showAlert('Error al registrar salida', 'error');
      }
    } catch (e) {
      showAlert('Error de conexión', 'error');
    }
  };

  const handlePrintBarcode = (item) => {
    setPrintData(item);
    setShowPrintModal(true);
  };

  const triggerRealPrint = () => {
    // Basic local printing (opens browser print dialog for the QR code)
    window.print();
  };

  const stockMap = useMemo(() => {
    const map = {};
    catalog.forEach(c => {
      map[c.barcode] = { ...c, total_stock: 0, active_batches: 0, earliest_expiration: null };
    });
    batches.forEach(b => {
      if (b.status === 'ACTIVE' && map[b.product_barcode]) {
        map[b.product_barcode].total_stock += b.current_quantity;
        map[b.product_barcode].active_batches += 1;
        
        const expDate = new Date(b.expiration_date);
        const currEarliest = map[b.product_barcode].earliest_expiration ? new Date(map[b.product_barcode].earliest_expiration) : null;
        if (!currEarliest || expDate < currEarliest) {
          map[b.product_barcode].earliest_expiration = b.expiration_date;
        }
      }
    });
    return Object.values(map);
  }, [catalog, batches]);

  const handleScan = (decodedText) => {
    if (scannerTarget === 'catalog') {
      setCatalogForm({ ...catalogForm, barcode: decodedText });
    } else if (scannerTarget === 'batch') {
      setBatchForm({ ...batchForm, product_barcode: decodedText });
    } else if (scannerTarget === 'consume') {
      setConsumeForm({ ...consumeForm, product_barcode: decodedText });
    }
    setShowScanner(false);
    setScannerTarget(null);
  };

  return (
    <div className="layout print:bg-white" style={{ background: 'var(--bg-gradient)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="print:hidden">
        <PageHeader 
          icon={<Package />}
          title="Almacén e Inventario"
          subtitle="Gestión de Lotes y Descuento FEFO"
          actions={
            <>
              <button className="btn btn-outline flex items-center gap-2" onClick={fetchInventory} disabled={loading}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Actualizar
              </button>
              <button className="btn btn-outline flex items-center gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Volver
              </button>
            </>
          }
        />
      </div>

      <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto print:hidden">
              {/* TABS */}
        <div className="flex gap-2 mb-6 border-b pb-4 border-[var(--border-color)]">
          <button 
            className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('stock')}
          >
            Stock Real (Consolidado)
          </button>
          <button 
            className={`btn ${activeTab === 'batches' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('batches')}
          >
            Lotes y Vencimientos
          </button>
          <button 
            className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('catalog')}
          >
            Catálogo Maestro
          </button>
        </div>

        {/* TAB CONTENT: STOCK */}
        {activeTab === 'stock' && (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {stockMap.map(item => {
              const isLow = item.total_stock <= item.min_stock_alert;
              return (
                <div key={item.barcode} className="card relative p-4 flex flex-col gap-3" style={{ borderTop: isLow ? '3px solid var(--danger-color)' : '3px solid var(--success-color)' }}>
                  {isLow && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: 'var(--danger-color)', color: '#fff' }}>
                      STOCK BAJO
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{item.category}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Stock Actual</p>
                      <p className="text-2xl font-bold" style={{ color: isLow ? 'var(--danger-color)' : 'var(--success-color)' }}>
                        {item.total_stock} <span className="text-sm font-normal">{item.unit_of_measure}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Lotes Activos</p>
                      <p className="font-bold">{item.active_batches}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {stockMap.length === 0 && (
              <div className="col-span-full p-8 text-center text-[var(--text-secondary)] card border-dashed">No hay inventario registrado.</div>
            )}
          </div>

        )}

        {/* TAB CONTENT: BATCHES */}
        {activeTab === 'batches' && (
          <div>
            <div className="flex justify-end mb-4 gap-2">
              <button className="btn btn-outline flex items-center gap-2" onClick={() => {
                setConsumeForm({ product_barcode: '', quantity: 1, reason: 'MERMA / DESPERDICIO' });
                setShowConsumeModal(true);
              }}>
                <ArrowDown size={18} /> Registrar Salida
              </button>
              <button className="btn btn-primary flex items-center gap-2" onClick={() => {
                setBatchForm({ product_barcode: catalog.length > 0 ? catalog[0].barcode : '', batch_number: '', initial_quantity: '', expiration_date: '' });
                setShowBatchModal(true);
              }}>
                <Plus size={18} /> Recibir Lote
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {batches.filter(b => b.status === 'ACTIVE').map(batch => {
                const catInfo = catalog.find(c => c.barcode === batch.product_barcode);
                const isNearExp = (new Date(batch.expiration_date) - new Date()) < 7 * 24 * 60 * 60 * 1000;
                
                return (
                  <div key={batch._id || batch.batch_number} className="card p-4 relative flex flex-col" style={{ borderTop: isNearExp ? '3px solid var(--warning-color)' : '3px solid var(--primary-color)' }}>
                    {isNearExp && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: 'var(--warning-color)', color: '#000' }}>
                        POR VENCER
                      </span>
                    )}
                    <h3 className="font-bold text-lg mb-1 pr-16">{catInfo ? catInfo.name : batch.product_barcode}</h3>
                    <p className="text-sm font-mono text-[var(--primary-color)] mb-3">{batch.batch_number}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div>
                        <p className="text-[var(--text-secondary)] text-xs">Vencimiento</p>
                        <p className="font-bold">{new Date(batch.expiration_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-secondary)] text-xs">Cant. Restante</p>
                        <p className="font-bold text-lg">{batch.current_quantity}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {batches.filter(b => b.status === 'ACTIVE').length === 0 && (
                <div className="col-span-full p-8 text-center text-[var(--text-secondary)] card border-dashed">No hay lotes registrados.</div>
              )}
            </div>

          </div>
        )}

        {/* TAB CONTENT: CATALOG */}
        {activeTab === 'catalog' && (
          <div>
            <div className="flex justify-end mb-4">
              <button className="btn btn-primary flex items-center gap-2" onClick={() => {
                setCatalogForm({ barcode: '', name: '', category: 'General', unit_of_measure: 'UNIDAD', min_stock_alert: 10, has_expiration: true });
                setShowCatalogModal(true);
              }}>
                <Plus size={18} /> Nuevo Producto
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {catalog.map(item => (
                <div key={item.barcode} className="card p-4 flex flex-col relative" style={{ borderTop: '3px solid var(--text-secondary)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight pr-8">{item.name}</h3>
                    <button onClick={() => handlePrintBarcode(item)} className="p-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors absolute top-3 right-3" title="Imprimir Etiqueta">
                       <Printer size={16} />
                    </button>
                  </div>
                  
                  <p className="text-sm text-[var(--primary-color)] mb-4">{item.category}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Código</p>
                      <p className="font-mono text-xs mt-1 truncate" title={item.barcode}>{item.barcode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-secondary)]">Medida</p>
                      <p className="font-bold mt-1">{item.unit_of_measure}</p>
                    </div>
                  </div>
                </div>
              ))}
              {catalog.length === 0 && (
                <div className="col-span-full p-8 text-center text-[var(--text-secondary)] card border-dashed">El catálogo está vacío.</div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODALS (Print Hidden) */}
      <div className="print:hidden">
        {showCatalogModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', position: 'relative' }}>
              <h2 className="text-xl font-bold mb-4">Registrar Producto</h2>
              <form onSubmit={handleSaveCatalog} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-[var(--text-secondary)]">Código de Barras</label>
                  <div className="flex gap-2">
                    <input type="text" className="input flex-1" value={catalogForm.barcode} onChange={e => setCatalogForm({...catalogForm, barcode: e.target.value})} required placeholder="Escanea o escribe el código" />
                    <button type="button" className="btn btn-outline flex items-center gap-1" onClick={() => { setScannerTarget('catalog'); setShowScanner(true); }} title="Escanear con cámara">
                      <Camera size={18} />
                    </button>
                    <button type="button" className="btn btn-outline flex items-center gap-1" onClick={generateInternalBarcode} title="Generar código interno para insumos sin código">
                      <Barcode size={18} /> Generar
                    </button>
                    {catalogForm.barcode && (
                      <button type="button" className="btn btn-primary flex items-center gap-1" onClick={() => handlePrintBarcode(catalogForm)} title="Imprimir etiqueta">
                        <Printer size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--text-secondary)]">Nombre del Producto</label>
                  <input type="text" className="input w-full" value={catalogForm.name} onChange={e => setCatalogForm({...catalogForm, name: e.target.value})} required placeholder="Ej. Pepsi 500ml, Lomo de Res" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-[var(--text-secondary)]">Categoría</label>
                    <CustomCreatableSelect value={catalogForm.category} onChange={v => setCatalogForm({...catalogForm, category: v})} options={Array.from(new Set(catalog.map(c => c.category))).filter(Boolean).map(c => ({value: c, label: c}))} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-[var(--text-secondary)]">Unidad de Medida</label>
                    <CustomCreatableSelect value={catalogForm.unit_of_measure} onChange={v => setCatalogForm({...catalogForm, unit_of_measure: v})} options={Array.from(new Set([...catalog.map(c => c.unit_of_measure), 'UNIDAD', 'KG', 'LITRO', 'PRESA'])).filter(Boolean).map(u => ({value: u, label: u}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--text-secondary)]">Alerta de Stock Mínimo</label>
                  <input type="number" className="input w-full" value={catalogForm.min_stock_alert} onChange={e => setCatalogForm({...catalogForm, min_stock_alert: parseInt(e.target.value)})} required min="0" />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCatalogModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary flex items-center gap-2"><Save size={18}/> Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBatchModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', position: 'relative' }}>
              <h2 className="text-xl font-bold mb-4">Recibir Lote</h2>
              <form onSubmit={handleSaveBatch} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-[var(--text-secondary)]">Producto</label>
                  <div className="flex gap-2">
                    <div style={{ flex: 1 }}>
                      <CustomSelect 
                        value={batchForm.product_barcode}
                        onChange={v => setBatchForm({...batchForm, product_barcode: v})}
                        options={catalog.map(c => ({ value: c.barcode, label: c.name }))}
                      />
                    </div>
                    <button type="button" className="btn btn-outline flex items-center gap-1" onClick={() => { setScannerTarget('batch'); setShowScanner(true); }} title="Escanear con cámara">
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--text-secondary)]">Código de Lote (Opcional)</label>
                  <input type="text" className="input w-full" value={batchForm.batch_number} onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})} placeholder="Se generará uno automático si se deja en blanco" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-[var(--text-secondary)]">Cantidad a Recibir</label>
                    <input type="number" step="0.01" className="input w-full" value={batchForm.initial_quantity} onChange={e => setBatchForm({...batchForm, initial_quantity: e.target.value})} required min="0.01" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-[var(--text-secondary)]">Fecha de Vencimiento</label>
                    <input type="date" className="input w-full" value={batchForm.expiration_date} onChange={e => setBatchForm({...batchForm, expiration_date: e.target.value})} required />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="btn btn-outline" onClick={() => setShowBatchModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary flex items-center gap-2"><Save size={18}/> Guardar Lote</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPrintModal && printData && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', position: 'relative' }}>
              <h2 className="text-xl font-bold mb-2">Imprimir Etiqueta Interna</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Genera un código QR para que tu personal pueda escanear este producto durante la operación.</p>
              
              <div className="bg-white p-6 rounded-xl inline-block border shadow-sm mb-6 print-section-only" id="printable-label">
                <div className="font-bold text-black text-lg mb-2">{printData.name}</div>
                <QRCodeSVG value={printData.barcode} size={150} className="mx-auto" />
                <div className="font-mono text-black text-sm mt-2">{printData.barcode}</div>
                <div className="text-black text-xs mt-1">{printData.category} - Venta por {printData.unit_of_measure}</div>
              </div>

              <div className="flex justify-center gap-3">
                <button type="button" className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Cerrar</button>
                <button type="button" className="btn btn-primary flex items-center gap-2" onClick={triggerRealPrint}><Printer size={18}/> Imprimir Etiqueta</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STYLES FOR PRINTING SPECIFICALLY THE LABEL */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label, #printable-label * {
            visibility: visible;
          }
          #printable-label {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>

      {showConsumeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)' }}>
            <h2 className="text-xl font-bold mb-6">Registrar Salida / Merma</h2>
            <form onSubmit={handleConsume} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1 text-[var(--text-secondary)]">Producto</label>
                <div className="flex gap-2">
                  <select className="input flex-1" value={consumeForm.product_barcode} onChange={e => setConsumeForm({...consumeForm, product_barcode: e.target.value})} required>
                    <option value="">Seleccione un producto...</option>
                    {catalog.map(c => <option key={c.barcode} value={c.barcode}>{c.name} ({c.barcode})</option>)}
                  </select>
                  <button type="button" className="btn btn-outline p-0 w-12 flex items-center justify-center" onClick={() => { setScannerTarget('consume'); setShowScanner(true); }}>
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--text-secondary)]">Cantidad a retirar</label>
                <input type="number" step="0.01" min="0.01" className="input w-full" value={consumeForm.quantity} onChange={e => setConsumeForm({...consumeForm, quantity: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--text-secondary)]">Motivo (Referencia)</label>
                <CustomCreatableSelect value={consumeForm.reason} onChange={v => setConsumeForm({...consumeForm, reason: v})} options={[{value: 'MERMA / DESPERDICIO', label: 'MERMA / DESPERDICIO'},{value: 'TRASPASO A BARRA', label: 'TRASPASO A BARRA'},{value: 'TRASPASO A COCINA', label: 'TRASPASO A COCINA'},{value: 'VENCIMIENTO', label: 'VENCIMIENTO'},{value: 'USO INTERNO', label: 'USO INTERNO'}]} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowConsumeModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save size={18} /> Registrar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScannerModal 
          onScan={handleScan} 
          onClose={() => {
            setShowScanner(false);
            setScannerTarget(null);
          }} 
        />
      )}
    </div>
  );
}
