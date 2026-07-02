import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Receipt, X, AlertTriangle, Eye, Search, FileText, CheckSquare, Square } from 'lucide-react';

const SalesHistory = ({ onViewReceipt }) => {
  const { businessDay, pastDays, voidSaleAndReopenTable, issueCreditNote, users, activeTables, zones } = useStore();
  
  // Modes
  const [searchMode, setSearchMode] = useState('today'); // 'today' | 'historical'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidPin, setVoidPin] = useState('');
  const [voidError, setVoidError] = useState('');
  const [selectedAlternativeTable, setSelectedAlternativeTable] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [saleForCN, setSaleForCN] = useState(null);
  const [cnReason, setCnReason] = useState('');
  const [cnPin, setCnPin] = useState('');
  const [cnError, setCnError] = useState('');
  const [cnItemsSelected, setCnItemsSelected] = useState({}); // { index: true/false }
  const [isIssuingCN, setIsIssuingCN] = useState(false);
  const [cnRefacturar, setCnRefacturar] = useState(false);
  const [cnSelectedAlternativeTable, setCnSelectedAlternativeTable] = useState('');

  const isCnOriginalTableOccupied = saleForCN ? (activeTables[saleForCN.tableKey]?.length > 0) : false;
  const freeTablesCn = [];
  if (isCnOriginalTableOccupied) {
    (zones || []).forEach(z => {
      (z.tables || []).forEach(t => {
        const tKey = `${z.id}-${t}`;
        if (!activeTables[tKey] || activeTables[tKey].length === 0) {
          freeTablesCn.push({ zone: z.name, table: t, key: tKey });
        }
      });
    });
  }

  // Computed Sales
  const historicalSales = useMemo(() => {
    let allSales = [];
    if (pastDays) {
      pastDays.forEach(day => {
        if (day.sales) {
          allSales = [...allSales, ...day.sales];
        }
      });
    }
    return allSales;
  }, [pastDays]);

  const filteredSales = useMemo(() => {
    let baseSales = searchMode === 'today' ? (businessDay?.sales || []) : historicalSales;
    if (!searchQuery) return baseSales;
    
    const q = searchQuery.toLowerCase();
    return baseSales.filter(sale => 
      sale.customerName?.toLowerCase().includes(q) ||
      sale.companyName?.toLowerCase().includes(q) ||
      sale.customerRuc?.includes(q) ||
      sale.companyRuc?.includes(q) ||
      `${sale.documentType === 'boleta' ? 'B' : sale.documentType === 'factura' ? 'F' : 'P'}-${sale.documentNumber}`.toLowerCase().includes(q)
    );
  }, [searchMode, searchQuery, businessDay, historicalSales]);

  // --- VOID LOGIC ---
  const handleOpenVoidModal = (sale) => {
    setSaleToVoid(sale);
    setVoidReason('');
    setVoidPin('');
    setVoidError('');
    setSelectedAlternativeTable('');
    setShowVoidModal(true);
  };

  const isOriginalTableOccupied = saleToVoid ? (activeTables[saleToVoid.tableKey]?.length > 0) : false;
  const freeTables = [];
  if (isOriginalTableOccupied) {
    (zones || []).forEach(z => {
      (z.tables || []).forEach(t => {
        const tKey = `${z.id}-${t}`;
        if (!activeTables[tKey] || activeTables[tKey].length === 0) {
          freeTables.push({ zone: z.name, table: t, key: tKey });
        }
      });
    });
  }

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (isVoiding) return;
    
    const admin = users.find(u => (u.role === 'admin' || u.role === 'superadmin') && String(u.password) === voidPin.trim());
    if (!admin) return setVoidError('PIN incorrecto o sin permisos.');
    if (!voidReason.trim()) return setVoidError('Ingresa un motivo.');
    if (isOriginalTableOccupied && !selectedAlternativeTable) return setVoidError('Selecciona mesa libre.');

    const targetTableKey = isOriginalTableOccupied ? selectedAlternativeTable : null;
    
    setIsVoiding(true);
    setVoidError('');
    try {
      const result = await voidSaleAndReopenTable(saleToVoid.id, voidReason, admin, targetTableKey);
      if (result && !result.success) {
        setVoidError(result.error);
        setIsVoiding(false);
        return;
      }
      setShowVoidModal(false);
    } catch (err) {
      console.error(err);
      setVoidError('Error al procesar la anulación.');
    } finally {
      setIsVoiding(false);
    }
  };

  // --- CREDIT NOTE LOGIC ---
  const handleOpenCreditNote = (sale) => {
    setSaleForCN(sale);
    setCnReason('');
    setCnPin('');
    setCnError('');
    setCnRefacturar(false);
    setCnSelectedAlternativeTable('');
    
    // Select all items by default
    const initialSelected = {};
    (sale.cartItems || []).forEach((_, idx) => initialSelected[idx] = true);
    setCnItemsSelected(initialSelected);
    
    setShowCreditNoteModal(true);
  };

  const toggleCnItem = (idx) => {
    setCnItemsSelected(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const calculateCnTotal = () => {
    if (!saleForCN) return 0;
    return saleForCN.cartItems.reduce((sum, item, idx) => {
      return sum + (cnItemsSelected[idx] ? (item.quantity * item.item.price) : 0);
    }, 0);
  };

  const handleConfirmCreditNote = async (e) => {
    e.preventDefault();
    if (isIssuingCN) return;
    
    const admin = users.find(u => (u.role === 'admin' || u.role === 'superadmin') && String(u.password) === cnPin.trim());
    if (!admin) return setCnError('PIN incorrecto o sin permisos.');
    if (!cnReason.trim()) return setCnError('Ingresa un motivo para la SUNAT.');
    
    if (cnRefacturar && isCnOriginalTableOccupied && !cnSelectedAlternativeTable) {
      return setCnError('Debes seleccionar una mesa libre para cargar los platos.');
    }

    const totalToRefund = calculateCnTotal();
    if (totalToRefund <= 0) return setCnError('Debes seleccionar al menos un plato para devolver.');

    const itemsToRefund = saleForCN.cartItems.filter((_, idx) => cnItemsSelected[idx]);
    const targetTableKey = cnRefacturar && isCnOriginalTableOccupied ? cnSelectedAlternativeTable : null;

    setIsIssuingCN(true);
    setCnError('');
    try {
      const result = await issueCreditNote(saleForCN.id, totalToRefund, itemsToRefund, cnReason, admin, cnRefacturar, targetTableKey);
      if (result && !result.success) {
        setCnError(result.error);
        setIsIssuingCN(false);
        return;
      }
      setShowCreditNoteModal(false);
    } catch (err) {
      console.error(err);
      setCnError('Error al procesar la Nota de Crédito.');
    } finally {
      setIsIssuingCN(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem' };
  const labelStyle = { fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' };

  return (
    <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Receipt size={24} color="var(--primary-color)" /> 
          {searchMode === 'today' ? 'Ventas de Hoy' : 'Buscador Histórico'}
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Buscar DNI, RUC, N°..." 
              style={{ ...inputStyle, paddingLeft: '2.2rem', width: '220px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`btn ${searchMode === 'today' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSearchMode('today')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            Turno Actual
          </button>
          <button 
            className={`btn ${searchMode === 'historical' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSearchMode('historical')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            Histórico (Pasados)
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px dashed var(--border-color)' }}>
          <Search size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No se encontraron comprobantes.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {searchMode === 'historical' && <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FECHA</th>}
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HORA</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DOCUMENTO</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CLIENTE</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredSales].reverse().map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: sale.hasCreditNote ? 0.7 : 1 }}>
                  {searchMode === 'historical' && (
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </td>
                  )}
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    {sale.documentType === 'boleta' ? 'B' : sale.documentType === 'factura' ? 'F' : 'P'}-{sale.documentNumber}
                    {sale.hasCreditNote && <span style={{ display: 'inline-block', marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.1rem 0.3rem', backgroundColor: 'var(--warning-color)', color: '#000', borderRadius: '4px' }}>NC Emitida</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {sale.customerName || sale.companyName || 'Consumidor Final'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--success-color)' }}>
                    S/ {sale.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                      onClick={() => onViewReceipt && onViewReceipt(sale)}
                    >
                      <Eye size={12} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} /> Ver
                    </button>

                    {!sale.hasCreditNote && (
                      <>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: 'var(--warning-color)', borderColor: 'var(--warning-color)' }}
                          onClick={() => handleOpenCreditNote(sale)}
                        >
                          <FileText size={12} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} /> NC
                        </button>
                        
                        {searchMode === 'today' && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                            onClick={() => handleOpenVoidModal(sale)}
                          >
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} /> Anular
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ANULAR */}
      {showVoidModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '350px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.25rem', position: 'relative' }}>
            <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Anular Venta
            </h2>
            <button className="btn btn-outline" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.35rem' }} onClick={() => setShowVoidModal(false)}><X size={15} /></button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Se anulará por completo y regresará a la mesa {saleToVoid?.table}.
            </p>
            <form onSubmit={handleConfirmVoid} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isOriginalTableOccupied && (
                <div>
                  <label style={labelStyle}>Recuperar en Mesa Libre</label>
                  <select style={inputStyle} value={selectedAlternativeTable} onChange={e => setSelectedAlternativeTable(e.target.value)} required>
                    <option value="">-- Selecciona Mesa --</option>
                    {freeTables.map(t => <option key={t.key} value={t.key}>{t.zone} - {t.table}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Motivo</label>
                <input type="text" style={inputStyle} placeholder="Motivo" value={voidReason} onChange={e => setVoidReason(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>PIN Admin</label>
                <input type="password" style={inputStyle} placeholder="****" value={voidPin} onChange={e => setVoidPin(e.target.value)} required />
              </div>
              {voidError && <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{voidError}</div>}
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} disabled={isVoiding}>
                {isVoiding ? 'Procesando...' : 'Confirmar Anulación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOTA DE CRÉDITO */}
      {showCreditNoteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '500px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.5rem', position: 'relative', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> Emitir Nota de Crédito
            </h2>
            <button className="btn btn-outline" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.35rem' }} onClick={() => setShowCreditNoteModal(false)}><X size={15} /></button>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Selecciona qué platos deseas devolver de la Boleta/Factura <strong>{saleForCN?.documentType === 'boleta' ? 'B' : saleForCN?.documentType === 'factura' ? 'F' : 'P'}-{saleForCN?.documentNumber}</strong>.
            </p>

            <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              {(saleForCN?.cartItems || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => toggleCnItem(idx)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {cnItemsSelected[idx] ? <CheckSquare size={16} color="var(--primary-color)"/> : <Square size={16} color="var(--text-secondary)"/>}
                    <span style={{ fontSize: '0.85rem' }}>{item.quantity}x {item.item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>S/ {(item.quantity * item.item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(255, 170, 0, 0.1)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255, 170, 0, 0.2)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--warning-color)' }}>Monto a Devolver:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>S/ {calculateCnTotal().toFixed(2)}</span>
            </div>

            <form onSubmit={handleConfirmCreditNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                <input 
                  type="checkbox" 
                  id="cnRefacturar"
                  checked={cnRefacturar}
                  onChange={e => setCnRefacturar(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                />
                <label htmlFor="cnRefacturar" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cargar platos devueltos a la mesa (Para corregir datos y re-facturar)
                </label>
              </div>

              {cnRefacturar && isCnOriginalTableOccupied && (
                <div>
                  <label style={labelStyle}>Mesa Libre (La Mesa {saleForCN?.table} está ocupada)</label>
                  <select style={inputStyle} value={cnSelectedAlternativeTable} onChange={e => setCnSelectedAlternativeTable(e.target.value)} required>
                    <option value="">-- Selecciona una Mesa para cargar los platos --</option>
                    {freeTablesCn.map(t => <option key={t.key} value={t.key}>{t.zone} - {t.table}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Motivo (SUNAT)</label>
                <input type="text" style={inputStyle} placeholder="Ej. Devolución parcial, Error en RUC..." value={cnReason} onChange={e => setCnReason(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>PIN Autorización</label>
                <input type="password" style={inputStyle} placeholder="****" value={cnPin} onChange={e => setCnPin(e.target.value)} required />
              </div>
              {cnError && <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{cnError}</div>}
              
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--warning-color)', color: '#000', borderColor: 'var(--warning-color)', marginTop: '0.5rem' }} disabled={isIssuingCN}>
                {isIssuingCN ? 'Procesando...' : 'Emitir Nota de Crédito'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
