import React from 'react';

export interface BurndownData {
  sprintId: string;
  velocity: number;
  idealBurndown: number[];
  actualBurndown: number[];
  blockedCount: number;
  healthStatus: string;
}

export interface AnalyticsPageProps {
  data: BurndownData | null;
  loading?: boolean;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  data,
  loading,
}) => {
  const ideal = data?.idealBurndown || [40, 32, 24, 16, 8, 0];
  const actual = data?.actualBurndown || [40, 35, 29, 22, 14, 2];
  const velocity = data?.velocity ?? 28;
  const health = data?.healthStatus || 'ON_TRACK';
  const blocked = data?.blockedCount ?? 0;

  // SVG Chart calculation
  const maxPoints = Math.max(...ideal, ...actual, 40);
  const width = 560;
  const height = 240;
  const padding = 34;

  const getPoints = (values: number[]) => {
    return values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - (val / maxPoints) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const getAreaPath = (values: number[]) => {
    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - (val / maxPoints) * (height - 2 * padding);
      return `${x},${y}`;
    });
    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    return `M ${points[0]} L ${points.join(' L ')} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  return (
    <div className="main-content" data-testid="page-analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Métricas de Sprint & Burndown Chart</span>
            <span className="kbd-shortcut">MS3 / .NET 8 + Mongo</span>
          </h1>
          <p className="page-subtitle">
            Cálculos en tiempo real procesados por el Microservicio MS3 (.NET 8 + MongoDB) mediante eventos Kafka de Kafka Consumer Group.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>
          <div style={{ paddingBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Calculando métricas analíticas...
          </div>
          <div className="analytics-grid">
            <div className="chart-card">
              <div className="skeleton-shimmer" style={{ width: '100%', height: '240px' }} />
            </div>
            <div>
              {[1, 2, 3].map((n) => (
                <div key={n} className="stat-box">
                  <div className="skeleton-shimmer" style={{ width: '50%', height: '14px', marginBottom: '8px' }} />
                  <div className="skeleton-shimmer" style={{ width: '80%', height: '32px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Main Chart */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Curva de Burndown del Sprint</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>Sprint 1 • 40 Story Points Comprometidos</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '12px', height: '2px', background: '#71717a', display: 'inline-block' }}></span>
                  Ideal
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
                  <span style={{ width: '12px', height: '2px', background: '#3b82f6', display: 'inline-block' }}></span>
                  Real
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: '100%', height: 'auto', background: '#0e0e12', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              role="img"
              aria-label="Gráfico de Burndown"
            >
              <defs>
                <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="1" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#27272a" strokeWidth="1" />
              <line x1={padding} y1={(height - 2 * padding) / 2 + padding} x2={width - padding} y2={(height - 2 * padding) / 2 + padding} stroke="#1e1e24" strokeDasharray="3 3" />
              <line x1={padding} y1={(height - 2 * padding) / 4 + padding} x2={width - padding} y2={(height - 2 * padding) / 4 + padding} stroke="#1e1e24" strokeDasharray="3 3" />

              {/* Area gradient under actual curve */}
              <path d={getAreaPath(actual)} fill="url(#burndownGrad)" />

              {/* Ideal Line (dashed) */}
              <polyline
                fill="none"
                stroke="#71717a"
                strokeWidth="1.75"
                strokeDasharray="4 4"
                points={getPoints(ideal)}
                data-testid="chart-line-ideal"
              />

              {/* Actual Line (solid blue) */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.25"
                points={getPoints(actual)}
                data-testid="chart-line-actual"
              />

              {/* Actual data points with micro rings */}
              {actual.map((val, idx) => {
                const x = padding + (idx / (actual.length - 1)) * (width - 2 * padding);
                const y = height - padding - (val / maxPoints) * (height - 2 * padding);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#121215" stroke="#3b82f6" strokeWidth="2" />
                    <circle cx={x} cy={y} r="2" fill="#60a5fa" />
                  </g>
                );
              })}
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              <span>Día 1 (Inicio)</span>
              <span>Día 5 (Mitad de Sprint)</span>
              <span>Día 10 (Cierre)</span>
            </div>
          </div>

          {/* Side KPI cards */}
          <div>
            <div className="stat-box">
              <span className="page-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', fontWeight: 600 }}>Salud del Sprint</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    background: health === 'ON_TRACK' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                    color: health === 'ON_TRACK' ? '#34d399' : '#fb7185',
                    border: `1px solid ${health === 'ON_TRACK' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xs)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    letterSpacing: '0.04em',
                    fontFamily: 'var(--font-mono)',
                  }}
                  data-testid="kpi-health-status"
                >
                  {health === 'ON_TRACK' ? '✓ EN TIEMPO (ON TRACK)' : 'EN RIESGO (AT RISK)'}
                </span>
              </div>
            </div>

            <div className="stat-box">
              <span className="page-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', fontWeight: 600 }}>Velocidad Promedio</span>
              <div className="stat-value" data-testid="kpi-velocity">
                {velocity} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>SP / sprint</span>
              </div>
            </div>

            <div className="stat-box">
              <span className="page-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', fontWeight: 600 }}>Bloqueos Detectados</span>
              <div className="stat-value" style={{ color: blocked > 0 ? 'var(--priority-critical)' : 'var(--priority-low)' }} data-testid="kpi-blocked">
                {blocked} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>issues bloqueados</span>
              </div>
            </div>

            {/* Microservices Topology Telemetry */}
            <div style={{ background: '#121215', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Pipeline de Microservicios Activo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-body)' }}>
                  <span>MS1 Issues (Go)</span>
                  <span style={{ color: '#34d399' }}>● gRPC :50051</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-body)' }}>
                  <span>MS2 Sprints (NestJS)</span>
                  <span style={{ color: '#34d399' }}>● gRPC :50052</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-body)' }}>
                  <span>MS3 Analytics (.NET 8)</span>
                  <span style={{ color: '#34d399' }}>● Kafka Consumer</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-body)' }}>
                  <span>AI Agent (Gemini 2.0)</span>
                  <span style={{ color: '#38bdf8' }}>● MCP :3000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
