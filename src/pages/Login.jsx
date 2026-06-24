import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { UtensilsCrossed, User, Lock, MapPin } from 'lucide-react';

export default function Login({ isSuperAdminRoute }) {
  const navigate = useNavigate();
  const { sedeSlug } = useParams();
  const { login, locations } = useStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState('');
  const [sedeInfo, setSedeInfo] = useState(null);
  const [invalidSede, setInvalidSede] = useState(false);

  useEffect(() => {
    if (isSuperAdminRoute) {
      setSedeInfo({ name: 'Panel Global (Super Admin)' });
      setLocationId('');
      setInvalidSede(false);
    } else if (locations && locations.length > 0) {
      const decodedSlug = decodeURIComponent(sedeSlug);
      const found = locations.find(l => 
        l.id === decodedSlug || 
        l.name === decodedSlug || 
        l.id.replace(/\s+/g, '') === decodedSlug ||
        l.name.replace(/\s+/g, '') === decodedSlug ||
        (l.slug || l.name.toLowerCase().replace(/\s+/g, '-')) === decodedSlug ||
        (l.slug || l.name.toLowerCase().replace(/\s+/g, '')) === decodedSlug
      );
      if (found) {
        setSedeInfo(found);
        setLocationId(found.id);
        setInvalidSede(false);
      } else {
        setInvalidSede(true);
      }
    }
  }, [locations, sedeSlug, isSuperAdminRoute]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!isSuperAdminRoute && !locationId) {
      setError('Por favor seleccione una sucursal.');
      return;
    }

    const result = login(username, password, locationId);
    if (result.success) {
      const targetPath = (result.user.role === 'superadmin' || result.user.role === 'admin') ? '/admin' : (result.user.role === 'cajera' ? '/caja' : `/${result.user.role}`);
      
      if (result.needsReload) {
        window.location.href = targetPath;
      } else {
        navigate(targetPath);
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh' }}>
      
      <div className="card login-card">
        {invalidSede ? (
          <div className="text-center">
            <h1 className="title" style={{ fontSize: '1.5rem', color: 'var(--danger-color)' }}>Sede No Encontrada</h1>
            <p className="subtitle mt-4">El enlace ingresado no corresponde a ninguna sede activa.</p>
          </div>
        ) : (
        <>
        <div className="flex flex-col items-center gap-3 mb-8">
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
            padding: '1rem', borderRadius: '18px',
            boxShadow: '0 0 24px var(--primary-glow)',
          }}>
            <UtensilsCrossed size={32} color="white" />
          </div>
          <h1 className="title text-center" style={{ fontSize: '1.75rem', lineHeight: '1.2', fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}>
            {isSuperAdminRoute ? 'Panel Global' : `Bienvenido a ${sedeInfo?.name || 'Cargando...'}`}
          </h1>
          <p className="subtitle">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Location Selection hidden but kept conceptually if needed for Super Admin fallback */}
          {isSuperAdminRoute && locations && locations.length > 0 && (
            <div>
              <label className="subtitle mb-1" style={{ display: 'block', fontSize: '0.875rem' }}>Sucursal por Defecto</label>
              <div className="flex items-center" style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <select
                  className="input"
                  style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                >
                  <option value="">-- Sin sucursal seleccionada --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="subtitle mb-1" style={{ display: 'block', fontSize: '0.875rem' }}>Usuario</label>
            <div className="flex items-center" style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
          </div>

          <div>
            <label className="subtitle mb-1" style={{ display: 'block', fontSize: '0.875rem' }}>Contraseña</label>
            <div className="flex items-center" style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger-color)', backgroundColor: 'var(--danger-bg)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem', fontSize: '1rem' }}>
            Ingresar
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="subtitle" style={{ fontSize: '0.75rem' }}>Usuarios por defecto:<br/>admin/123 | cocina/123 | bar/123 | mozo1/123</p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
