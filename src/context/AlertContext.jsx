import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    onConfirm: null
  });

  const showAlert = useCallback((message, type = 'info', onConfirm = null) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      onConfirm
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, [alertState]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={36} />;
      case 'error':
        return <XCircle size={36} />;
      case 'warning':
        return <AlertTriangle size={36} />;
      case 'info':
      default:
        return <Info size={36} />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success':
        return 'var(--success-color)';
      case 'error':
        return 'var(--danger-color)';
      case 'warning':
        return 'var(--warning-color)';
      case 'info':
      default:
        return 'var(--info-color)';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertState.isOpen && (
        <div 
          className="modal-overlay animate-fade-in" 
          style={{ 
            zIndex: 99999, 
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              backgroundColor: `color-mix(in srgb, ${getAlertColor(alertState.type)} 15%, transparent)`, 
              color: getAlertColor(alertState.type), 
              marginBottom: '1.5rem',
              boxShadow: `0 0 20px color-mix(in srgb, ${getAlertColor(alertState.type)} 30%, transparent)`
            }}>
              {getAlertIcon(alertState.type)}
            </div>
            
            <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: 1.3 }}>
              {alertState.message}
            </h2>
            
            <button 
              className="btn w-full justify-center mt-4" 
              style={{ 
                padding: '0.9rem', 
                fontSize: '1.1rem',
                backgroundColor: getAlertColor(alertState.type),
                color: '#fff',
                border: 'none'
              }} 
              onClick={closeAlert}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
