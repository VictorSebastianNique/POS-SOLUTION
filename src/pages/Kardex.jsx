import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { LogOut, Save, ArrowLeft, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Kardex() {
  const { businessDay, pastDays, kardexItems, updateKardexData, currentUser } = useStore();
  const navigate = useNavigate();

  // Local state for editing Kardex inputs
  const [editingData, setEditingData] = useState({});
  const [selectedDateId, setSelectedDateId] = useState('current');

  const handleInputChange = (id, field, value) => {
    setEditingData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveKardex = () => {
    Object.keys(editingData).forEach(id => {
      const data = editingData[id];
      const updatePayload = {};
      if (data.inicial !== undefined) updatePayload.inicial = parseFloat(data.inicial) || 0;
      if (data.ingresos !== undefined) updatePayload.ingresos = parseFloat(data.ingresos) || 0;
      if (data.mermas !== undefined) updatePayload.mermas = parseFloat(data.mermas) || 0;
      if (data.observacion !== undefined) updatePayload.observacion = data.observacion;
      
      if (Object.keys(updatePayload).length > 0) {
        updateKardexData(id, updatePayload);
      }
    });
    setEditingData({}); // Clear local edits once saved
    alert('Kardex guardado correctamente.');
  };

  const activeKardexItems = useMemo(() => {
    return (kardexItems || []).filter(k => k.active !== false);
  }, [kardexItems]);

  const categories = useMemo(() => {
    const order = ['ENTRADAS', 'GUISOS', 'FRITURAS Y CARNES', 'PESCADOS Y MARISCOS', 'OTROS'];
    const cats = new Set(activeKardexItems.map(k => k.category || 'OTROS'));
    return Array.from(cats).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [activeKardexItems]);

  const isCurrentDay = selectedDateId === 'current';
  const displayDay = isCurrentDay ? businessDay : pastDays?.find(d => d.id === selectedDateId);
  const kardexData = displayDay?.kardex || {};
  const isReadOnly = !isCurrentDay || !businessDay?.isOpen;

  return (
    <div className="layout" style={{ background: 'var(--bg-gradient)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader 
        icon={<ClipboardList />}
        title="Kardex de Producción"
        subtitle="Control diario de porciones e insumos"
        actions={
          <div className="flex gap-4 items-center">
            <select 
              className="input" 
              value={selectedDateId} 
              onChange={(e) => setSelectedDateId(e.target.value)}
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="current">Día Actual {businessDay?.isOpen ? '(Abierto)' : '(Cerrado)'}</option>
              {pastDays?.map(d => (
                <option key={d.id} value={d.id}>
                  {new Date(d.startTime).toLocaleDateString()} - {new Date(d.endTime || d.startTime).toLocaleDateString()}
                </option>
              ))}
            </select>
            {!isReadOnly && (
              <button className="btn btn-primary flex items-center gap-2" onClick={handleSaveKardex}>
                <Save size={18} /> Guardar Kardex
              </button>
            )}
            <button className="btn btn-outline flex items-center gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> Volver
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
        {isReadOnly && isCurrentDay && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Día Cerrado</p>
            <p>El día actual está cerrado. Debes abrir un nuevo día comercial en la Caja para poder editar el Kardex.</p>
          </div>
        )}
        <div className="card p-0 overflow-x-auto" style={{ borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Preparación</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-secondary)', width: '100px' }}>Inicial</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-secondary)', width: '100px' }}>Ingresos</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--info-color)', width: '100px' }}>Total</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--success-color)', width: '100px' }}>Venta</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--warning-color)', width: '100px' }}>Merma</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-primary)', width: '120px' }}>Saldo Final</th>
                <th className="p-4 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <React.Fragment key={category}>
                  {/* Category Header row */}
                  <tr>
                    <td colSpan="8" className="p-3 font-bold text-sm uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, var(--primary-subtle), transparent)', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)' }}>
                      {category}
                    </td>
                  </tr>
                  
                  {activeKardexItems.filter(k => (k.category || 'OTROS') === category).map(item => {
                    const rowData = kardexData[item.id] || { inicial: 0, ingresos: 0, mermas: 0, observacion: '', ventas: 0 };
                    
                    const localData = editingData[item.id] || {};
                    const inicial = localData.inicial !== undefined ? localData.inicial : rowData.inicial;
                    const ingresos = localData.ingresos !== undefined ? localData.ingresos : rowData.ingresos;
                    const mermas = localData.mermas !== undefined ? localData.mermas : rowData.mermas;
                    const observacion = localData.observacion !== undefined ? localData.observacion : rowData.observacion;
                    
                    const total = (parseFloat(inicial) || 0) + (parseFloat(ingresos) || 0);
                    const ventas = rowData.ventas || 0;
                    const saldoFinal = total - ventas - (parseFloat(mermas) || 0);

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }} className="hover:bg-white/5">
                        <td className="p-3 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                        <td className="p-2">
                          {isReadOnly ? <div className="text-center font-medium" style={{ color: 'var(--text-primary)' }}>{inicial}</div> : <input type="number" className="input text-center w-full !p-2 !text-sm" value={inicial} onChange={e => handleInputChange(item.id, 'inicial', e.target.value)} />}
                        </td>
                        <td className="p-2">
                          {isReadOnly ? <div className="text-center font-medium" style={{ color: 'var(--text-primary)' }}>{ingresos}</div> : <input type="number" className="input text-center w-full !p-2 !text-sm" value={ingresos} onChange={e => handleInputChange(item.id, 'ingresos', e.target.value)} />}
                        </td>
                        <td className="p-3 text-center font-bold text-lg" style={{ color: 'var(--info-color)' }}>{total}</td>
                        <td className="p-3 text-center font-bold text-lg" style={{ color: 'var(--success-color)' }}>{ventas}</td>
                        <td className="p-2">
                          {isReadOnly ? <div className="text-center font-medium" style={{ color: 'var(--warning-color)' }}>{mermas}</div> : <input type="number" className="input text-center w-full !p-2 !text-sm" style={{ borderColor: mermas > 0 ? 'var(--warning-color)' : '' }} value={mermas} onChange={e => handleInputChange(item.id, 'mermas', e.target.value)} />}
                        </td>
                        <td className="p-3 text-center font-bold text-xl" style={{ color: saldoFinal < 0 ? 'var(--danger-color)' : (saldoFinal === 0 ? 'var(--text-muted)' : 'var(--text-primary)') }}>
                          {saldoFinal}
                        </td>
                        <td className="p-2">
                          {isReadOnly ? <div className="text-sm px-2" style={{ color: 'var(--text-secondary)' }}>{observacion || '-'}</div> : <input type="text" className="input w-full !p-2 !text-sm" value={observacion} onChange={e => handleInputChange(item.id, 'observacion', e.target.value)} placeholder="Opcional..." />}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
