import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SmartCard({ 
  title, 
  subtitle, 
  score, 
  explanation, 
  actionText = "Select Option",
  onAction,
  icon: Icon = Sparkles,
  type = "recommendation" // recommendation, warning, insight
}) {
  
  const getTypeStyles = () => {
    switch(type) {
      case 'warning':
        return {
          bg: 'rgba(239, 68, 68, 0.05)',
          border: 'rgba(239, 68, 68, 0.3)',
          accent: 'var(--accent-danger)'
        };
      case 'insight':
        return {
          bg: 'rgba(59, 130, 246, 0.05)',
          border: 'rgba(59, 130, 246, 0.3)',
          accent: 'var(--accent-secondary)'
        };
      default: // recommendation
        return {
          bg: 'linear-gradient(145deg, rgba(6, 214, 160, 0.05) 0%, rgba(28, 28, 36, 0.9) 100%)',
          border: 'rgba(6, 214, 160, 0.3)',
          accent: 'var(--accent-primary)'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="glass-card animate-in" style={{
      background: styles.bg,
      borderColor: styles.border,
      position: 'relative',
      overflow: 'hidden',
      padding: 'var(--space-xl)'
    }}>
      {/* Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        background: styles.accent,
        filter: 'blur(80px)',
        opacity: 0.15,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            borderRadius: 'var(--radius-sm)', 
            background: `color-mix(in srgb, ${styles.accent} 20%, transparent)`,
            color: styles.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
          </div>
        </div>

        {score && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: styles.accent, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Match Score
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: 'var(--radius-sm)', 
        padding: '16px', 
        marginBottom: '24px',
        borderLeft: `3px solid ${styles.accent}`
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Sparkles size={16} color={styles.accent} style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ color: styles.accent, fontWeight: 600 }}>AI Rationale: </span> 
            {explanation}
          </p>
        </div>
      </div>

      {onAction && (
        <button 
          onClick={onAction}
          className="btn"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            background: styles.accent,
            color: '#131318',
            fontWeight: 600,
            padding: '12px'
          }}
        >
          {actionText}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
