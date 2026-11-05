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
  const width = 500;
  const height = 220;
  const padding = 30;

  const getPoints = (values: number[]) => {
    return values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - (val / maxPoints) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="main-content" data-testid="page-analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Métricas de Sprint & Burndown Chart</h1>
          <p className="page-subtitle">
            Cálculos en tiempo real procesados por el Microservicio MS3 (.NET 8 + MongoDB) mediante Kafka.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Calculando métricas analíticas...
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Main Chart */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Curva de Burndown del Sprint</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '3px', background: '#8993a4', display: 'inline-block' }}></span>
                  Ideal
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '3px', background: '#0052cc', display: 'inline-block' }}></span>
                  Real
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: '#fafbfc', borderRadius: '4px' }} role="img" aria-label="Gráfico de Burndown">
              {/* Axes */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#dfe1e6" strokeWidth="2" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#dfe1e6" strokeWidth="2" />

              {/* Grid lines */}
              <line x1={padding} y1={(height - 2 * padding) / 2 + padding} x2={width - padding} y2={(height - 2 * padding) / 2 + padding} stroke="#ebecf0" strokeDasharray="4" />

              {/* Ideal Line (dashed) */}
              <polyline
                fill="none"
                stroke="#8993a4"
                strokeWidth="2"
                strokeDasharray="5,5"
                points={getPoints(ideal)}
                data-testid="chart-line-ideal"
              />

              {/* Actual Line (solid blue) */}
              <polyline
                fill="none"
                stroke="#0052cc"
                strokeWidth="3"
                points={getPoints(actual)}
                data-testid="chart-line-actual"
              />

              {/* Actual data points */}
              {actual.map((val, idx) => {
                const x = padding + (idx / (actual.length - 1)) * (width - 2 * padding);
                const y = height - padding - (val / maxPoints) * (height - 2 * padding);
                return <circle key={idx} cx={x} cy={y} r="4" fill="#0052cc" />;
              })}
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Día 1 (Inicio)</span>
              <span>Día 5 (Mitad)</span>
              <span>Día 10 (Cierre)</span>
            </div>
          </div>

          {/* Side KPI cards */}
          <div>
            <div className="stat-box">
              <span className="page-subtitle">Salud del Sprint</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    background: health === 'ON_TRACK' ? '#e3fcef' : '#ffebe6',
                    color: health === 'ON_TRACK' ? '#006644' : '#bf2600',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                  data-testid="kpi-health-status"
                >
                  {health === 'ON_TRACK' ? '✓ EN TIEMPO (ON TRACK)' : '⚠ EN RIESGO (AT RISK)'}
                </span>
              </div>
            </div>

            <div className="stat-box">
              <span className="page-subtitle">Velocidad Promedio</span>
              <div className="stat-value" data-testid="kpi-velocity">{velocity} <span style={{ fontSize: '1rem', fontWeight: 600 }}>SP / sprint</span></div>
            </div>

            <div className="stat-box">
              <span className="page-subtitle">Bloqueos Detectados</span>
              <div className="stat-value" style={{ color: blocked > 0 ? 'var(--danger)' : 'var(--success)' }} data-testid="kpi-blocked">
                {blocked} <span style={{ fontSize: '1rem', fontWeight: 600 }}>issues bloqueados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
