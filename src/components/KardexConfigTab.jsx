import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const KARDEX_CATEGORIES = ['ENTRADAS', 'GUISOS', 'FRITURAS', 'PESCADOS Y MARISCOS', 'OTROS'];

const KardexConfigTab = () => {
  const { kardexItems = [], addKardexItem, updateKardexItem, deleteKardexItem } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'ENTRADAS', active: true });

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({ name: item.name, category: item.category, active: item.active !== false });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditItem(null);
    setFormData({ name: '', category: 'ENTRADAS', active: true });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (editItem) {
      updateKardexItem(editItem.id, { ...formData });
    } else {
      addKardexItem({ ...formData });
    }
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Seguro que desea eliminar este insumo del kardex? Esto no afectará datos históricos pero sí futuros cálculos.')) {
      deleteKardexItem(id);
    }
  };

  if (isEditing) {
    return (
      <div className="card p-6">
        <h2 className="subtitle mb-4">{editItem ? 'Editar Insumo Kardex' : 'Nuevo Insumo Kardex'}</h2>
        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label>Nombre del Insumo / Preparación</label>
            <input 
              className="input" 
              placeholder="Ej: Cabrito Normal" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Categoría Kardex</label>
            <select 
              className="input" 
              value={formData.category} 
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              {KARDEX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={formData.active} 
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              id="kardexActive"
            />
            <label htmlFor="kardexActive">Activo</label>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="subtitle">Insumos de Producción (Kardex)</h2>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleAddNew}>
          <Plus size={18} /> Nuevo Insumo
        </button>
      </div>

      <div className="table-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 border-b">Insumo</th>
              <th className="p-3 border-b">Categoría</th>
              <th className="p-3 border-b">Estado</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {kardexItems.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">No hay insumos registrados.</td>
              </tr>
            ) : kardexItems.map(item => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.name}</td>
                <td className="p-3">
                  <span className="badge" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                    {item.category}
                  </span>
                </td>
                <td className="p-3">
                  {item.active !== false ? <span className="text-green-600 font-bold">Activo</span> : <span className="text-red-500">Inactivo</span>}
                </td>
                <td className="p-3 flex gap-2">
                  <button className="icon-btn text-blue-500" onClick={() => handleEdit(item)}><Edit2 size={16} /></button>
                  <button className="icon-btn text-red-500" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KardexConfigTab;
