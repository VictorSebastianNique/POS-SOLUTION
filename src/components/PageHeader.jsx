/**
 * PageHeader — Componente de encabezado premium reutilizable.
 * Reemplaza el <div className="top-nav"> genérico en todas las páginas.
 *
 * Props:
 *  - icon: JSX element (ícono de Lucide)
 *  - iconGradient: CSS string (ej. "135deg, #ff6b2b, #f43f5e")
 *  - iconGlow: CSS color string (ej. "rgba(255,107,43,0.4)")
 *  - title: string
 *  - subtitle: JSX | string | null
 *  - badge: JSX | string | null  (ej. "Modo Supervisor")
 *  - badgeColor: string          (ej. "var(--warning-color)")
 *  - actions: JSX                (botones a la derecha)
 */
import React from 'react';

export default function PageHeader({
  icon,
  iconGradient = '135deg, var(--primary-color), var(--primary-hover)',
  iconGlow = 'var(--primary-glow)',
  title,
  subtitle,
  badge,
  badgeColor = 'var(--warning-color)',
  actions,
}) {
  return (
    <div className="top-nav" style={{ gap: '1rem' }}>
      {/* Lado izquierdo: ícono + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {icon && (
          <div style={{
            background: `linear-gradient(${iconGradient})`,
            borderRadius: '12px',
            padding: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 18px ${iconGlow}`,
            flexShrink: 0,
          }}>
            {React.cloneElement(icon, { size: 20, color: '#fff' })}
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}>
              {title}
            </h1>

            {badge && (
              <span style={{
                background: badgeColor,
                color: '#fff',
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                boxShadow: `0 0 10px ${badgeColor}60`,
              }}>
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: 'var(--success-color)',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--success-color)',
              }} />
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Lado derecho: acciones */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
