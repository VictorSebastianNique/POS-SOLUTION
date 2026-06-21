import React from 'react';

const PrintReceipt = ({ doc }) => {
  if (!doc) return null;

  const documentTitle = doc.documentType === 'boleta' ? 'BOLETA DE VENTA ELECTRÓNICA' : 
                        doc.documentType === 'factura' ? 'FACTURA ELECTRÓNICA' : 
                        doc.documentType === 'precuenta' ? 'PRE-CUENTA' :
                        'TICKET DE VENTA';

  const subtotal = doc.totalPagar / 1.18;
  const igv = doc.totalPagar - subtotal;

  return (
    <div className="print-receipt-container">
      <div className="receipt-header">
        <h2>{doc.companyName || 'NUESTRO LOCAL'}</h2>
        <p>RUC: {doc.companyRuc || '20000000000'}</p>
        <p>{doc.companyAddress || 'Av. Principal 123, Ciudad'}</p>
        <p>Tel: {doc.companyPhone || '01-2345678'}</p>
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-header" style={{ marginBottom: '5px', position: 'relative' }}>
        {doc.documentType === 'precuenta' && (
          <div style={{ position: 'absolute', top: '-10px', right: 0, fontSize: '12px', fontWeight: 'bold' }}>
            <span>( &nbsp; ) B &nbsp;&nbsp; ( &nbsp; ) F</span>
          </div>
        )}
        <h3 style={{ margin: '5px 0', fontSize: '15px' }}>{documentTitle}</h3>
        {doc.documentType !== 'precuenta' && (
          <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{doc.docNumber || 'B001-00000001'}</p>
        )}
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-info">
        <p><strong>Fecha:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        {doc.customerName && <p><strong>Cliente:</strong> {doc.customerName}</p>}
        {doc.customerDni && <p><strong>DNI/RUC:</strong> {doc.customerDni}</p>}
        {doc.paymentMethod && <p><strong>Pago:</strong> {doc.paymentMethod.toUpperCase()}</p>}
        {(doc.waiterName || doc.tableNum) && (
          <p>
            {doc.tableNum && <span><strong>Mesa:</strong> {doc.tableNum} &nbsp;</span>}
            {doc.waiterName && <span><strong>Mozo:</strong> {doc.waiterName}</span>}
          </p>
        )}
      </div>

      <table className="receipt-table">
        <thead>
          <tr>
            <th className="col-qty">CANT</th>
            <th className="col-desc">DESCRIPCIÓN</th>
            <th className="col-price">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {(doc.items || []).map((cartItem, idx) => {
            const product = cartItem.item || {};
            const price = product.price || 0;
            const subtotalItem = price * cartItem.quantity;
            return (
              <tr key={idx}>
                <td className="col-qty">{cartItem.quantity}</td>
                <td className="col-desc">{product.name || 'Producto'}</td>
                <td className="col-price">S/ {subtotalItem.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="receipt-totals">
        <div className="row">
          <span>OP. GRAVADA:</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>I.G.V. (18%):</span>
          <span>S/ {igv.toFixed(2)}</span>
        </div>
        <div className="row total">
          <span>TOTAL A PAGAR:</span>
          <span>S/ {doc.totalPagar.toFixed(2)}</span>
        </div>
        {doc.paymentAmount > 0 && (
          <div className="row" style={{ marginTop: '5px' }}>
            <span>Pagó con:</span>
            <span>S/ {doc.paymentAmount.toFixed(2)}</span>
          </div>
        )}
        {doc.change > 0 && (
          <div className="row">
            <span>Vuelto:</span>
            <span>S/ {doc.change.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider" style={{ marginTop: '15px' }}></div>
      <div className="receipt-footer">
        {doc.documentType === 'precuenta' ? (
          <div style={{ textAlign: 'left', marginTop: '10px', marginBottom: '15px', fontSize: '12px', lineHeight: '2.5' }}>
            <p style={{ borderBottom: '1px dashed #000', paddingBottom: '2px', margin: 0 }}>DNI / RUC: </p>
            <p style={{ borderBottom: '1px dashed #000', paddingBottom: '2px', margin: '15px 0 0 0' }}>RAZÓN SOCIAL / NOMBRES: </p>
          </div>
        ) : (
          <p>Representación impresa de la {documentTitle}</p>
        )}
        <p style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>¡Gracias por su preferencia!</p>
        <p>Vuelva pronto</p>
      </div>
    </div>
  );
};

export default PrintReceipt;
