const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');

  // We need to restore `handleLogout` to perform synchronous navigation.
  // The current `handleLogout` is `const handleLogout = () => { logout(); };`
  // We want it to be:
  // const handleLogout = () => {
  //   const role = currentUser?.role;
  //   const locId = localStorage.getItem('currentLocationId');
  //   logout();
  //   if (role === 'superadmin') {
  //     navigate('/super-admin');
  //   } else {
  //     navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/');
  //   }
  // };
  
  const newHandleLogout = `const handleLogout = () => { const role = currentUser?.role; const locId = localStorage.getItem('currentLocationId'); logout(); if (role === 'superadmin') { navigate('/super-admin'); } else { navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); } };`;
  
  content = content.replace(/const handleLogout = \(\) => \{ logout\(\); \};/, newHandleLogout);

  // In Mozo.jsx, the handleLogout is slightly different, it has an `if` for admin/superadmin to return to /admin.
  // Let's check if it matches:
  // const handleLogout = () => {
  //   if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
  //     navigate('/admin');
  //   } else {
  //     logout();
  //   }
  // };
  // We should replace `logout();` inside `else { ... }` with the full logic.
  
  if (path.includes('Mozo.jsx') || path.includes('Cocina.jsx') || path.includes('Bar.jsx') || path.includes('Caja.jsx')) {
    // Actually, do they all have the return to admin logic?
    // Let's just do a generic replace for `logout();` inside handleLogout
    // Wait, earlier I ran: content = content.replace(/.../g, `logout();`);
    // This replaced all occurrences of the old handleLogout bodies with `logout();`.
    
    // To be safe, let's just find `logout();` inside handleLogout and replace it if it's the only thing, or inside the else block.
    // Instead of complex regex, let's just do this:
    content = content.replace(
      /const handleLogout = \(\) => \{\s*if \(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \{\s*navigate\('\/admin'\);\s*\} else \{\s*logout\(\);\s*\}\s*\};/,
      `const handleLogout = () => { if (currentUser.role === 'admin' || currentUser.role === 'superadmin') { navigate('/admin'); } else { const role = currentUser?.role; const locId = localStorage.getItem('currentLocationId'); logout(); if (role === 'superadmin') { navigate('/super-admin'); } else { navigate(locId ? \`/login/\${encodeURIComponent(locId)}\` : '/'); } } };`
    );
  }

  fs.writeFileSync(path, content);
};

['Admin.jsx', 'Mozo.jsx', 'Caja.jsx', 'Cocina.jsx', 'Bar.jsx'].forEach(f => fixFile('./src/pages/' + f));
console.log('Fixed handleLogout to prevent React hook crash');
