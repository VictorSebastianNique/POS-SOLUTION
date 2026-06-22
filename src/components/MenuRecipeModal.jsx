import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Plus, Trash2, Save } from 'lucide-react';

const MenuRecipeModal = ({ menuItem, catalogId, onClose }) => {
  const { kardexItems, catalogs, setCatalogs } = useStore();
  const [recipe, setRecipe] = useState(menuItem.kardexRecipe || []);
  const [newItemId, setNewItemId] = useState('');
  const [newQty, setNewQty] = useState('1');

  const handleAdd = () => {
    if (!newItemId || !newQty) return;
    setRecipe([...recipe, { kardexId: newItemId, qty: parseFloat(newQty) }]);
    setNewItemId('');
    setNewQty('1');
  };

  const handleRemove = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setCatalogs(prev => prev.map(c => {
      if (c.id !== catalogId) return c;
      return {
        ...c,
        items: c.items.map(item => item.id === menuItem.id ? { ...item, kardexRecipe: recipe } : item)
      };
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="card p-6 w-full max-w-md animate-scale-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="title text-lg">Receta Kardex: {menuItem.name}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Configura qué insumos de producción se descontarán automáticamente cuando se venda este plato.
        </p>

        {/* Existing Recipe Items */}
        <div className="mb-4">
          <h3 className="font-bold mb-2">Insumos vinculados:</h3>
          {recipe.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hay insumos vinculados a este plato.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recipe.map((r, idx) => {
                const kardexItem = kardexItems.find(k => k.id === r.kardexId);
                return (
                  <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                    <div>
                      <span className="font-semibold">{kardexItem ? kardexItem.name : 'Insumo desconocido'}</span>
                      <span className="text-xs ml-2 bg-blue-100 text-blue-800 px-1 rounded">Cant: {r.qty}</span>
                    </div>
                    <button className="text-red-500 p-1" onClick={() => handleRemove(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add new Item */}
        <div className="flex gap-2 items-end bg-gray-100 p-3 rounded mb-6">
          <div className="flex-1">
            <label className="text-xs font-semibold mb-1 block">Agregar Insumo</label>
            <select className="input w-full" value={newItemId} onChange={e => setNewItemId(e.target.value)}>
              <option value="">Seleccione...</option>
              {kardexItems.filter(k => k.active !== false).map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="text-xs font-semibold mb-1 block">Cant.</label>
            <input type="number" step="0.1" className="input w-full" value={newQty} onChange={e => setNewQty(e.target.value)} />
          </div>
          <button className="btn btn-primary p-2" onClick={handleAdd}>
            <Plus size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleSave}>
            <Save size={16} /> Guardar Receta
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuRecipeModal;
