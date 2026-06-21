import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Receipt, X, AlertTriangle, User, Eye } from 'lucide-react';

const SalesHistory = ({ onViewReceipt }) => {
  const { businessDay, voidSaleAndReopenTable, users, currentUser, activeTables, locations } = useStore();
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidPin, setVoidPin] = useState('');
  const [voidError, setVoidError] = useState('');
  const [selectedAlternativeTable, setSelectedAlternativeTable] = useState('');

  const sales = businessDay?.sales || [];

  const handleOpenVoidModal = (sale) => {
    setSaleToVoid(sale);
    setVoidReason('');
    setVoidPin('');
    setVoidError('');
    setSelectedAlternativeTable('');
    setShowVoidModal(true);
  };

  const isOriginalTableOccupied = saleToVoid ? (activeTables[saleToVoid.tableKey]?.length > 0) : false;

  const currentLocId = localStorage.getItem('currentLocationId') || currentUser?.locationId;
  const location = locations?.find(l => l.id === currentLocId);
  const freeTables = [];
  if (isOriginalTableOccupied) {
    location?.zones?.forEach(z => {
      z.tables.forEach(t => {
        const tKey = `${z.name}-${t}`;
        if (!activeTables[tKey] || activeTables[tKey].length === 0) {
          freeTables.push({ zone: z.name, table: t, key: tKey });
        }
      });
    });
  }

  const handleConfirmVoid = (e) => {
    e.preventDefault();
    
    // Validar PIN de administrador
    const admin = users.find(u => 
      (u.role === 'admin' || u.role === 'superadmin') && 
      String(u.password) === voidPin.trim()
    );

    if (!admin) {
      setVoidError('PIN incorrecto o no tienes permisos de Administrador.');
      return;
    }

    if (!voidReason.trim()) {
      setVoidError('Debes ingresar un motivo para la anulación.');
      return;
    }

    if (isOriginalTableOccupied && !selectedAlternativeTable) {
      setVoidError('Debes seleccionar una mesa libre para recuperar la cuenta.');
      return;
    }

    const targetTableKey = isOriginalTableOccupied ? selectedAlternativeTable : null;
    const result = voidSaleAndReopenTable(saleToVoid.id, voidReason, admin, targetTableKey);
    if (result && !result.success) {
      setVoidError(result.error);
      return;
    }

    setShowVoidModal(false);
    setSaleToVoid(null);
  };

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem' };
  const labelStyle = { fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' };

  return (
    <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
      <h2 className="title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Receipt size={24} color="var(--primary-color)" /> Ventas de Hoy
      </h2>

      {sales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <Receipt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No se han registrado ventas hoy.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Hora</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Documento</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mesa</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...sales].reverse().map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    {sale.documentType === 'boleta' ? 'B' : sale.documentType === 'factura' ? 'F' : 'P'}-{sale.documentNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {sale.customerName || sale.companyName || 'Consumidor Final'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {sale.zone} {sale.table}
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
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                      onClick={() => handleOpenVoidModal(sale)}
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE ANULACIÓN */}
      {showVoidModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '350px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.25rem', position: 'relative' }} className="animate-fade-in">
            <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Anular Venta
            </h2>
            <button className="btn btn-outline" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.35rem' }} onClick={() => setShowVoidModal(false)}><X size={15} /></button>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Se eliminará el registro de la venta <strong>{saleToVoid?.documentType === 'boleta' ? 'B' : saleToVoid?.documentType === 'factura' ? 'F' : 'P'}-{saleToVoid?.documentNumber}</strong> por <strong>S/{saleToVoid?.total.toFixed(2)}</strong>.
              {isOriginalTableOccupied ? (
                <span style={{ color: 'var(--danger-color)', display: 'block', marginTop: '0.5rem', fontWeight: 'bold' }}>
                  ¡La Mesa {saleToVoid?.table} está ocupada! Selecciona una mesa libre para recuperar la cuenta:
                </span>
              ) : (
                <span> Los platos volverán a la Mesa <strong>{saleToVoid?.table}</strong> para ser cobrados nuevamente.</span>
              )}
            </p>

            <form onSubmit={handleConfirmVoid} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isOriginalTableOccupied && (
                <div>
                  <label style={labelStyle}>Recuperar en Mesa Libre</label>
                  <select
                    style={inputStyle}
                    value={selectedAlternativeTable}
                    onChange={e => setSelectedAlternativeTable(e.target.value)}
                    required={isOriginalTableOccupied}
                  >
                    <option value="">-- Selecciona una Mesa --</option>
                    {freeTables.map(t => (
                      <option key={t.key} value={t.key}>{t.zone} - {t.table}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label style={labelStyle}>Motivo de Anulación</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  placeholder="Ej. Cambio de Boleta a Factura" 
                  value={voidReason} 
                  onChange={e => setVoidReason(e.target.value)} 
                  required 
                  autoFocus 
                />
              </div>

              <div>
                <label style={labelStyle}>PIN de Administrador</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="password" 
                    style={{ ...inputStyle, paddingLeft: '2.25rem' }} 
                    placeholder="****" 
                    value={voidPin} 
                    onChange={e => setVoidPin(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {voidError && <p style={{ color: 'var(--danger-color)', fontSize: '0.75rem', textAlign: 'center', backgroundColor: 'rgba(255,71,87,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{voidError}</p>}
              
              <button type="submit" className="btn btn-danger" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                Confirmar Anulación
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
