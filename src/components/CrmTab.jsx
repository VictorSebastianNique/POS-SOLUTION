import { useAlert } from '../context/AlertContext';
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Award, Gift, Search, Star, Send, User } from 'lucide-react';

export default function CrmTab() {
  const { showAlert } = useAlert();
  const { customers } = useStore();
  const [search, setSearch] = useState('');

  const filteredCustomers = (customers || []).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  ).sort((a, b) => b.points - a.points); // Sort by points descending

  const getLevelColor = (level) => {
    switch(level) {
      case 'Bronce': return '#cd7f32';
      case 'Plata': return '#c0c0c0';
      case 'Oro': return '#ffd700';
      case 'VIP': return '#8a2be2';
      case 'Platinum': return '#e5e4e2';
      default: return 'var(--text-secondary)';
    }
  };

  const handleSendOffer = (customer) => {
    // Simulated action
    showAlert(`Se ha enviado una notificación Push / SMS a ${customer.name} (${customer.phone}) con un descuento especial por su nivel ${customer.level}.`);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award style={{ color: 'var(--primary-color)' }} /> CRM y Fidelización
          </h2>
          <p className="subtitle">Gestiona a tus clientes, sus niveles y ofréceles promociones.</p>
        </div>

        {/* Share App Link */}
        <div style={{ flexBasis: '100%', background: 'linear-gradient(to right, rgba(255,107,0,0.1), rgba(255,204,0,0.1))', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={16} /> ¡Invita a tus clientes a la App!
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Comparte este enlace único para que tus clientes inicien sesión, ganen puntos y hagan pedidos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, userSelect: 'all' }}>
              {window.location.origin}/app
            </span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/app`);
                showAlert('¡Enlace copiado al portapapeles!');
              }}
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Copiar
            </button>
          </div>
        </div>
        
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input w-full" 
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nombre o celular..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 107, 0, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
            <User size={24} />
          </div>
          <div>
            <p className="subtitle" style={{ margin: 0 }}>Total Clientes</p>
            <h3 className="title" style={{ fontSize: '1.5rem', margin: 0 }}>{(customers || []).length}</h3>
          </div>
        </div>
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '1rem', borderRadius: '50%', color: '#ffd700' }}>
            <Star size={24} />
          </div>
          <div>
            <p className="subtitle" style={{ margin: 0 }}>Clientes VIP/Oro</p>
            <h3 className="title" style={{ fontSize: '1.5rem', margin: 0 }}>
              {(customers || []).filter(c => c.level === 'VIP' || c.level === 'Oro' || c.level === 'Platinum').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Celular</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nivel Actual</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Puntos / Gasto</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-color)' }}>
                      {customer.name.charAt(0)}
                    </div>
                    {customer.name}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{customer.phone}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    background: `${getLevelColor(customer.level)}20`, 
                    color: getLevelColor(customer.level), 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '99px', 
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {customer.level}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success-color)' }}>S/ {(customer.totalSpent || 0).toFixed(2)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{customer.points || 0} pts</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleSendOffer(customer)}
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                  >
                    <Gift size={14} /> Enviar Oferta
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron clientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
