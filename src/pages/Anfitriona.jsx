import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, LogOut, CheckCircle, Clock, Trash2, Home } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function Anfitriona() {
  const { currentUser, logout, zones, activeTables, tableFamilies, setTableFamily, developerSettings } = useStore();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [familyNameInput, setFamilyNameInput] = useState('');

  // Authentication check
  React.useEffect(() => {
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
    if (currentUser.role !== 'anfitriona' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      navigate('/');
    }
  }, [currentUser, navigate, developerSettings]);

  if (!currentUser) return null;

  const handleLogout = () => {
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      navigate('/admin');
    } else {
      const role = currentUser?.role;
      const locId = localStorage.getItem('currentLocationId');
      logout();
      if (role === 'superadmin') {
        navigate('/super-admin');
      } else {
        navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/');
      }
    }
  };

  const handleTableClick = (zoneName, tableNum) => {
    const key = `${zoneName}-${tableNum}`;
    const familyData = tableFamilies[key];
    const isOccupied = activeTables[key] && activeTables[key].length > 0;
    
    setSelectedTable({ key, zoneName, tableNum, familyData, isOccupied });
    setFamilyNameInput(familyData ? familyData.familyName : '');
  };

  const saveFamily = () => {
    if (!selectedTable) return;
    if (familyNameInput.trim()) {
      const currentStatus = selectedTable.familyData?.status || (selectedTable.isOccupied ? 'seated' : 'reserved');
      setTableFamily(selectedTable.key, familyNameInput.trim(), currentStatus);
    } else {
      setTableFamily(selectedTable.key, null);
    }
    setSelectedTable(null);
  };

  const getTableColorClass = (key) => {
    if (activeTables[key] && activeTables[key].length > 0) return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
    if (tableFamilies[key] && tableFamilies[key].status === 'reserved') return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
    return 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20';
  };

  const assignedFamilies = Object.keys(tableFamilies).map(key => {
    const data = tableFamilies[key];
    const [zoneName, tableNum] = key.split('-');
    const isOccupied = activeTables[key] && activeTables[key].length > 0;
    return { key, zoneName, tableNum, ...data, isOccupied };
  }).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col" style={{ height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <PageHeader 
        icon={<Users size={28} color="#fff" />}
        title="Anfitriona"
        subtitle={currentUser.name}
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Modo Supervisor' : null}
        actions={
          <button onClick={handleLogout} className="btn btn-outline text-xs px-3 py-1 flex items-center gap-2">
            <LogOut size={14} />
            <span className="hidden sm:inline">{(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}</span>
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Map Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap gap-4 mb-4">
               <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div> Libre</div>
               <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div> Reservada (Esperando pedido)</div>
               <div className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div> Ocupada (Comiendo)</div>
            </div>

            {zones.map((zone) => (
              <div key={zone.id} className="card p-4 sm:p-6 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-700"></div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 capitalize">
                  {zone.name}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {zone.tables && zone.tables.map((tableName, idx) => {
                    const key = `${zone.id}-${tableName}`;
                    const family = tableFamilies[key];
                    const occupied = activeTables[key] && activeTables[key].length > 0;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTableClick(zone.id, tableName)}
                        className={`
                          relative p-4 rounded-xl border text-center transition-all duration-300
                          shadow-sm hover:shadow-md flex flex-col items-center justify-center min-h-[100px]
                          ${getTableColorClass(key)}
                        `}
                      >
                        <span className="text-2xl font-black mb-1">{tableName}</span>
                        {family && (
                          <div className="absolute bottom-2 left-0 w-full px-1">
                            <div className={`text-[10px] font-bold truncate px-1 rounded-full ${occupied ? 'bg-red-500/30 text-red-100' : 'bg-blue-500/30 text-blue-100'}`}>
                              {family.familyName}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col hidden lg:flex shadow-xl z-10 relative">
          <div className="p-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-primary" /> Mesas Asignadas</h3>
            <p className="text-xs text-slate-400 mt-1">Lista en vivo de familias</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {assignedFamilies.length === 0 ? (
              <div className="text-center text-slate-500 py-10 text-sm">
                <Home size={32} className="mx-auto mb-2 opacity-20" />
                No hay familias asignadas a ninguna mesa.
              </div>
            ) : (
              assignedFamilies.map((fam) => (
                <div 
                  key={fam.key} 
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${fam.isOccupied ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'}`}
                  onClick={() => handleTableClick(fam.zoneName, fam.tableNum)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white text-sm truncate pr-2">{fam.familyName}</span>
                    <span className="text-xs font-mono bg-black/30 px-2 py-0.5 rounded text-slate-300 whitespace-nowrap">Mesa {fam.tableNum}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 capitalize">{fam.zoneName}</span>
                    {fam.isOccupied ? (
                      <span className="flex items-center gap-1 text-red-400"><CheckCircle size={12}/> Ocupada</span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-400"><Clock size={12}/> Reservada</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Mesa {selectedTable.tableNum} <span className="text-slate-400 text-sm font-normal capitalize">({selectedTable.zoneName})</span></h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Nombre de la Familia / Reserva</label>
                <input
                  type="text"
                  autoFocus
                  className="input w-full text-lg py-3"
                  placeholder="Ej. Familia Pérez"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveFamily(); }}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="btn btn-outline flex-1" 
                  onClick={() => setSelectedTable(null)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary flex-1" 
                  onClick={saveFamily}
                >
                  Guardar
                </button>
              </div>
              
              {selectedTable.familyData && !selectedTable.isOccupied && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                   <button 
                    className="btn bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border-none w-full flex items-center justify-center gap-2"
                    onClick={() => { setTableFamily(selectedTable.key, null); setSelectedTable(null); }}
                  >
                    <Trash2 size={16} /> Liberar Mesa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
