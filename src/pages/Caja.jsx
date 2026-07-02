import { useAlert } from '../context/AlertContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CreditCard, DollarSign, Smartphone, X, LogOut, User, Receipt, CheckCircle, FileText, Building2, ArrowDownCircle, ArrowUpCircle, Plus, Eye, EyeOff, Save, Edit2, Search, Loader2, Share2, Printer, FileDown, AlertTriangle } from 'lucide-react';
import UserManagement from '../components/UserManagement';
import PrintReceipt from '../components/PrintReceipt';
import PageHeader from '../components/PageHeader';
import SalesHistory from '../components/SalesHistory';
import html2canvas from 'html2canvas';

const IGV_RATE = 0.18;

export default function Caja() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { currentUser, logout, zones, activeTables, payTable, businessDay, companies, setActiveTables, setBusinessDay, pastDays, orders, setOrders, addIncome, addExpense , developerSettings, users, logAudit, locations, updateOrderStatus, openCaja, closeCaja, menu, updateTableCart } = useStore();

  const [selectedZone, setSelectedZone] = useState('all');
  
  // Discount state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [discountPin, setDiscountPin] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');



  // Billing state
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [documentType, setDocumentType] = useState('boleta'); // 'boleta' | 'factura'
  const [customerDni, setCustomerDni] = useState('');
  const [customerRuc, setCustomerRuc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [internalReason, setInternalReason] = useState('');

  const [isCapturing, setIsCapturing] = useState(false);
  const [viewingReceiptDoc, setViewingReceiptDoc] = useState(null);

  const handleViewReceipt = (sale) => {
    const currentLocId = localStorage.getItem('currentLocationId');
    const currentLocation = locations?.find(l => l.id === currentLocId) || {};
    const items = sale.cartItems || sale.items?.map(i => ({ item: { name: i.item, price: i.price }, quantity: i.quantity })) || [];
    
    setViewingReceiptDoc({
      docNumber: sale.documentNumber,
      totalPagar: sale.total,
      documentType: sale.documentType,
      customerName: sale.customerName,
      companyName: sale.companyName,
      companyRuc: sale.companyRuc,
      items: items,
      tableNum: `${sale.zone} - ${sale.table}`,
      waiterName: sale.waiter,
      brandName: currentLocation.brandName || currentLocation.name,
      locationAddress: currentLocation.address,
      locationPhone: currentLocation.phone
    });
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsCapturing(true);
      // Dar tiempo a React para que aplique la clase capture-mode
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.querySelector('.print-receipt-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'comprobante.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Comprobante de Pago',
              text: 'Adjunto su comprobante de pago. ¡Gracias por su preferencia!'
            });
          } catch (e) {
            console.log('Error sharing:', e);
          }
        } else {
          // Fallback PC
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `comprobante_${(paidDoc || viewingReceiptDoc)?.docNumber || 'pago'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showAlert('El comprobante ha sido descargado. Puedes adjuntarlo en WhatsApp Web.');
        }
      }, 'image/png');
    } catch (e) {
      console.error('Error al generar imagen:', e);
      showAlert('Hubo un error al generar la imagen del comprobante.');
    } finally {
      setIsCapturing(false);
    }
  };

  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [isSearchingRuc, setIsSearchingRuc] = useState(false);

  const handleSearchDni = async () => {
    if (!customerDni || customerDni.length !== 8) return;
    setIsSearchingDni(true);
    try {
      const token = developerSettings?.peruApiToken || '';
      const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${customerDni}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerName(`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`);
      } else {
        setCustomerName('JUAN PEREZ (DNI ENCONTRADO)');
      }
    } catch (error) {
      setCustomerName('JUAN PEREZ (DNI ENCONTRADO)');
    }
    setIsSearchingDni(false);
  };

  const handleSearchRuc = async () => {
    if (!customerRuc || customerRuc.length !== 11) return;
    setIsSearchingRuc(true);
    try {
      const token = developerSettings?.peruApiToken || '';
      const res = await fetch(`https://api.apis.net.pe/v2/sunat/ruc?numero=${customerRuc}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerName(data.razonSocial);
        setCustomerAddress(data.direccion || '');
      } else {
        setCustomerName('EMPRESA DE PRUEBA S.A.C.');
        setCustomerAddress('AV. LOS INCAS 123');
      }
    } catch (error) {
      setCustomerName('EMPRESA DE PRUEBA S.A.C.');
      setCustomerAddress('AV. LOS INCAS 123');
    }
    setIsSearchingRuc(false);
  };

  // Payment state
  const [payments, setPayments] = useState([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('efectivo');
  const [currentAmountReceived, setCurrentAmountReceived] = useState('');
  const [paid, setPaid] = useState(false);
  const [paidDoc, setPaidDoc] = useState(null);

  // Arqueo Ciego State
  const [showCloseCajaModal, setShowCloseCajaModal] = useState(false);
  const [fondoInicialInput, setFondoInicialInput] = useState('');
  const [aperturaStep, setAperturaStep] = useState('input'); // 'input' | 'justificarExceso' | 'recontarFaltante' | 'justificarFaltante'
  const [aperturaDiff, setAperturaDiff] = useState(0);
  const [aperturaJustificacion, setAperturaJustificacion] = useState('');

  const [efectivoGavetaInput, setEfectivoGavetaInput] = useState('');
  const [justificacionInput, setJustificacionInput] = useState('');
  const [diferenciaCaja, setDiferenciaCaja] = useState(null);

  const handleValidateApertura = () => {
    const val = parseFloat(fondoInicialInput);
    if (isNaN(val) || val < 0) {
      showAlert('Ingresa un monto válido para el fondo inicial.');
      return;
    }
    
    const lastDay = pastDays && pastDays.length > 0 ? pastDays[pastDays.length - 1] : null;
    let expectedFondo = 0;
    
    if (lastDay && lastDay.cajaDetails?.status === 'closed') {
      expectedFondo = lastDay.cajaDetails.efectivoDeclarado || 0;
    } else {
      openCaja(val, 0, '');
      return;
    }

    const diff = val - expectedFondo;
    if (diff > 0) {
      setAperturaDiff(diff);
      setAperturaStep('justificarExceso');
    } else if (diff < 0) {
      setAperturaDiff(diff);
      setAperturaStep('recontarFaltante');
    } else {
      openCaja(val, 0, '');
    }
  };

  const handleOpenConDescuadre = () => {
    if (!aperturaJustificacion.trim()) {
      showAlert('La justificación es obligatoria.');
      return;
    }
    openCaja(parseFloat(fondoInicialInput), aperturaDiff, aperturaJustificacion);
    setAperturaStep('input');
    setAperturaDiff(0);
    setAperturaJustificacion('');
  };

  const handleOpenCajaSubmit = () => {
    handleValidateApertura();
  };

  const handleCalculateCloseCaja = () => {
    const declarado = parseFloat(efectivoGavetaInput);
    if (isNaN(declarado) || declarado < 0) {
      showAlert('Ingresa un monto válido para el efectivo físico.');
      return;
    }

    // Calcular el teórico (solo efectivo, simplificado)
    const fondoInicial = businessDay.cajaDetails?.fondoInicial || 0;
    const ventasEfectivo = (businessDay.sales || [])
      .filter(s => s.paymentMethod === 'efectivo' || (s.payments && s.payments.some(p => p.method === 'efectivo')))
      .reduce((sum, s) => {
        if (s.payments) return sum + s.payments.filter(p => p.method === 'efectivo').reduce((a, b) => a + b.amount, 0);
        return sum + s.total;
      }, 0);
    const ingresosEfectivo = (businessDay.incomes || []).filter(i => i.paymentMethod === 'efectivo').reduce((sum, i) => sum + i.amount, 0);
    const egresosEfectivo = (businessDay.expenses || []).filter(e => e.paymentMethod === 'efectivo').reduce((sum, e) => sum + e.amount, 0);
    const teoricoEfectivo = fondoInicial + ventasEfectivo + ingresosEfectivo - egresosEfectivo;

    const diff = declarado - teoricoEfectivo;
    if (diff !== 0) {
      setDiferenciaCaja(diff);
    } else {
      closeCaja(declarado, '', 0);
      setShowCloseCajaModal(false);
    }
  };

  const handleConfirmCloseCaja = () => {
    if (!justificacionInput.trim()) {
      showAlert('La justificación es obligatoria si hay descuadre.');
      return;
    }
    closeCaja(parseFloat(efectivoGavetaInput), justificacionInput, diferenciaCaja);
    setShowCloseCajaModal(false);
    setDiferenciaCaja(null);
    setJustificacionInput('');
  };

  // Flow modal state
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowType, setFlowType] = useState('income'); // 'income' | 'expense'
  const [flowCategory, setFlowCategory] = useState('');
  const [flowAmount, setFlowAmount] = useState('');
  const [flowDetails, setFlowDetails] = useState('');
  const [flowPaymentMethod, setFlowPaymentMethod] = useState('efectivo');

  const incomeCategories = ['Ingreso de Liquidez', 'Adelanto/Contratos', 'Otros Ingresos'];
  const expenseCategories = ['Pago a Proveedores', 'Compras Insumos', 'Pago de Personal', 'Otros Egresos'];

  const handlePrintPrecuenta = async () => {
    try {
      const currentLocId = localStorage.getItem('currentLocationId') || 'default';
      const cajaAgentId = developerSettings?.printerIds?.[currentLocId]?.caja;
      const printServerUrl = developerSettings?.printServerUrl;

      if (!cajaAgentId || !printServerUrl) {
        showAlert("Configura la URL del Servidor y el ID de la Caja para esta Sede en el Panel Developer primero.");
        return;
      }
      
      const selectedTable = selectedTableKey ? activeTables[selectedTableKey] : null;
      if (!selectedTable) return;
      
      const tableCart = selectedTable.cart || [];
      const itemsToPrint = tableCart.filter(c => selectedItemIds.includes(c.id)).map(c => ({
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price
      }));
      
      if (itemsToPrint.length === 0) {
        showAlert("Selecciona al menos un producto para la pre-cuenta.");
        return;
      }
      
      const totalToPrint = itemsToPrint.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      
      const payload = {
        locationId: currentLocId,
        targetAgentId: cajaAgentId,
        payload: {
          documentType: 'precuenta',
          orderData: {
            table: selectedTable.number,
            waiter: selectedTable.waiter || 'Caja',
            customerName,
            total: totalToPrint,
            items: itemsToPrint
          }
        }
      };

      const res = await fetch(`${printServerUrl}/dispatch-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Error en el servidor central de impresión");
      showAlert("Pre-cuenta enviada a la impresora.");
    } catch (e) {
      console.error(e);
      showAlert("No se pudo conectar al servidor de impresión en la nube.");
    }
  };

  const [viewMode, setViewMode] = useState('mesas'); // 'mesas' | 'usuarios' | 'ventas'

  const currentLocId = localStorage.getItem('currentLocationId');

  const handleOpenFlowModal = (type) => {
    setFlowType(type);
    setFlowCategory(type === 'income' ? incomeCategories[0] : expenseCategories[0]);
    setFlowAmount('');
    setFlowDetails('');
    setFlowPaymentMethod('efectivo');
    setShowFlowModal(true);
  };

  const handleSaveFlow = (e) => {
    e.preventDefault();
    if (!flowAmount || isNaN(flowAmount) || parseFloat(flowAmount) <= 0) return;
    const amount = parseFloat(flowAmount);
    if (flowType === 'income') {
      addIncome(amount, flowCategory, flowDetails, flowPaymentMethod);
    } else {
      addExpense(amount, flowCategory, flowDetails, flowPaymentMethod);
    }
    setShowFlowModal(false);
  };

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  const getOccupiedTime = (cart) => {
    if (!cart || cart.length === 0) return '';
    const start = cart[0].timestamp || Date.now();
    const diff = Math.max(0, currentTime - start);
    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Responsive
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? `/login/${encodeURIComponent(locId.replace(/\s+/g, ''))}` : '/'); } return; } if (currentUser.role !== 'cajera' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') navigate('/');
  }, [currentUser, navigate, developerSettings]);

  // Set default company
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies]);

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

  if (!currentUser) return null;

  // ── Build active tables list ──────────────────────────────────
  const allActiveTables = [];
  (zones || []).filter(z => z.active).forEach(zone => {
    (zone.tables || []).forEach(tableName => {
      const key = `${zone.id}-${tableName}`;
      const cart = (activeTables || {})[key];
      if (cart && cart.length > 0) {
        const total = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
        const hasNew = cart.some(c => c.status === 'new');
        allActiveTables.push({ key, zone: zone.name, zoneId: zone.id, table: tableName, cart, total, hasNew });
      }
    });
  });

  const pendingOnlineOrders = (orders || []).filter(o => o.status === 'pending_approval' || (o.paymentData && o.status === 'pending' && !o.receiptEmitted));
  
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState('');

  const handleApproveOnlineOrder = (order) => {
    if (order.status === 'pending_approval') {
      setSelectedDeliveryOrder(order);
      setDeliveryFee('');
    } else {
      // Simulate emitting receipt for already paid online order
      showAlert(`Comprobante emitido para pedido de ${order.customerName}.`);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, receiptEmitted: true } : o));
      
      addIncome({
        id: Date.now().toString(),
        description: `Venta Online - ${order.customerName}`,
        amount: order.total,
        method: order.paymentData?.method || 'Transferencia',
        type: 'Venta',
        timestamp: new Date().toISOString()
      });
    }
  };

  const confirmDeliveryApproval = () => {
    const fee = parseFloat(deliveryFee) || 0;
    const updatedTotal = selectedDeliveryOrder.total + fee;
    
    setOrders(prev => prev.map(o => o.id === selectedDeliveryOrder.id ? {
      ...o,
      status: 'accepted_awaiting_payment',
      deliveryFee: fee,
      total: updatedTotal
    } : o));
    
    setSelectedDeliveryOrder(null);
  };

  const filteredTables = selectedZone === 'all'
    ? allActiveTables
    : allActiveTables.filter(t => t.zoneId === selectedZone);

  const selectedTable = selectedTableKey ? allActiveTables.find(t => t.key === selectedTableKey) : null;

  // ── Document number calculation ───────────────────────────────
  const selectedCompany = (companies || []).find(c => c.id === selectedCompanyId);
  const getDocNumber = () => {
    if (documentType === 'pedido') {
      const num = String((businessDay?.sales?.filter(s => s.documentType === 'pedido').length || 0) + 1).padStart(6, '0');
      return `PED-${num}`;
    }
    if (!selectedCompany) return '';
    if (documentType === 'boleta') {
      const series = selectedCompany.boletaSeries || 'B001';
      const num = String((selectedCompany.boletaNumber || 0) + 1).padStart(8, '0');
      return `${series}-${num}`;
    } else {
      const series = selectedCompany.facturaSeries || 'F001';
      const num = String((selectedCompany.facturaNumber || 0) + 1).padStart(8, '0');
      return `${series}-${num}`;
    }
  };

  // ── Tax calculations (Peru) ───────────────────────────────────
  const itemsToPay = selectedTable ? selectedTable.cart.filter(c => selectedItemIds.includes(c.id)).map(c => ({
    ...c,
    quantity: parseFloat(selectedQuantities[c.id]) || c.quantity
  })) : [];
  const subtotalBeforeDiscount = itemsToPay.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const subtotal = Math.max(0, subtotalBeforeDiscount - appliedDiscount);
  const valorVenta = parseFloat(((subtotal) / (1 + IGV_RATE)).toFixed(2));
  const igv = parseFloat((subtotal - valorVenta).toFixed(2));
  const totalPagar = parseFloat((subtotal).toFixed(2));

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    const adminUser = users.find(u => (u.role === 'admin' || u.role === 'superadmin') && u.password === discountPin && u.active);
    if (!adminUser) {
      setDiscountError('PIN incorrecto o no es administrador');
      return;
    }

    const eligibleTotal = itemsToPay.filter(c => !c.item.noDiscount).reduce((s, c) => s + c.item.price * c.quantity, 0);
    let amountToSubtract = 0;
    
    if (discountType === 'percent') {
      amountToSubtract = eligibleTotal * (parseFloat(discountValue || 0) / 100);
    } else {
      amountToSubtract = parseFloat(discountValue || 0);
      if (amountToSubtract > eligibleTotal) amountToSubtract = eligibleTotal;
    }
    
    setAppliedDiscount(amountToSubtract);
    setShowDiscountModal(false);
    
    logAudit('DESCUENTO_APLICADO', {
      amount: amountToSubtract,
      admin: adminUser.name,
      table: selectedTable?.key,
      customer: customerName || 'Consumidor Final',
      type: discountType
    });
  };

  const handleOpenTable = (tableKey) => {
    setSelectedTableKey(tableKey);
    const table = allActiveTables.find(t => t.key === tableKey);
    setSelectedItemIds(table ? table.cart.map(c => c.id) : []);
    const initialQtys = {};
    if (table) { table.cart.forEach(c => initialQtys[c.id] = c.quantity); }
    setSelectedQuantities(initialQtys);
    setDiscountType('percent');
    setDocumentType('boleta');
    setCustomerDni('');
    setCustomerRuc('');
    setCustomerName('');
    setCustomerAddress('');
    setInternalReason('');
    setPayments([]);
    setCurrentPaymentMethod('efectivo');
    setCurrentAmountReceived('');
    setPaid(false);
    setPaidDoc(null);
    setAppliedDiscount(0);
    if (companies.length > 0) setSelectedCompanyId(companies[0].id);
    window.location.hash = 'cobrar';
  };

  useEffect(() => {
    if (documentType === 'pedido') {
      setCurrentPaymentMethod('cortesia');
    } else if (currentPaymentMethod === 'cortesia' || currentPaymentMethod === 'merma' || currentPaymentMethod === 'consumo') {
      setCurrentPaymentMethod('efectivo');
    }
  }, [documentType]);

  const handleAddProduct = (item) => {
    const table = allActiveTables.find(t => t.key === selectedTableKey);
    if (!table) return;
    
    const newItem = {
      id: Date.now().toString(),
      item,
      quantity: 1,
      notes: ''
    };
    
    const newCart = [...table.cart, newItem];
    updateTableCart(selectedTableKey, newCart);
    
    setSelectedItemIds(prev => [...prev, newItem.id]);
    setSelectedQuantities(prev => ({ ...prev, [newItem.id]: 1 }));
    
    setShowAddMenu(false);
    setMenuSearch('');
  };

  const handleClose = () => { 
    if (window.location.hash === '#cobrar') {
      window.history.back();
    } else {
      setSelectedTableKey(null); 
      setPaid(false); 
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== '#cobrar' && selectedTableKey) {
        setSelectedTableKey(null);
        setPaid(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedTableKey]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTableKey) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableKey, handleClose]);

  const handleAddPayment = () => {
    const amt = parseFloat(currentAmountReceived);
    if (!amt || amt <= 0) return;
    setPayments([...payments, { method: currentPaymentMethod, amount: amt }]);
    setCurrentAmountReceived('');
  };

  const removePayment = (index) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const sumPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingTotal = Math.max(0, totalPagar - sumPayments);
  const assumedAmt = currentPaymentMethod === 'efectivo' ? 0 : remainingTotal;
  const currentAmt = currentAmountReceived === '' ? assumedAmt : (parseFloat(currentAmountReceived) || 0);

  const totalPaid = sumPayments + currentAmt;
  const cashPaid = payments.filter(p => p.method === 'efectivo').reduce((sum, p) => sum + p.amount, 0) + (currentPaymentMethod === 'efectivo' ? currentAmt : 0);
  const change = Math.max(0, totalPaid - totalPagar);

  const canPay = selectedItemIds.length > 0 && 
    (documentType === 'pedido' ? internalReason.trim().length > 0 : 
      (documentType === 'factura' ? (customerRuc && customerRuc.length === 11 && customerName.trim()) : true) &&
      (totalPaid >= totalPagar - 0.01) // Allow tiny float differences
    ) && (documentType === 'pedido' || selectedCompanyId);

  const handlePay = () => {
    if (!selectedTable || !canPay) return;
    const zone = zones.find(z => selectedTable.key.startsWith(`${z.id}-`));
    const zoneId = zone ? zone.id : '';
    const tableNum = zone ? selectedTable.key.replace(`${zone.id}-`, '') : selectedTable.key;
    const docNumber = getDocNumber();

    const finalPayments = [...payments];
    if (currentAmt > 0) {
      finalPayments.push({ method: currentPaymentMethod, amount: currentAmt });
    }

    const billingInfo = {
      documentType, documentNumber: docNumber,
      companyId: selectedCompanyId, companyName: selectedCompany?.name || '',
      companyRuc: selectedCompany?.ruc || '',
      customerDni: documentType === 'boleta' ? customerDni : '',
      customerRuc: documentType === 'factura' ? customerRuc : '',
      customerName: customerName,
      customerAddress: customerAddress,
      internalReason: documentType === 'pedido' ? internalReason : '',
      valorVenta, igv, totalPagar,
      paymentMethod: finalPayments.length > 0 ? finalPayments[0].method : 'efectivo',
      payments: finalPayments,
    };

    const tableOrders = (orders || []).filter(o => o.zone === zone?.name && String(o.table) === String(tableNum));
    const waiterName = tableOrders.length > 0 ? tableOrders[0].waiter : (selectedTable.cart[0]?.waiter || 'Mozo Desconocido');

    payTable(selectedTable.key, totalPagar, itemsToPay, waiterName, zone?.name || 'Desconocida', tableNum, billingInfo);
    
    const currentLocId = localStorage.getItem('currentLocationId');
    const currentLocation = locations?.find(l => l.id === currentLocId) || {};
    setPaidDoc({ 
      docNumber, change, totalPagar, documentType, customerName, 
      companyName: selectedCompany?.name, companyRuc: selectedCompany?.ruc, 
      items: itemsToPay, tableNum, waiterName,
      brandName: currentLocation.brandName || currentLocation.name,
      locationAddress: currentLocation.address,
      locationPhone: currentLocation.phone
    });
    setPaid(true);
  };

  // ── Numpad ────────────────────────────────────────────────────
  const handleNumpad = (val) => {
    if (val === 'C') { setCurrentAmountReceived(''); return; }
    if (val === '.' && currentAmountReceived.includes('.')) return;
    if (val === '.' && currentAmountReceived === '') { setCurrentAmountReceived('0.'); return; }
    setCurrentAmountReceived(prev => (prev === '0' && val !== '.') ? val : prev + val);
  };

  const payMethods = [
    { id: 'efectivo', label: 'Efectivo', icon: DollarSign, color: 'var(--success-color)' },
    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'var(--primary-color)' },
    { id: 'transferencia', label: 'Transf.', icon: Smartphone, color: 'var(--warning-color)' },
  ];

  const internalPayMethods = [
    { id: 'cortesia', label: 'Cortesía', icon: User, color: 'var(--primary-color)' },
    { id: 'merma', label: 'Merma', icon: X, color: 'var(--danger-color)' },
    { id: 'consumo', label: 'Consumo', icon: FileText, color: 'var(--warning-color)' },
  ];

  const todaySales = businessDay?.sales || [];
  const todayTotal = businessDay?.totalSales || 0;
  const todayIncomes = businessDay?.incomes || [];
  const todayExpenses = businessDay?.expenses || [];
  const totalIncomes = todayIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netCashFlow = todayTotal + totalIncomes - totalExpenses;

  // ── Styles helpers ────────────────────────────────────────────
  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem' };
  const labelStyle = { fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' };
  const sectionTitle = { fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', marginBottom: '0.6rem' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
      <PageHeader
        icon={<Receipt />}
        iconGradient="135deg, var(--success-color), #059669"
        iconGlow="var(--success-glow)"
        title="Módulo de Caja"
        subtitle={isMobile ? null : 'Facturación y cobros'}
        badge={(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Supervisor' : null}
        badgeColor="var(--warning-color)"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {businessDay?.cajaDetails?.isOpen && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                onClick={() => setShowCloseCajaModal(true)}
              >
                Cerrar Turno (Caja)
              </button>
            )}
            <div style={{ display: 'flex', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setViewMode('mesas')}
                style={{ padding: '0.35rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'mesas' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'mesas' ? '#fff' : 'var(--text-secondary)'
                }}
              >🧾 Mesas</button>
              <button
                onClick={() => setViewMode('ventas')}
                style={{ padding: '0.35rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'ventas' ? 'var(--success-color)' : 'transparent',
                  color: viewMode === 'ventas' ? '#fff' : 'var(--text-secondary)'
                }}
              >📋 Ventas de Hoy</button>
              <button
                onClick={() => setViewMode('usuarios')}
                style={{ padding: '0.35rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: viewMode === 'usuarios' ? 'var(--warning-color)' : 'transparent',
                  color: viewMode === 'usuarios' ? '#fff' : 'var(--text-secondary)'
                }}
              >👥 Usuarios</button>
            </div>
            <span className="subtitle" style={{ fontSize: '0.78rem' }}><User size={13} style={{ display: 'inline', marginRight: '4px' }} />{currentUser.name}</span>
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }} onClick={handleLogout}>Volver al Admin</button>
            ) : (
              <button className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={handleLogout}><LogOut size={15} /></button>
            )}
          </div>
        }
      />

      {/* MODO USUARIOS */}
      {viewMode === 'usuarios' && <UserManagement />}

      {/* MODO VENTAS */}
      {viewMode === 'ventas' && <SalesHistory onViewReceipt={handleViewReceipt} />}

      {/* PRINT RECEIPT COMPONENT (HIDDEN BY DEFAULT, VISIBLE ON PRINT) */}
      <PrintReceipt doc={paidDoc || viewingReceiptDoc} captureMode={isCapturing} />

      {/* MAIN */}
      {viewMode === 'mesas' && (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '1rem', padding: isMobile ? '0.75rem' : '1rem 1.5rem' }}>
        {/* Tables */}
        <div style={{ flex: isMobile ? 1 : 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', flexShrink: 0 }}>
            <button className={`btn ${selectedZone === 'all' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setSelectedZone('all')}>
              Todas ({allActiveTables.length})
            </button>
            {(zones || []).filter(z => z.active).map(z => (
              <button key={z.id} className={`btn ${selectedZone === z.id ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setSelectedZone(z.id)}>
                {z.name} ({allActiveTables.filter(t => t.zoneId === z.id).length})
              </button>
            ))}
          </div>
          
          {pendingOnlineOrders.length > 0 && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 107, 0, 0.1)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--primary-color)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>🔔 Pedidos Online ({pendingOnlineOrders.length})</h3>
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {pendingOnlineOrders.map(o => (
                  <div key={o.id} style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '0.5rem', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{o.customerName}</span>
                      <span style={{ color: o.type === 'delivery' ? 'var(--info-color)' : 'var(--warning-color)' }}>
                        {o.type === 'delivery' ? 'Delivery' : 'Recojo'}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{o.items.length} artículos • S/ {o.total.toFixed(2)}</p>
                    {o.paymentData && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--success-color)', marginBottom: '0.5rem' }}>
                        Pagado con: {o.paymentData.method.toUpperCase()} 
                        {o.paymentData.yapeOp ? ` (Op: ${o.paymentData.yapeOp})` : ''}
                      </p>
                    )}
                    <button 
                      onClick={() => handleApproveOnlineOrder(o)} 
                      className={`btn w-full ${o.status === 'pending_approval' ? 'btn-primary' : 'btn-success'}`} 
                      style={{ padding: '0.5rem', background: o.status !== 'pending_approval' ? 'var(--success-color)' : '' }}
                    >
                      {o.status === 'pending_approval' ? 'Aprobar Delivery' : 'Emitir Comprobante'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.75rem', alignContent: 'start' }}>
            {filteredTables.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Receipt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No hay mesas con cuentas pendientes</p>
              </div>
            ) : filteredTables.map(t => {
              const isLocked = t.cart?.some(item => item.isRecovered);
              const borderColor = isLocked ? '#f59e0b' : (t.hasNew ? 'var(--warning-color)' : 'var(--danger-color)');
              return (
              <div key={t.key} onClick={() => handleOpenTable(t.key)}
                style={{ backgroundColor: 'var(--surface-color)', border: `2px solid ${borderColor}`, borderRadius: 'var(--border-radius)', padding: '1rem', cursor: 'pointer', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: borderColor, borderRadius: '8px 8px 0 0' }} />
                <p className="subtitle" style={{ fontSize: '0.7rem' }}>{t.zone}</p>
                <h3 className="title" style={{ fontSize: '1.1rem', margin: '0.15rem 0 0.5rem' }}>Mesa {t.table}</h3>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>S/{t.total.toFixed(2)}</p>
                <p className="subtitle" style={{ fontSize: '0.75rem' }}>{t.cart.length} producto{t.cart.length !== 1 ? 's' : ''} • ⏱️ {getOccupiedTime(t.cart)}</p>
                {t.hasNew && !isLocked && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'var(--warning-color)', color: '#000', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>PENDIENTE</span>}
                {isLocked && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: '#f59e0b', color: '#fff', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>RE-FACTURACIÓN</span>}
              </div>
            )})}
          </div>
        </div>

        {/* Right: Sales summary (desktop only) */}
        {!isMobile && (
          <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1rem' }}>
              <h3 className="title" style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>📊 Flujo de Caja</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-color)' }}>S/{netCashFlow.toFixed(2)}</p>
              
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ventas:</span>
                  <span>S/{todayTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--success-color)' }}>Ingresos:</span>
                  <span style={{ color: 'var(--success-color)' }}>+S/{totalIncomes.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--danger-color)' }}>Egresos:</span>
                  <span style={{ color: 'var(--danger-color)' }}>-S/{totalExpenses.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', color: 'var(--success-color)', borderColor: 'var(--success-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => handleOpenFlowModal('income')}>
                  <ArrowUpCircle size={14} style={{ marginBottom: '2px' }} /> Ingreso
                </button>
                <button className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => handleOpenFlowModal('expense')}>
                  <ArrowDownCircle size={14} style={{ marginBottom: '2px' }} /> Egreso
                </button>
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h3 className="title" style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>Últimos cobros</h3>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {todaySales.length === 0 ? (
                  <p className="subtitle" style={{ fontSize: '0.78rem', textAlign: 'center', marginTop: '1rem' }}>Sin cobros aún</p>
                ) : [...todaySales].reverse().map((sale, i) => (
                  <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>Mesa {sale.table}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--primary-color)', fontWeight: 700 }}>S/{sale.total.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="subtitle" style={{ fontSize: '0.68rem' }}>{sale.documentNumber || '—'}</span>
                      <span className="subtitle" style={{ fontSize: '0.68rem' }}>{new Date(sale.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── BILLING MODAL ─────────────────────────────────────────── */}
      {selectedTable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '580px', maxHeight: '95vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.25rem', position: 'relative' }}
            className="animate-fade-in"
          >
            {paid && paidDoc ? (
              /* ─ Success ─ */
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle size={64} style={{ color: 'var(--success-color)', marginBottom: '1rem' }} />
                <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>¡Cobrado!</h2>
                <p className="subtitle" style={{ marginBottom: '0.5rem' }}>
                  {paidDoc.documentType === 'boleta' ? 'Boleta' : paidDoc.documentType === 'factura' ? 'Factura' : 'Pedido'}: <strong>{paidDoc.docNumber}</strong>
                </p>
                {paidDoc.customerName && <p className="subtitle" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Cliente: {paidDoc.customerName}</p>}
                <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Total: S/{paidDoc.totalPagar.toFixed(2)}</p>
                {paidDoc.change > 0 && (
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem', marginTop: '0.75rem' }}>
                    <p style={{ color: 'var(--success-color)', fontWeight: 700, fontSize: '1.1rem' }}>Vuelto: S/{paidDoc.change.toFixed(2)}</p>
                  </div>
                )}
                
                {/* ── BOTONES DE DESCARGA E IMPRESIÓN ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={() => showAlert('Descargando XML...')}>
                    <FileText size={20} /> XML
                  </button>
                  <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={() => showAlert('Descargando PDF...')}>
                    <FileDown size={20} /> PDF
                  </button>
                  <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem', fontSize: '0.8rem', gap: '0.3rem' }} onClick={() => window.print()}>
                    <Printer size={20} /> Imprimir
                  </button>
                </div>

                <button className="btn w-full justify-center" onClick={handleClose} style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 600 }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p className="subtitle" style={{ fontSize: '0.72rem' }}>{selectedTable.zone}</p>
                    <h2 className="title" style={{ fontSize: '1.15rem' }}>Facturar — Mesa {selectedTable.table} <span style={{ fontSize: '0.85rem', color: 'var(--warning-color)', marginLeft: '0.5rem' }}>⏱️ {getOccupiedTime(selectedTable.cart)}</span></h2>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '0.35rem' }} onClick={handleClose}><X size={15} /></button>
                </div>

                {/* ── SECCIÓN 1: Empresa y Documento ── */}
                <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <p style={sectionTitle}><Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />Empresa que Factura</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.6rem' }}>
                    <div>
                      <label style={labelStyle}>Empresa</label>
                      {(!companies || companies.length === 0) ? (
                        <div style={{ ...inputStyle, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Sin empresas — configura en Admin
                        </div>
                      ) : (
                        <select style={inputStyle} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                          {(companies || []).filter(c => c.active !== false).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Documento a Emitir</label>
                      <div style={{ display: 'flex', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        {['boleta', 'factura', 'pedido'].map(type => (
                          <button key={type} onClick={() => {
                            setDocumentType(type);
                            setCustomerName('');
                            setCustomerAddress('');
                          }}
                            style={{ flex: 1, padding: '0.45rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.15s',
                              backgroundColor: documentType === type ? 'var(--primary-color)' : 'transparent',
                              color: documentType === type ? '#000' : 'var(--text-secondary)'
                            }}
                          >
                            {type === 'boleta' ? '📄 Boleta' : type === 'factura' ? '🧾 Factura' : '🎟️ Pedidos'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Nº de Documento</label>
                      <div style={{ ...inputStyle, fontWeight: 700, color: 'var(--primary-color)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                        {getDocNumber() || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECCIÓN 2: Datos del Cliente / Motivo Interno ── */}
                <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <p style={sectionTitle}>
                    {documentType === 'pedido' ? <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                    {documentType === 'pedido' ? 'Motivo de la Operación' : 'Datos del Cliente'}
                  </p>

                  {documentType === 'pedido' ? (
                    <div>
                      <label style={labelStyle}>Por qué se está haciendo esto? <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                      <input style={{ ...inputStyle, fontSize: '0.9rem' }} placeholder="Ej. Invitación a mesa 1, Caída de plato..." value={internalReason} onChange={e => setInternalReason(e.target.value)} required />
                    </div>
                  ) : documentType === 'boleta' ? (
                    <div>
                      <label style={labelStyle}>DNI (opcional)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="00000000" maxLength={8} value={customerDni} onChange={e => setCustomerDni(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && handleSearchDni()} />
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={handleSearchDni} disabled={isSearchingDni}>
                          {isSearchingDni ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        </button>
                      </div>
                      {customerName && <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}><strong>Nombre:</strong> {customerName}</p>}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                        <div style={{ width: '100%', minWidth: isMobile ? undefined : '160px', order: isMobile ? 2 : 1 }}>
                          <label style={labelStyle}>Razón Social <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          <input style={inputStyle} placeholder="EMPRESA S.A.C." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        </div>
                        <div style={{ width: '100%', minWidth: isMobile ? undefined : '160px', order: isMobile ? 1 : 2 }}>
                          <label style={labelStyle}>Nº RUC <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input style={{ ...inputStyle, flex: 1 }} placeholder="20XXXXXXXXX" maxLength={11} value={customerRuc} onChange={e => setCustomerRuc(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && handleSearchRuc()} />
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={handleSearchRuc} disabled={isSearchingRuc}>
                              {isSearchingRuc ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Dirección</label>
                        <input style={inputStyle} placeholder="Av. ..." value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SECCIÓN 3: Detalle de Productos ── */}
                <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <p style={{ ...sectionTitle, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Detalle del Pedido</p>
                    <button onClick={() => setShowAddMenu(true)} style={{ background: 'none', border: `1px solid var(--primary-color)`, color: 'var(--primary-color)', padding: '0.2rem 0.5rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Plus size={12} /> Añadir Plato
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'center', padding: '0.3rem 0.25rem' }}>
                          <input type="checkbox" style={{ cursor: 'pointer' }} checked={selectedItemIds.length === selectedTable.cart.length && selectedTable.cart.length > 0} onChange={e => {
                            const isChecked = e.target.checked;
                            setSelectedItemIds(isChecked ? selectedTable.cart.map(c => c.id) : []);
                            if (isChecked) {
                              const qtys = {};
                              selectedTable.cart.forEach(c => qtys[c.id] = c.quantity);
                              setSelectedQuantities(qtys);
                            }
                          }} />
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.3rem 0.25rem', fontWeight: 600 }}>
                          Plato <span style={{fontSize: '0.7rem', color: 'var(--primary-color)', marginLeft: '0.5rem'}}>({selectedItemIds.length}/{selectedTable.cart.length} sel.)</span>
                        </th>
                        <th style={{ textAlign: 'center', padding: '0.3rem 0.25rem', fontWeight: 600 }}>Can.</th>
                        <th style={{ textAlign: 'right', padding: '0.3rem 0.25rem', fontWeight: 600 }}>P.U.</th>
                        <th style={{ textAlign: 'right', padding: '0.3rem 0.25rem', fontWeight: 600 }}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.cart.map((c, i) => {
                        const rowQty = selectedItemIds.includes(c.id) ? (parseFloat(selectedQuantities[c.id]) || c.quantity) : c.quantity;
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px dashed var(--border-color)', opacity: selectedItemIds.includes(c.id) ? 1 : 0.4 }}>
                            <td style={{ padding: '0.35rem 0.25rem', textAlign: 'center' }}>
                              <input type="checkbox" style={{ cursor: 'pointer' }} checked={selectedItemIds.includes(c.id)} onChange={e => {
                                const isChecked = e.target.checked;
                                setSelectedItemIds(prev => isChecked ? [...prev, c.id] : prev.filter(id => id !== c.id));
                                if (isChecked) setSelectedQuantities(prev => ({ ...prev, [c.id]: c.quantity }));
                              }} />
                            </td>
                            <td style={{ padding: '0.35rem 0.25rem', fontWeight: 500 }}>{c.item.name}</td>
                            <td style={{ padding: '0.35rem 0.25rem', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>
                              {selectedItemIds.includes(c.id) ? (
                                <input 
                                  type="number" 
                                  min="0.1" 
                                  step="0.1" 
                                  max={c.quantity} 
                                  value={selectedQuantities[c.id] !== undefined ? selectedQuantities[c.id] : c.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedQuantities(prev => ({ ...prev, [c.id]: val }));
                                  }}
                                  onBlur={(e) => {
                                    let val = parseFloat(e.target.value);
                                    if (isNaN(val) || val <= 0) val = 0.1;
                                    if (val > c.quantity) val = c.quantity;
                                    setSelectedQuantities(prev => ({ ...prev, [c.id]: val }));
                                  }}
                                  style={{ width: '50px', padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                />
                              ) : (
                                c.quantity
                              )}
                            </td>
                            <td style={{ padding: '0.35rem 0.25rem', textAlign: 'right' }}>S/{c.item.price.toFixed(2)}</td>
                            <td style={{ padding: '0.35rem 0.25rem', textAlign: 'right', fontWeight: 600 }}>S/{(c.item.price * rowQty).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>


                </div>

                {/* ── SECCIÓN 4: Totales + Pago ── */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {/* Tax breakdown */}
                  <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.85rem' }}>
                    <p style={sectionTitle}>Resumen Tributario</p>
                    {[
                      { label: 'Valor Venta', value: valorVenta },
                      { label: `IGV (${(IGV_RATE * 100).toFixed(0)}%)`, value: igv },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{row.label}:</span>
                        <span style={{ fontWeight: 600 }}>S/{row.value.toFixed(2)}</span>
                      </div>
                    ))}
                    {appliedDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.82rem', color: 'var(--danger-color)' }}>
                        <span>Descuento Aplicado:</span>
                        <span style={{ fontWeight: 600 }}>-S/{appliedDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', marginTop: '0.25rem', borderTop: '2px solid var(--border-color)', fontSize: '1rem', fontWeight: 700 }}>
                      <span>TOTAL A PAGAR:</span>
                      <span style={{ color: 'var(--primary-color)' }}>S/{totalPagar.toFixed(2)}</span>
                    </div>
                    
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => {
                      setDiscountType('percent'); setDiscountValue(''); setDiscountPin(''); setDiscountError(''); setShowDiscountModal(true);
                    }}>
                      🎁 Aplicar Descuento
                    </button>
                  </div>

                  {/* Payment method */}
                  <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.85rem' }}>
                    <p style={sectionTitle}>{documentType === 'pedido' ? 'Tipo de Operación Interna' : 'Forma de Pago'}</p>

                    {/* Pagos añadidos previamente */}
                    {payments.length > 0 && (
                      <div style={{ marginBottom: '0.8rem' }}>
                        {payments.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '0.4rem 0.6rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '0.3rem', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{p.method}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600 }}>S/{p.amount.toFixed(2)}</span>
                              <button onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><X size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      {(documentType === 'pedido' ? internalPayMethods : payMethods).map(m => (
                        <button key={m.id} onClick={() => setCurrentPaymentMethod(m.id)}
                          style={{ flex: 1, padding: '0.5rem 0.3rem', borderRadius: 'var(--border-radius-sm)', border: `2px solid ${currentPaymentMethod === m.id ? m.color : 'var(--border-color)'}`, backgroundColor: currentPaymentMethod === m.id ? `${m.color}20` : 'transparent', color: currentPaymentMethod === m.id ? m.color : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.15s' }}
                        >
                          <m.icon size={16} />{m.label}
                        </button>
                      ))}
                    </div>

                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                        <label style={{...labelStyle, marginBottom: 0}}>Monto a agregar</label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Restante: S/{Math.max(0, totalPagar - totalPaid).toFixed(2)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--surface-color)', border: `2px solid ${totalPaid >= totalPagar - 0.01 ? 'var(--success-color)' : 'var(--border-color)'}`, borderRadius: 'var(--border-radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>S/</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: totalPaid >= totalPagar - 0.01 ? 'var(--success-color)' : 'var(--text-primary)' }}>
                          {currentAmountReceived !== '' ? currentAmountReceived : (currentPaymentMethod === 'efectivo' ? '0' : remainingTotal.toFixed(2))}
                        </span>
                      </div>
                      
                      {currentPaymentMethod === 'efectivo' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginBottom: '0.4rem' }}>
                            {['1','2','3','4','5','6','7','8','9','.','0','C'].map(n => (
                              <button key={n} onClick={() => handleNumpad(n)}
                                style={{ padding: '0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: n === 'C' ? 'rgba(255,71,87,0.12)' : 'var(--surface-color)', color: n === 'C' ? 'var(--danger-color)' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                              >{n}</button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {[10, 20, 50, 100].map(amt => (
                              <button key={amt} onClick={() => setCurrentAmountReceived(String(amt))}
                                style={{ flex: 1, padding: '0.35rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                              >S/{amt}</button>
                            ))}
                            <button onClick={() => setCurrentAmountReceived(remainingTotal.toFixed(2))}
                              style={{ flex: 1, padding: '0.35rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--primary-color)', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >Exacto</button>
                          </div>
                        </>
                      )}

                      <button onClick={handleAddPayment} style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Plus size={14} /> Agregar otro pago
                      </button>

                      {totalPaid >= totalPagar && change > 0 && cashPaid > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--success-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.5rem 0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success-color)' }}>Vuelto a entregar</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success-color)' }}>S/{change.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  </div>
                </div>

                {/* Validation hint */}
                {documentType === 'factura' && (!customerRuc || customerRuc.length !== 11 || !customerName.trim()) && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning-color)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    ⚠️ Para Factura se requiere RUC (11 dígitos) y Razón Social
                  </p>
                )}
                {documentType === 'pedido' && !internalReason.trim() && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning-color)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    ⚠️ Debes ingresar el motivo de esta operación interna.
                  </p>
                )}

                {/* Print Pre-cuenta button */}
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem', fontSize: '0.9rem', fontWeight: 600, backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                  onClick={handlePrintPrecuenta}
                  disabled={selectedItemIds.length === 0}
                >
                  <Printer size={18} style={{ color: 'var(--primary-color)' }} /> 
                  IMPRIMIR PRE-CUENTA
                </button>

                {/* Pay button */}
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, backgroundColor: canPay ? '#10B981' : 'var(--border-color)', color: canPay ? '#fff' : 'var(--text-secondary)', cursor: canPay ? 'pointer' : 'not-allowed', transition: 'all 0.2s', borderRadius: 'var(--border-radius-sm)', border: 'none' }}
                  onClick={handlePay}
                  disabled={!canPay}
                >
                  <CheckCircle size={18} /> 
                  {selectedItemIds.length === selectedTable.cart.length ? 'COBRAR TODO' : 'COBRAR SELECCIÓN'} — S/{totalPagar.toFixed(2)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DISCOUNT MODAL ─────────────────────────────────────────── */}
      {showDiscountModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '350px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.25rem', position: 'relative' }} className="animate-fade-in">
            <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Aplicar Descuento</h2>
            <button className="btn btn-outline" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.35rem' }} onClick={() => setShowDiscountModal(false)}><X size={15} /></button>
            
            <form onSubmit={handleApplyDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Tipo de Descuento</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className={`btn ${discountType === 'percent' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setDiscountType('percent')}>Porcentaje (%)</button>
                  <button type="button" className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setDiscountType('fixed')}>Monto Fijo (S/)</button>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Valor</label>
                <input type="number" step="0.01" style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 'bold' }} placeholder="0.00" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required autoFocus />
              </div>

              <div>
                <label style={labelStyle}>PIN de Administrador</label>
                <input type="password" style={inputStyle} placeholder="****" value={discountPin} onChange={e => setDiscountPin(e.target.value)} required />
              </div>

              {discountError && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', textAlign: 'center' }}>{discountError}</p>}
              
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                Aplicar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FLOW MODAL (Ingresos/Egresos) ─────────────────────────────────────────── */}
      {showFlowModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: '90vw', maxWidth: '400px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius)', padding: '1.25rem', position: 'relative' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {flowType === 'income' ? <ArrowUpCircle size={24} color="var(--success-color)" /> : <ArrowDownCircle size={24} color="var(--danger-color)" />}
                <h2 className="title" style={{ fontSize: '1.2rem', color: flowType === 'income' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  Registrar {flowType === 'income' ? 'Ingreso' : 'Egreso'}
                </h2>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.35rem' }} onClick={() => setShowFlowModal(false)}><X size={15} /></button>
            </div>

            <form onSubmit={handleSaveFlow} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select style={inputStyle} value={flowCategory} onChange={(e) => setFlowCategory(e.target.value)}>
                  {(flowType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Monto (S/)</label>
                <input 
                  type="number" step="0.01" style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 'bold' }} 
                  placeholder="0.00" value={flowAmount} onChange={(e) => setFlowAmount(e.target.value)} required autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>Detalles (opcional)</label>
                <input 
                  type="text" style={inputStyle} 
                  placeholder="Ej. Pago por mercadería..." value={flowDetails} onChange={(e) => setFlowDetails(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Método de Pago</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {payMethods.map(m => (
                    <button type="button" key={m.id} onClick={() => setFlowPaymentMethod(m.id)}
                      style={{ flex: 1, padding: '0.5rem 0.3rem', borderRadius: 'var(--border-radius-sm)', border: `2px solid ${flowPaymentMethod === m.id ? m.color : 'var(--border-color)'}`, backgroundColor: flowPaymentMethod === m.id ? `${m.color}20` : 'transparent', color: flowPaymentMethod === m.id ? m.color : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.15s' }}
                    >
                      <m.icon size={16} />{m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', backgroundColor: flowType === 'income' ? 'var(--success-color)' : 'var(--danger-color)', color: '#000', width: '100%' }}>
                <CheckCircle size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} /> 
                Confirmar {flowType === 'income' ? 'Ingreso' : 'Egreso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW RECEIPT MODAL ────────────────────────────────────── */}
      {viewingReceiptDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Detalle de Comprobante</h2>
            <p className="subtitle mb-4">
              {viewingReceiptDoc.documentType.toUpperCase()} {viewingReceiptDoc.docNumber}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem' }} onClick={() => window.print()}>
                <Receipt size={20} style={{ display: 'inline', marginRight: '0.5rem' }} /> Imprimir Copia
              </button>
              <button className="btn" style={{ padding: '0.8rem', fontSize: '1rem', backgroundColor: '#25D366', color: '#fff' }} onClick={handleShareWhatsApp} disabled={isCapturing}>
                {isCapturing ? <Loader2 size={20} className="spin" style={{ display: 'inline', marginRight: '0.5rem' }} /> : <Share2 size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />}
                Compartir en WhatsApp
              </button>
              <button className="btn btn-outline" style={{ padding: '0.8rem', fontSize: '1rem' }} onClick={() => setViewingReceiptDoc(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ─────────────────────────────────────────── */}
      {paid && paidDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success-color)', marginBottom: '1rem' }}>
              <CheckCircle size={32} />
            </div>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>¡Cobro Exitoso!</h2>
            <p className="subtitle mb-4">La cuenta ha sido pagada y registrada.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem' }} onClick={() => window.print()}>
                <Receipt size={20} style={{ display: 'inline', marginRight: '0.5rem' }} /> Imprimir Comprobante
              </button>
              <button className="btn" style={{ padding: '0.8rem', fontSize: '1rem', backgroundColor: '#25D366', color: '#fff' }} onClick={handleShareWhatsApp} disabled={isCapturing}>
                {isCapturing ? <Loader2 size={20} className="spin" style={{ display: 'inline', marginRight: '0.5rem' }} /> : <Share2 size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />}
                Compartir en WhatsApp
              </button>
              <button className="btn btn-outline" style={{ padding: '0.8rem', fontSize: '1rem' }} onClick={() => {
                setPaid(false);
                setPaidDoc(null);
                setSelectedTableKey(null);
              }}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELIVERY APPROVAL MODAL ──────────────────────────────────────── */}
      {selectedDeliveryOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 className="title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Aprobar Delivery</h2>
              <button onClick={() => setSelectedDeliveryOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Datos del Cliente</h4>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDeliveryOrder.customerName}</p>
              <p style={{ margin: '0 0 0.2rem', color: 'var(--text-primary)' }}>📞 {selectedDeliveryOrder.customerPhone}</p>
              <p style={{ margin: '0', color: 'var(--text-primary)', background: 'var(--surface-solid)', padding: '0.5rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>📍 {selectedDeliveryOrder.address}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pedido ({selectedDeliveryOrder.items.length} items)</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedDeliveryOrder.items.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    <span>{item.quantity}x {item.item.name}</span>
                    <span style={{ fontWeight: 600 }}>S/ {(item.item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>Subtotal Pedido</span>
                <span>S/ {selectedDeliveryOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--surface-solid)', padding: '1rem', borderRadius: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Costo de Delivery (S/)</label>
              <input 
                type="number" 
                className="input w-full" 
                placeholder="Ej. 10.00" 
                value={deliveryFee} 
                onChange={e => setDeliveryFee(e.target.value)}
                autoFocus
                style={{ fontSize: '1.2rem', padding: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}
              />
            </div>

            <button 
              className="btn btn-primary w-full" 
              style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 700 }}
              onClick={confirmDeliveryApproval}
            >
              Aprobar y Confirmar Precio
            </button>
          </div>
        </div>
      )}

      {/* Arqueo Ciego Modal */}
      {showCloseCajaModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <button onClick={() => setShowCloseCajaModal(false)} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}>
              <X size={20} />
            </button>
            
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

            <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.05))', color: 'var(--primary-color)', marginBottom: '1.25rem', border: '1px solid rgba(255,107,0,0.3)', boxShadow: '0 0 25px rgba(255,107,0,0.2)' }}>
                <DollarSign size={36} />
              </div>
              <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #ffd8a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cierre de Turno</h2>
              <p className="subtitle" style={{ fontSize: '0.95rem' }}>Arqueo Ciego: Digita el monto físico (efectivo) que hay actualmente en tu gaveta.</p>
            </div>
            
            <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <label style={{ ...labelStyle, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Monto Físico (Efectivo)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 2 }}>S/</span>
                <input
                  type="number"
                  step="0.10"
                  className="input text-center"
                  placeholder="0.00"
                  style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.5rem', fontWeight: 700, height: '3.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,107,0,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
                  value={efectivoGavetaInput}
                  onChange={(e) => setEfectivoGavetaInput(e.target.value)}
                  disabled={diferenciaCaja !== null}
                />
              </div>
            </div>

            {diferenciaCaja !== null && (
              <div style={{ padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--border-radius)', border: `1px solid ${diferenciaCaja < 0 ? 'var(--danger-color)' : 'var(--success-color)'}`, marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                <p style={{ color: diferenciaCaja < 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold', fontSize: '1.25rem', textAlign: 'center', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {diferenciaCaja < 0 ? '¡Faltante de Caja!' : '¡Sobrante de Caja!'}
                </p>
                <p style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: diferenciaCaja < 0 ? 'var(--danger-color)' : 'var(--success-color)', marginBottom: '0.5rem' }}>
                  S/ {Math.abs(diferenciaCaja).toFixed(2)}
                </p>
                <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  El sistema detectó una diferencia con el saldo teórico de ventas del día.
                </p>
                <label style={{ ...labelStyle, color: 'var(--text-secondary)' }}>Justificación Obligatoria</label>
                <textarea
                  className="input w-full"
                  rows="3"
                  placeholder="Explica el motivo exacto del descuadre..."
                  value={justificacionInput}
                  onChange={(e) => setJustificacionInput(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', resize: 'none' }}
                ></textarea>
              </div>
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
              {diferenciaCaja === null ? (
                <button 
                  className="btn btn-primary w-full justify-center" 
                  onClick={handleCalculateCloseCaja}
                  style={{ padding: '0.9rem', fontSize: '1.1rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(255,107,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Calcular y Cerrar Caja
                </button>
              ) : (
                <button 
                  className="btn btn-danger w-full justify-center" 
                  onClick={handleConfirmCloseCaja}
                  style={{ padding: '0.9rem', fontSize: '1.1rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(239,68,68,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Confirmar Descuadre y Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Añadir Producto</h3>
              <button onClick={() => setShowAddMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Buscar producto por nombre..." 
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(menu || [])
                .filter(m => m.active && (m.name || '').toLowerCase().includes(menuSearch.toLowerCase()))
                .map(item => (
                  <button 
                    key={item.id}
                    onClick={() => handleAddProduct(item)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.categoryId}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>S/{item.price.toFixed(2)}</div>
                  </button>
              ))}
              {menuSearch && menu.filter(m => m.active && (m.name || '').toLowerCase().includes(menuSearch.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No se encontraron productos que coincidan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── APERTURA DE CAJA MODAL ── */}
      {!businessDay?.cajaDetails?.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

            {aperturaStep === 'input' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', color: 'var(--success-color)', marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 25px rgba(16,185,129,0.2)' }}>
                    <DollarSign size={36} />
                  </div>
                  <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Apertura de Caja</h2>
                  <p className="subtitle" style={{ fontSize: '0.95rem' }}>Para comenzar a cobrar, ingresa el fondo de caja con el que inicias tu turno.</p>
                </div>
                
                <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Fondo Inicial (S/)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--success-color)', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 2 }}>S/</span>
                    <input 
                      type="number" 
                      step="0.10"
                      className="input"
                      style={{ paddingLeft: '3rem', fontSize: '1.4rem', fontWeight: 700, height: '3.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
                      value={fondoInicialInput}
                      onChange={e => setFondoInicialInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleOpenCajaSubmit()}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <button 
                    className="btn btn-success w-full justify-center" 
                    style={{ padding: '0.9rem', fontSize: '1.1rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(16,185,129,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    onClick={handleOpenCajaSubmit}
                    disabled={!fondoInicialInput || parseFloat(fondoInicialInput) < 0}
                  >
                    Validar Caja
                  </button>
                  {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
                    <button 
                      className="btn btn-outline w-full justify-center" 
                      style={{ padding: '0.8rem', fontSize: '0.95rem', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={handleLogout}
                    >
                      Volver al Admin
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline w-full justify-center" 
                      style={{ padding: '0.8rem', fontSize: '0.95rem', marginTop: '1rem', color: 'var(--danger-color)', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  )}
                </div>
              </>
            )}

            {aperturaStep === 'justificarExceso' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', color: 'var(--warning-color)', marginBottom: '1.25rem', border: '1px solid rgba(234,179,8,0.3)', boxShadow: '0 0 25px rgba(234,179,8,0.2)' }}>
                    <AlertTriangle size={36} />
                  </div>
                  <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--warning-color)' }}>Sobra Dinero</h2>
                  <p className="subtitle" style={{ fontSize: '0.95rem' }}>Estás iniciando con <strong>S/ {Math.abs(aperturaDiff).toFixed(2)} MÁS</strong> del efectivo declarado en el cierre anterior.</p>
                </div>
                
                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Justificación del excedente (Obligatorio)</label>
                  <input 
                    type="text" 
                    className="input"
                    style={{ ...inputStyle, width: '100%', background: 'rgba(0,0,0,0.2)' }}
                    value={aperturaJustificacion}
                    onChange={e => setAperturaJustificacion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aperturaJustificacion.trim() && handleOpenConDescuadre()}
                    placeholder="Ej. Sencillo agregado..."
                    autoFocus
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAperturaStep('input')}>Volver</button>
                  <button className="btn btn-warning" style={{ flex: 1 }} onClick={handleOpenConDescuadre} disabled={!aperturaJustificacion.trim()}>Abrir Caja</button>
                </div>
              </>
            )}

            {aperturaStep === 'recontarFaltante' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))', color: 'var(--danger-color)', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 25px rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={36} />
                  </div>
                  <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>Falta Dinero</h2>
                  <p className="subtitle" style={{ fontSize: '0.95rem' }}>Estás iniciando con <strong>S/ {Math.abs(aperturaDiff).toFixed(2)} MENOS</strong> del efectivo declarado en el cierre anterior.</p>
                  <p className="subtitle" style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Por favor vuelve a contar el dinero o indica si se realizó un retiro de ganancias.</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                  <button className="btn btn-primary w-full" style={{ padding: '0.9rem', fontSize: '1rem' }} onClick={() => setAperturaStep('input')}>Volver a Contar</button>
                  <button className="btn btn-outline w-full" style={{ padding: '0.9rem', fontSize: '1rem', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger-color)' }} onClick={() => setAperturaStep('justificarFaltante')}>Sigue Faltando / Hubo Retiro</button>
                </div>
              </>
            )}

            {aperturaStep === 'justificarFaltante' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <h2 className="title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>Justificar Diferencia</h2>
                  <p className="subtitle" style={{ fontSize: '0.85rem' }}>Ingresa el motivo del faltante o si se retiró dinero.</p>
                </div>
                
                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <input 
                    type="text" 
                    className="input"
                    style={{ ...inputStyle, width: '100%', background: 'rgba(0,0,0,0.2)' }}
                    value={aperturaJustificacion}
                    onChange={e => setAperturaJustificacion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aperturaJustificacion.trim() && handleOpenConDescuadre()}
                    placeholder="Ej. Retiro de ganancias S/200..."
                    autoFocus
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAperturaStep('recontarFaltante')}>Volver</button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleOpenConDescuadre} disabled={!aperturaJustificacion.trim()}>Abrir Caja</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
