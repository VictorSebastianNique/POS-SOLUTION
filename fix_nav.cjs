const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');

  // Fix the syntax error: `if () navigate('/');`
  // We need to look up what the condition was originally.
  // Actually, I can just restore it manually or rewrite it using AST or simpler replacements.
  // The conditions were:
  // Admin.jsx: currentUser.role !== 'admin' && currentUser.role !== 'superadmin'
  // Mozo.jsx: currentUser.role !== 'mozo' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'
  // Caja.jsx: currentUser.role !== 'cajera' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'
  // Cocina.jsx: currentUser.role !== 'cocina' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'
  // Bar.jsx: currentUser.role !== 'bar' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'

  const roleMap = {
    'Admin.jsx': "currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
    'Mozo.jsx': "currentUser.role !== 'mozo' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
    'Caja.jsx': "currentUser.role !== 'cajera' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
    'Cocina.jsx': "currentUser.role !== 'cocina' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
    'Bar.jsx': "currentUser.role !== 'bar' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
  };

  const filename = path.split('/').pop();
  const cond = roleMap[filename];

  // Fix useEffect
  content = content.replace(/if \(!currentUser\) \{ const locId = localStorage\.getItem\('currentLocationId'\); navigate\(locId \? \/login\/ \: '\/'\); return; \} if \(\) navigate\('\/'\);/, 
    `if (!currentUser) { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); return; } if (${cond}) navigate('/');`
  );
  
  // Fix logout
  // For Bar.jsx, Cocina.jsx, Mozo.jsx, Admin.jsx, Caja.jsx
  // "const role = currentUser?.role; logout(); if (role === 'superadmin') setTimeout(() => navigate('/super-admin'), 10);"
  // If we just change it to properly navigate to local or superadmin:
  content = content.replace(/const role = currentUser\?\.role; logout\(\); if \(role === 'superadmin'\) setTimeout\(\(\) => navigate\('\/super-admin'\), 10\);/g, 
    `const role = currentUser?.role; const locId = currentUser?.locationId; logout(); if (role === 'superadmin') { setTimeout(() => navigate('/super-admin'), 10); } else { setTimeout(() => navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'), 10); }`
  );

  fs.writeFileSync(path, content);
};

['Admin.jsx', 'Mozo.jsx', 'Caja.jsx', 'Cocina.jsx', 'Bar.jsx'].forEach(f => fixFile('./src/pages/' + f));
console.log('Fixed syntax errors');
