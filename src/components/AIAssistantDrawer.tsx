import React, { useState } from 'react';

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDecomposeEpic: (epicTitle: string, epicDescription: string) => Promise<any>;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onDecomposeEpic,
}) => {
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDescription, setEpicDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epicTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await onDecomposeEpic(epicTitle, epicDescription);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error al comunicarse con el Servidor MCP / Gemini');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="drawer-overlay" role="complementary" aria-label="Asistente Scrum Master IA" data-testid="ai-drawer">
      <div className="drawer-header">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> Scrum Master IA (MCP)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Google Gemini 2.0 Flash + MCP Server
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar panel IA">
          ✕
        </button>
      </div>

      <div className="drawer-body">
        <div className="ai-bubble">
          👋 ¡Hola! Soy tu <strong>Scrum Master IA</strong>. Puedo desglosar requerimientos y épicas complejas en historias de usuario estructuradas con criterios de aceptación en formato <em>Gherkin (Given/When/Then)</em> y estimación Fibonacci.
        </div>

        <form onSubmit={handleDecompose} style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="ai-epic-title">Título de la Épica / Requerimiento *</label>
            <input
              id="ai-epic-title"
              className="form-input"
              type="text"
              required
              placeholder="Ej: Integración con Pasarela de Pagos Stripe"
              value={epicTitle}
              onChange={(e) => setEpicTitle(e.target.value)}
              data-testid="input-ai-epic-title"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ai-epic-desc">Contexto o Alcance del Requerimiento</label>
            <textarea
              id="ai-epic-desc"
              className="form-textarea"
              rows={3}
              placeholder="Detallar restricciones de seguridad, webhooks, monedas soportadas..."
              value={epicDescription}
              onChange={(e) => setEpicDescription(e.target.value)}
              data-testid="input-ai-epic-desc"
            />
          </div>

          <button
            type="submit"
            className="btn btn-ai"
            style={{ width: '100%' }}
            disabled={loading || !epicTitle.trim()}
            data-testid="btn-ai-decompose-submit"
          >
            {loading ? 'Consultando a Gemini 2.0 Flash...' : '⚡ Desglosar Épica con IA'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#ffebe6', color: '#bf2600', borderRadius: '6px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '20px' }} data-testid="ai-decompose-results">
            <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--text-main)' }}>
              Historias Generadas para "{result.epicTitle}":
            </h4>
            {result.stories && result.stories.map((story: any, idx: number) => (
              <div key={idx} style={{ background: '#f4f5f7', borderRadius: '6px', padding: '12px', marginBottom: '10px', borderLeft: '3px solid #6554c0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{story.title}</strong>
                  <span className="points-pill">{story.estimatedStoryPoints} SP</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0' }}>
                  {story.description}
                </p>
                {story.acceptanceCriteriaGherkin && (
                  <pre style={{ fontSize: '0.75rem', background: '#ffffff', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid var(--border)' }}>
                    {story.acceptanceCriteriaGherkin}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="drawer-footer">
        <small style={{ color: 'var(--text-muted)' }}>
          Conectado a <code>jira-mcp-agent (:3000)</code> mediante el Gateway GraphQL de <code>jira-bff</code>.
        </small>
      </div>
    </aside>
  );
};
