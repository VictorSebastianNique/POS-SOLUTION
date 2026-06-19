const fs = require('fs');

const files = ['./src/pages/Admin.jsx', './src/pages/Mozo.jsx', './src/pages/Cocina.jsx', './src/pages/Bar.jsx', './src/pages/Caja.jsx'];

files.forEach(path => {
  let content = fs.readFileSync(path, 'utf8');

  // Add developerSettings to useStore destructuring
  content = content.replace(/const \{([^}]+)\} = useStore\(\);/, (match, group1) => {
    if (!group1.includes('developerSettings')) {
      return `const {${group1}, developerSettings } = useStore();`;
    }
    return match;
  });

  // Replace handleLogout logic
  // Admin uses: const handleLogout = () => { logout(); const locId = ... }
  // Others use: const handleLogout = () => { if (currentUser.role === 'admin' || currentUser.role === 'superadmin') { navigate('/admin'); } else { const role = currentUser?.role; const locId = localStorage.getItem('currentLocationId'); logout(); if (role === 'superadmin') { navigate('/super-admin'); } else { navigate(locId ? ...); } } };

  // For Mozo, Cocina, Bar, Caja:
  content = content.replace(
    /const handleLogout = \(\) => \{\s*if \(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \{\s*navigate\('\/admin'\);\s*\} else \{\s*const role = currentUser\?\.role;\s*const locId = localStorage\.getItem\('currentLocationId'\);\s*logout\(\);\s*if \(role === 'superadmin'\) \{\s*navigate\('\/super-admin'\);\s*\} else \{\s*navigate\(locId \? `\/login\/\$\\{encodeURIComponent\(locId\)\\}` : '\/'\);\s*\}\s*\}\s*\};/g,
    `const handleLogout = () => { 
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') { 
      navigate('/admin'); 
    } else { 
      const role = currentUser?.role; 
      const locId = localStorage.getItem('currentLocationId'); 
      const isIncognito = developerSettings?.isSuperAdminIncognito;
      logout(); 
      if (role === 'superadmin' && !isIncognito) { 
        navigate('/super-admin'); 
      } else { 
        navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); 
      } 
    } 
  };`
  );

  // For Admin:
  content = content.replace(
    /const handleLogout = \(\) => \{\s*logout\(\);\s*const locId = localStorage\.getItem\('currentLocationId'\);\s*if \(currentUser\.role === 'superadmin'\) \{\s*navigate\('\/super-admin'\);\s*\} else \{\s*navigate\(locId \? `\/login\/\$\\{encodeURIComponent\(locId\)\\}` : '\/'\);\s*\}\s*\};/g,
    `const handleLogout = () => {
    logout();
    const locId = localStorage.getItem('currentLocationId');
    const isIncognito = developerSettings?.isSuperAdminIncognito;
    if (currentUser.role === 'superadmin' && !isIncognito) {
      navigate('/super-admin');
    } else {
      navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/');
    }
  };`
  );
  
  // Also fix the useEffect redirection that might send a superadmin to /super-admin on reload if logged out
  // In Mozo, Bar, Caja, Cocina:
  // if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); if (lastRole === 'superadmin') { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? ... : '/'); } return; }
  content = content.replace(
    /if \(!currentUser\) \{ const lastRole = localStorage\.getItem\('lastRole'\); if \(lastRole === 'superadmin'\) \{ navigate\('\/super-admin'\); \} else \{ const locId = localStorage\.getItem\('currentLocationId'\); navigate\(locId \? `\/login\/\$\\{encodeURIComponent\(locId\)\\}` : '\/'\); \} return; \}/g,
    `if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); const isIncognito = developerSettings?.isSuperAdminIncognito; if (lastRole === 'superadmin' && !isIncognito) { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); } return; }`
  );

  // In Admin:
  content = content.replace(
    /if \(!currentUser\) \{\s*const lastRole = localStorage\.getItem\('lastRole'\);\s*if \(lastRole === 'superadmin'\) \{\s*navigate\('\/super-admin'\);\s*\} else \{\s*const locId = localStorage\.getItem\('currentLocationId'\);\s*navigate\(locId \? `\/login\/\$\\{encodeURIComponent\(locId\)\\}` : '\/'\);\s*\}\s*return;\s*\}/g,
    `if (!currentUser) {
      const lastRole = localStorage.getItem('lastRole');
      const isIncognito = developerSettings?.isSuperAdminIncognito;
      if (lastRole === 'superadmin' && !isIncognito) {
        navigate('/super-admin');
      } else {
        const locId = localStorage.getItem('currentLocationId');
        navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/');
      }
      return;
    }`
  );

  fs.writeFileSync(path, content);
  console.log('Fixed:', path);
});
