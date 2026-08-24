const fs = require('fs');
let code = fs.readFileSync('src/pages/Inventario.jsx', 'utf8');

// Import CustomCreatableSelect
if (!code.includes('CustomCreatableSelect')) {
    code = code.replace(/import CustomSelect from '\.\.\/components\/CustomSelect';/g, "import CustomSelect from '../components/CustomSelect';\nimport CustomCreatableSelect from '../components/CustomCreatableSelect';");
}

// Replace Category input + datalist
code = code.replace(/<input type=\"text\" list=\"category-list\"[\s\S]*?<\/datalist>/g, "<CustomCreatableSelect value={catalogForm.category} onChange={v => setCatalogForm({...catalogForm, category: v})} options={Array.from(new Set(catalog.map(c => c.category))).filter(Boolean).map(c => ({value: c, label: c}))} />");

// Replace Unit input + datalist
code = code.replace(/<input type=\"text\" list=\"unit-list\"[\s\S]*?<\/datalist>/g, "<CustomCreatableSelect value={catalogForm.unit_of_measure} onChange={v => setCatalogForm({...catalogForm, unit_of_measure: v})} options={Array.from(new Set([...catalog.map(c => c.unit_of_measure), 'UNIDAD', 'KG', 'LITRO', 'PRESA'])).filter(Boolean).map(u => ({value: u, label: u}))} />");

// Replace Reason input + datalist
code = code.replace(/<input type=\"text\" list=\"reason-list\"[\s\S]*?<\/datalist>/g, "<CustomCreatableSelect value={consumeForm.reason} onChange={v => setConsumeForm({...consumeForm, reason: v})} options={[{value: 'MERMA / DESPERDICIO', label: 'MERMA / DESPERDICIO'},{value: 'TRASPASO A BARRA', label: 'TRASPASO A BARRA'},{value: 'TRASPASO A COCINA', label: 'TRASPASO A COCINA'},{value: 'VENCIMIENTO', label: 'VENCIMIENTO'},{value: 'USO INTERNO', label: 'USO INTERNO'}]} />");

fs.writeFileSync('src/pages/Inventario.jsx', code, 'utf8');
console.log('Done');
