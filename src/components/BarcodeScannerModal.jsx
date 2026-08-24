import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScannerModal = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  
  useEffect(() => {
        const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Only camera
      },
      /* verbose= */ false
    );
    
    scanner.render((decodedText) => {
      scanner.clear();
      onScan(decodedText);
    }, (error) => {
      // ignore errors
    });
    
    scannerRef.current = scanner;
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>
        <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Escanear Código</h2>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary-color)' }}>
          <div id="reader" style={{ width: '100%', border: 'none' }}></div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;


