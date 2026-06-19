const fs = require('fs');

const files = ['./src/pages/Admin.jsx', './src/pages/Caja.jsx', './src/pages/Mozo.jsx', './src/pages/Cocina.jsx', './src/pages/Bar.jsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix the useEffect dependency
  content = content.replace(/}, \[currentUser, navigate\]\);/g, '}, [currentUser, navigate, developerSettings]);');

  // Fix the actual useEffect logic for Mozo, Caja, Cocina, Bar
  if (file !== './src/pages/Admin.jsx') {
    let match = content.match(/if \(\!currentUser\) \{ const lastRole = [^]+?return; \}/);
    if (match) {
      content = content.replace(
        match[0], 
        `if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); } return; }`
      );
    }
  }

  fs.writeFileSync(file, content);
  console.log('Fixed:', file);
});
