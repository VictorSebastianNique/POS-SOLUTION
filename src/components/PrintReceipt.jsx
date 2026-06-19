import React from 'react';

const PrintReceipt = ({ doc }) => {
  if (!doc) return null;

  return (
    <div className="print-receipt-container">
      <div className="print-header">
        <h2>{doc.companyName || 'NUESTRO LOCAL'}</h2>
        <p>RUC: 20000000000</p>
        <p>Av. Principal 123, Ciudad</p>
        <p>Tel: 01-2345678</p>
        <p>--------------------------------</p>
        <h3>
          {doc.documentType === 'boleta' ? 'BOLETA DE VENTA' : doc.documentType === 'factura' ? 'FACTURA ELECTRÓNICA' : 'TICKET INTERNO'}
        </h3>
        <p>NRO: {doc.docNumber}</p>
        <p>Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        <p>--------------------------------</p>
      </div>

      <div className="print-customer">
        {doc.customerName && <p>Cliente: {doc.customerName}</p>}
        {doc.waiterName && <p>Atendido por: {doc.waiterName}</p>}
        {doc.tableNum && <p>Mesa: {doc.tableNum}</p>}
      </div>
      <p>--------------------------------</p>

      <table className="print-items">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', width: '60%' }}>CANT - DESCRIPCIÓN</th>
            <th style={{ textAlign: 'right', width: '40%' }}>IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {(doc.items || []).map((cartItem, idx) => {
            const product = cartItem.item || {};
            const price = product.price || 0;
            const subtotal = price * cartItem.quantity;
            return (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>{cartItem.quantity} x {product.name || 'Producto'}</td>
                <td style={{ textAlign: 'right' }}>S/ {subtotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p>--------------------------------</p>
      <div className="print-totals">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}>
          <span>TOTAL A PAGAR:</span>
          <span>S/ {doc.totalPagar.toFixed(2)}</span>
        </div>
        {doc.change > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <span>Vuelto:</span>
            <span>S/ {doc.change.toFixed(2)}</span>
          </div>
        )}
      </div>
      <p>--------------------------------</p>
      <div className="print-footer">
        <p>¡Gracias por su preferencia!</p>
        <p>Vuelva pronto</p>
      </div>
    </div>
  );
};

export default PrintReceipt;
