import React from 'react';

export default function PlanComparison({ plans, winnerId }) {
  if (!plans || plans.length === 0) return null;

  return (
    <div className="glass-card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-lg) var(--space-lg) var(--space-md)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>AI Plan Comparison matrix</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Evaluating multi-factor metrics to determine the optimal choice.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderY: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Metric</th>
              {plans.map(p => (
                <th key={p.id} style={{ 
                  padding: '16px 24px', 
                  color: p.id === winnerId ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: 600 
                }}>
                  {p.name}
                  {p.id === winnerId && (
                    <span className="badge badge-good" style={{ marginLeft: '8px' }}>Winner</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Cost Row */}
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estimated Cost</td>
              {plans.map(p => (
                <td key={p.id} style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)' }}>
                  ₹{p.raw_data?.cost || 0}
                </td>
              ))}
            </tr>
            {/* Comfort Row */}
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comfort Score</td>
              {plans.map(p => {
                const score = p.scores?.comfort || 0;
                const color = score > 75 ? 'var(--accent-primary)' : score > 50 ? 'var(--accent-warm)' : 'var(--accent-danger)';
                return (
                  <td key={p.id} style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color }}>{score}</span>
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', maxWidth: '60px' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
            {/* Risk Row */}
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Environmental Risk</td>
              {plans.map(p => {
                const score = p.scores?.risk || 0;
                const color = score < 30 ? 'var(--accent-primary)' : score < 60 ? 'var(--accent-warm)' : 'var(--accent-danger)';
                return (
                  <td key={p.id} style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color: color
                    }}>
                      {score < 30 ? 'Low' : score < 60 ? 'Moderate' : 'High'} ({score})
                    </span>
                  </td>
                );
              })}
            </tr>
            {/* Suitability Row */}
            <tr>
              <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Overall Match</td>
              {plans.map(p => (
                <td key={p.id} style={{ padding: '16px 24px' }}>
                  <div style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-display)',
                    color: p.id === winnerId ? 'var(--accent-primary)' : 'var(--text-primary)'
                  }}>
                    {p.scores?.suitability || 0}%
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
