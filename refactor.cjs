const fs = require('fs');

const files = [
  'src/pages/Kardex.jsx',
  'src/pages/Admin.jsx',
  'src/pages/Caja.jsx',
  'src/pages/Mozo.jsx',
  'src/pages/CustomerApp.jsx',
  'src/components/CrmTab.jsx',
  'src/pages/DeveloperConfig.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if not exists
  const importPath = file.includes('components') ? '../context/AlertContext' : '../context/AlertContext';
  if (!content.includes('useAlert')) {
    content = content.replace(/(import React.*?;\n)/, '$1import { useAlert } from \'' + importPath + '\';\n');
  }
  
  // Replace alert( with showAlert(
  // and handle type appropriately
  content = content.replace(/alert\(/g, 'showAlert(');
  
  // Add const { showAlert } = useAlert(); inside the component
  const compRegex = /(export default function \w+\(.*?\)\s*\{|const \w+ = \(.*?\)\s*=>\s*\{)/;
  if (compRegex.test(content) && !content.includes('const { showAlert } = useAlert();')) {
    content = content.replace(compRegex, '$1\n  const { showAlert } = useAlert();');
  }

  fs.writeFileSync(file, content);
});

// Also fix App.jsx
let appContent = fs.readFileSync('src/App.jsx', 'utf8');
if (!appContent.includes('AlertProvider')) {
  appContent = appContent.replace("import { useStore } from './context/StoreContext';", "import { useStore } from './context/StoreContext';\nimport { AlertProvider } from './context/AlertContext';");
  appContent = appContent.replace("<BrowserRouter>", "<AlertProvider>\n      <BrowserRouter>");
  appContent = appContent.replace("</BrowserRouter>", "</BrowserRouter>\n    </AlertProvider>");
  fs.writeFileSync('src/App.jsx', appContent);
}

console.log('Done refactoring alerts.');
