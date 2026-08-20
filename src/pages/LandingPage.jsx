import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Zap, ShieldCheck, BarChart3, ChefHat, LogIn, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page animate-fade-in" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--bg-color)',
      overflowX: 'hidden'
    }}>
      {/* ── NAVBAR ── */}
      <nav style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          <div style={{ background: 'var(--primary-color)', padding: '0.4rem', borderRadius: '8px', color: '#000' }}>
            <Store size={24} />
          </div>
          ADREDI Solutions
        </div>
        <div>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            Acceder al Sistema <LogIn size={18} />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem 2rem', alignItems: 'center' }}>
        
        {/* ── HERO SECTION ── */}
        <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '4rem', animation: 'fade-in 0.6s ease-out' }}>
          <div style={{
            background: 'var(--primary-subtle)',
            color: 'var(--primary-color)',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)'
          }}>
            Sistema POS Inteligente 2.0
          </div>
          
          <h1 className="title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: 800 }}>
            Control total de tu negocio, <span style={{ color: 'var(--primary-color)' }}>en segundos.</span>
          </h1>
          
          <p className="subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Punto de venta, control de mesas, inventario y facturación. Diseñado para restaurantes que exigen velocidad y seguridad sin complicaciones.
          </p>

          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ fontSize: '1.15rem', padding: '1rem 2.5rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--glow-primary)' }}>
            Iniciar Sesión <ChevronRight size={20} />
          </button>
        </div>

        {/* ── BENTO BOX FEATURES ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem', 
          width: '100%', 
          maxWidth: '1000px',
          animation: 'fade-in 0.8s ease-out'
        }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-subtle)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pedidos Ultra-rápidos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Atención ágil en caja y mesa. Optimizado para entornos de alta concurrencia.</p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--warning-subtle)', color: 'var(--warning-color)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <ChefHat size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>KDS Cocina y Bar</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Comandas digitales sincronizadas en tiempo real sin perder ningún detalle.</p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--info-subtle)', color: 'var(--info-color)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Inventario Kardex</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Descarga automática de insumos por cada plato vendido. Cero mermas no justificadas.</p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: '2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--danger-subtle)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Auditoría y Control</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Seguridad total. Cada acción (anulaciones, cortes) queda registrada de por vida.</p>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        background: 'var(--surface-color)'
      }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Store size={20} color="var(--primary-color)" />
        </div>
        <p>&copy; {new Date().getFullYear()} ADREDI Solutions. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
