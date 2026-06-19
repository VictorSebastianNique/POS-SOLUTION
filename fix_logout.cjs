const fs = require('fs');

const fixContext = () => {
  const path = './src/context/StoreContext.jsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /const logout = \(\) => \{ setCurrentUser\(null\); localStorage\.removeItem\('currentUserData'\); \};/,
    `const logout = () => { if (currentUser) { localStorage.setItem('lastRole', currentUser.role); } setCurrentUser(null); localStorage.removeItem('currentUserData'); };`
  );
  fs.writeFileSync(path, content);
}
fixContext();

const fixFile = (path, cond) => {
  let content = fs.readFileSync(path, 'utf8');

  // Fix useEffect
  // The current useEffect is: 
  // if (!currentUser) { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? `/login/${encodeURIComponent(locId)}` : '/'); return; } if (COND) navigate('/');
  const oldStr = `if (!currentUser) { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); return; }`;
  const newStr = `if (!currentUser) { const lastRole = localStorage.getItem('lastRole'); if (lastRole === 'superadmin') { navigate('/super-admin'); } else { const locId = localStorage.getItem('currentLocationId'); navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); } return; }`;
  
  // Actually we can just do a regex replace over the exact string
  content = content.replace(/if \(!currentUser\) \{ const locId = localStorage\.getItem\('currentLocationId'\); navigate\(locId \? `\/login\/\$\{encodeURIComponent\(locId\)\}` : '\/'\); return; \}/, newStr);

  // We should also revert `handleLogout` to simply `logout();` because `useEffect` will handle the redirection!
  // It's cleaner. Wait, `handleLogout` currently has:
  // const role = currentUser?.role; const locId = currentUser?.locationId; logout(); if (role === 'superadmin') { setTimeout(() => navigate('/super-admin'), 10); } else { setTimeout(() => navigate(locId ? `/login/${encodeURIComponent(locId)}` : '/'), 10); }
  
  content = content.replace(/const role = currentUser\?\.role; const locId = currentUser\?\.locationId; logout\(\); if \(role === 'superadmin'\) \{ setTimeout\(\(\) => navigate\('\/super-admin'\), 10\); \} else \{ setTimeout\(\(\) => navigate\(locId \? `\/login\/\$\{encodeURIComponent\(locId\)\}` : '\/'\), 10\); \}/g, `logout();`);

  fs.writeFileSync(path, content);
};

const roleMap = {
  'Admin.jsx': "currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
  'Mozo.jsx': "currentUser.role !== 'mozo' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
  'Caja.jsx': "currentUser.role !== 'cajera' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
  'Cocina.jsx': "currentUser.role !== 'cocina' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
  'Bar.jsx': "currentUser.role !== 'bar' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin'",
};

['Admin.jsx', 'Mozo.jsx', 'Caja.jsx', 'Cocina.jsx', 'Bar.jsx'].forEach(f => fixFile('./src/pages/' + f, roleMap[f]));
console.log('Fixed navigation to properly route superadmin and local sedes on logout');
