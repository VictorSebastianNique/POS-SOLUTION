const fs = require('fs');

// Caja.jsx
let caja = fs.readFileSync('./src/pages/Caja.jsx', 'utf8');
caja = caja.replace(
  /\{\(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) && \(\s*<button className="btn btn-outline" style=\{\{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' \}\} onClick=\{\(\) => navigate\('\/admin'\)\}>Admin<\/button>\s*\)\}\s*<button className="btn btn-danger" style=\{\{ padding: '0.4rem 0.6rem' \}\} onClick=\{\(\) => \{ logout\(\); \}\}>\s*<LogOut size=\{16\} \/>\s*<\/button>/,
  `{(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }} onClick={handleLogout}>Volver al Admin</button>
          ) : (
            <button className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={handleLogout}><LogOut size={16} /></button>
          )}`
);
fs.writeFileSync('./src/pages/Caja.jsx', caja);

// Bar.jsx
let bar = fs.readFileSync('./src/pages/Bar.jsx', 'utf8');
bar = bar.replace(
  /<button className="btn btn-outline" style=\{\{ fontSize: '0.85rem' \}\} onClick=\{handleLogout\}>\{\(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \? 'Al Admin' : 'Salir'\}<\/button>/,
  `<button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={handleLogout}>{(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}</button>`
);
fs.writeFileSync('./src/pages/Bar.jsx', bar);

// Mozo.jsx
let mozo = fs.readFileSync('./src/pages/Mozo.jsx', 'utf8');
mozo = mozo.replace(
  /<button className="btn btn-outline" style=\{\{ fontSize: isMobile \? '0.8rem' : '0.9rem', padding: isMobile \? '0.4rem 0.75rem' : undefined \}\} onClick=\{handleLogout\}>\s*\{\(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \? \(isMobile \? 'Admin' : 'Volver al Admin'\) : 'Salir'\}\s*<\/button>/,
  `<button className="btn btn-outline" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', padding: isMobile ? '0.4rem 0.75rem' : undefined }} onClick={handleLogout}>
          {(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}
        </button>`
);
// And also check Mozo.jsx for the closed terminal state:
mozo = mozo.replace(
  /<button className="btn btn-outline" onClick=\{handleLogout\}>\{\(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \? 'Volver al Admin' : 'Cerrar Sesión'\}<\/button>/g,
  `<button className="btn btn-outline" onClick={handleLogout}>{(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}</button>`
);
fs.writeFileSync('./src/pages/Mozo.jsx', mozo);

// Cocina.jsx
let cocina = fs.readFileSync('./src/pages/Cocina.jsx', 'utf8');
cocina = cocina.replace(
  /<button className="btn btn-outline" onClick=\{handleLogout\}>\{\(currentUser\.role === 'admin' \|\| currentUser\.role === 'superadmin'\) \? 'Volver al Admin' : 'Cerrar Sesión'\}<\/button>/,
  `<button className="btn btn-outline" onClick={handleLogout}>{(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'Volver al Admin' : 'Cerrar Sesión'}</button>`
);
fs.writeFileSync('./src/pages/Cocina.jsx', cocina);

console.log('Fixed buttons');
