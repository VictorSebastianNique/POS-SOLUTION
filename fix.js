const fs = require('fs');
let code = fs.readFileSync('src/pages/Inventario.jsx', 'utf8');

// 1. Update handleScan
code = code.replace(/setBatchForm\(\{ \.\.\.batchForm, product_barcode: decodedText \}\);\n    \}/g, "setBatchForm({ ...batchForm, product_barcode: decodedText });\n    } else if (scannerTarget === 'consume') {\n      setConsumeForm({ ...consumeForm, product_barcode: decodedText });\n    }");

// 2. Add Registrar Salida button
code = code.replace(/<button className=\"btn btn-primary flex items-center gap-2\" onClick=\{.*?setBatchForm.*?setShowBatchModal\(true\);.*?\}\s*>\s*<Plus size=\{18\} \/> Recibir Lote\s*<\/button>/s, '<button className=\"btn btn-outline flex items-center gap-2\" onClick={() => { setConsumeForm({ product_barcode: \'\', quantity: 1, reason: \'MERMA / DESPERDICIO\' }); setShowConsumeModal(true); }}>\n                <ArrowDown size={18} /> Registrar Salida\n              </button>\n              $&');
code = code.replace(/<div className=\"flex justify-end mb-4\">\s*<button className=\"btn btn-outline flex items-center gap-2\" onClick=\{\(\) => \{ setConsumeForm/s, '<div className=\"flex justify-end mb-4 gap-2\">\n              <button className=\"btn btn-outline flex items-center gap-2\" onClick={() => { setConsumeForm');

// 3. Category datalist
code = code.replace(/<label className=\"block text-sm mb-1 text-\[var\(--text-secondary\)\]\">Categoría<\/label>\s*<input type=\"text\" className=\"input w-full\" value=\{catalogForm\.category\} onChange=\{e => setCatalogForm\(\{\.\.\.catalogForm, category: e\.target\.value\}\)\} required \/>/g, '<label className=\"block text-sm mb-1 text-[var(--text-secondary)]\">Categoría</label>\n                    <input type=\"text\" list=\"category-list\" className=\"input w-full\" value={catalogForm.category} onChange={e => setCatalogForm({...catalogForm, category: e.target.value})} required placeholder=\"Ej. Bebidas\" />\n                    <datalist id=\"category-list\">\n                      {Array.from(new Set(catalog.map(c => c.category))).filter(Boolean).map(cat => <option key={cat} value={cat} />)}\n                    </datalist>');

// 3b. Unit datalist
code = code.replace(/<CustomSelect\s*value=\{catalogForm\.unit_of_measure\}\s*onChange=\{v => setCatalogForm\(\{\.\.\.catalogForm, unit_of_measure: v\}\)\}\s*options=\{\[\{value:\'UNIDAD\',label:\'Unidad\'\}, \{value:\'KG\',label:\'Kilogramo\'\}, \{value:\'LITRO\',label:\'Litro\'\}, \{value:\'PRESA\',label:\'Presa\'\}\]\}\s*\/>/g, '<input type=\"text\" list=\"unit-list\" className=\"input w-full\" value={catalogForm.unit_of_measure} onChange={e => setCatalogForm({...catalogForm, unit_of_measure: e.target.value})} required placeholder=\"Ej. UNIDAD, KG\" />\n                    <datalist id=\"unit-list\">\n                      {Array.from(new Set([...catalog.map(c => c.unit_of_measure), \'UNIDAD\', \'KG\', \'LITRO\'])).filter(Boolean).map(u => <option key={u} value={u} />)}\n                    </datalist>');

// 4. Imprimir etiqueta button next to Generar
code = code.replace(/<button type=\"button\" className=\"btn btn-outline flex items-center gap-1\" onClick=\{generateInternalBarcode\} title=\"Generar código interno para insumos sin código\">\s*<Barcode size=\{18\} \/> Generar\s*<\/button>/g, '$&\n                    {catalogForm.barcode && (\n                      <button type=\"button\" className=\"btn btn-primary flex items-center gap-1\" onClick={() => handlePrintBarcode(catalogForm)} title=\"Imprimir etiqueta\">\n                        <Printer size={18} />\n                      </button>\n                    )}');

// 5. Add the consume modal at the end
const consumeModal =         {showConsumeModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className=\"card animate-fade-in\" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--border-radius)' }}>
              <h2 className=\"text-xl font-bold mb-6\">Registrar Salida / Merma</h2>
              <form onSubmit={handleConsume} className=\"flex flex-col gap-4\">
                <div>
                  <label className=\"block text-sm mb-1 text-[var(--text-secondary)]\">Producto</label>
                  <div className=\"flex gap-2\">
                    <select className=\"input flex-1\" value={consumeForm.product_barcode} onChange={e => setConsumeForm({...consumeForm, product_barcode: e.target.value})} required>
                      <option value=\"\">Seleccione un producto...</option>
                      {catalog.map(c => <option key={c.barcode} value={c.barcode}>{c.name} ({c.barcode})</option>)}
                    </select>
                    <button type=\"button\" className=\"btn btn-outline p-0 w-12 flex items-center justify-center\" onClick={() => { setScannerTarget('consume'); setShowScanner(true); }}>
                      <ScanBarcode size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className=\"block text-sm mb-1 text-[var(--text-secondary)]\">Cantidad a retirar</label>
                  <input type=\"number\" step=\"0.01\" min=\"0.01\" className=\"input w-full\" value={consumeForm.quantity} onChange={e => setConsumeForm({...consumeForm, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className=\"block text-sm mb-1 text-[var(--text-secondary)]\">Motivo (Referencia)</label>
                  <input type=\"text\" list=\"reason-list\" className=\"input w-full\" value={consumeForm.reason} onChange={e => setConsumeForm({...consumeForm, reason: e.target.value})} required />
                  <datalist id=\"reason-list\">
                    <option value=\"MERMA / DESPERDICIO\" />
                    <option value=\"TRASPASO A BARRA\" />
                    <option value=\"TRASPASO A COCINA\" />
                    <option value=\"VENCIMIENTO\" />
                    <option value=\"USO INTERNO\" />
                  </datalist>
                </div>
                <div className=\"flex justify-end gap-2 mt-4\">
                  <button type=\"button\" className=\"btn btn-outline\" onClick={() => setShowConsumeModal(false)}>Cancelar</button>
                  <button type=\"submit\" className=\"btn btn-primary flex items-center gap-2\">
                    <Save size={18} /> Registrar Salida
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}\n;
code = code.replace(/(?=\s*\{showScanner &&)/, consumeModal);

fs.writeFileSync('src/pages/Inventario.jsx', code, 'utf8');
