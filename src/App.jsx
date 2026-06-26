import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Mozo from './pages/Mozo';
import Cocina from './pages/Cocina';
import Bar from './pages/Bar';
import Admin from './pages/Admin';
import Caja from './pages/Caja';
import Kardex from './pages/Kardex';
import DeveloperConfig from './pages/DeveloperConfig';
import CustomerApp from './pages/CustomerApp';
import { useStore } from './context/StoreContext';

/* ── Reloj global ─────────────────────────────────────────── */
const GlobalClock = () => {
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const timer    = setInterval(() => setTime(new Date()), 1000);
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => { clearInterval(timer); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '6px' : '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid var(--border-color)',
      padding: isMobile ? '0.2rem 0.6rem' : '0.35rem 1.2rem',
      borderRadius: '999px',
      color: 'var(--text-secondary)',
      fontSize: isMobile ? '0.62rem' : '0.8rem',
      pointerEvents: 'none',
      zIndex: 999,
      fontWeight: 500,
      letterSpacing: isMobile ? '0px' : '0.06em',
      whiteSpace: 'nowrap',
      maxWidth: isMobile ? '160px' : 'none',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      {time.toLocaleDateString()} · {time.toLocaleTimeString()}
    </div>
  );
};

/* ── Botón de tema ─────────────────────────────────────────── */
const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      style={{
        position: 'fixed',
        top: '50%',
        right: '16px',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        writingMode: 'vertical-rl',
        letterSpacing: '0.08em',
        fontSize: '0.7rem',
        padding: '0.7rem 0.4rem',
        gap: '0.5rem',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
      <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
        {theme === 'dark' ? 'Claro' : 'Oscuro'}
      </span>
    </button>
  );
};

/* ── Página de acceso restringido ─────────────────────────── */
const RestrictedRoot = () => (
  <div className="container flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh', textAlign: 'center' }}>
    <div className="card login-card">
      <div style={{
        width: '64px', height: '64px',
        background: 'var(--danger-bg)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
        fontSize: '2rem',
      }}>
        🔒
      </div>
      <h1 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--danger-color)' }}>
        Acceso Restringido
      </h1>
      <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.7' }}>
        Por favor, ingresa al sistema utilizando el enlace único asignado a tu sucursal.
      </p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Si no conoces el enlace, contacta al administrador.
      </p>
    </div>
  </div>
);

/* ── SmartRoot para PWA ────────────────────────────────────── */
const SmartRoot = () => {
  const { currentUser, locations } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Si el usuario ya está logueado, redirigir a su panel
    if (currentUser) {
      if (currentUser.role === 'superadmin' || currentUser.role === 'admin') navigate('/admin');
      else if (currentUser.role === 'cajera') navigate('/caja');
      else navigate(`/${currentUser.role}`);
      return;
    }

    // Si no está logueado, buscar si tiene una sede previa guardada en localStorage
    const locId = localStorage.getItem('currentLocationId');
    if (locId && locations && locations.length > 0) {
       const loc = locations.find(l => l.id === locId);
       if (loc) {
          const slug = loc.slug || loc.name.replace(/\s+/g, '');
          navigate(`/login/${slug}`);
          return;
       }
    }
  }, [currentUser, locations, navigate]);

  // Fallback si no hay sede guardada (ej. primera vez que abren la PWA desde la raíz)
  return <RestrictedRoot />;
};

/* ── App Root ─────────────────────────────────────────────── */
function App() {
  const { developerSettings } = useStore();
  const isIncognito = developerSettings?.isSuperAdminIncognito;

  // Leer tema guardado o usar oscuro por defecto
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<SmartRoot />} />
        <Route path="/app"             element={<CustomerApp />} />
        <Route path="/login/:sedeSlug" element={<Login />} />
        <Route path="/super-admin"     element={isIncognito ? <RestrictedRoot /> : <Login isSuperAdminRoute={true} />} />
        <Route path="/dev-config"      element={<DeveloperConfig />} />
        <Route path="/mozo"            element={<Mozo />} />
        <Route path="/cocina"          element={<Cocina />} />
        <Route path="/bar"             element={<Bar />} />
        <Route path="/admin"           element={<Admin />} />
        <Route path="/caja"            element={<Caja />} />
        <Route path="/kardex"          element={<Kardex />} />
      </Routes>
      <GlobalClock />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
    </BrowserRouter>
  );
}

export default App;
