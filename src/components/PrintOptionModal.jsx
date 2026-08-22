import React from 'react';
import { Printer, Cloud, X } from 'lucide-react';

export default function PrintOptionModal({ onClose, onPrintLocal, onPrintRemote, title = "Opciones de Impresión" }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)', zIndex: 9999999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%', maxWidth: '380px', textAlign: 'center',
        padding: '2rem', position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          {title}
        </h2>
        <p className="subtitle mb-6" style={{ fontSize: '0.9rem' }}>
          ¿Por dónde deseas enviar este documento?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Local Printer Option */}
          <button 
            className="btn btn-outline"
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.2rem', justifyContent: 'flex-start',
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)'
            }}
            onClick={() => {
              onPrintLocal();
              onClose();
            }}
          >
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem',
              borderRadius: '50%'
            }}>
              <Printer size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 'bold', fontSize: '1rem' }}>Impresora Local</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bluetooth, USB o PDF</span>
            </div>
          </button>

          {/* Remote Server Option */}
          <button 
            className="btn btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.2rem', justifyContent: 'flex-start',
              backgroundColor: 'var(--primary-color)',
              color: '#fff', border: 'none'
            }}
            onClick={() => {
              onPrintRemote();
              onClose();
            }}
          >
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)', padding: '0.6rem',
              borderRadius: '50%'
            }}>
              <Cloud size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 'bold', fontSize: '1rem' }}>Servidor Remoto (Print Server)</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Impresora en red (Cocina, Caja, Barra)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
