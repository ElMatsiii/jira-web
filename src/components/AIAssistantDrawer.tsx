import React, { useState, useEffect } from 'react';

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDecomposeEpic: (epicTitle: string, epicDescription: string) => Promise<any>;
  onCreateStory?: (story: {
    title: string;
    description: string;
    type: string;
    estimatedStoryPoints: number;
    acceptanceCriteriaGherkin: string;
  }) => Promise<void>;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onDecomposeEpic,
  onCreateStory,
}) => {
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDescription, setEpicDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingStory, setCreatingStory] = useState<number | null>(null);
  const [createdStories, setCreatedStories] = useState<number[]>([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epicTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setCreatedStories([]);
      const res = await onDecomposeEpic(epicTitle, epicDescription);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error al comunicarse con el Servidor MCP / Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTemplate = (title: string, desc: string) => {
    setEpicTitle(title);
    setEpicDescription(desc);
  };

  return (
    <aside className="drawer-overlay" role="complementary" aria-label="Asistente Scrum Master IA" data-testid="ai-drawer">
      <div className="drawer-header">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.98rem', color: 'var(--text-main)', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="M4.93 4.93l2.83 2.83" />
              <path d="M16.24 16.24l2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="M4.93 19.07l2.83-2.83" />
              <path d="M16.24 7.76l2.83-2.83" />
            </svg>
            Herramientas de IA para el proyecto
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Acciones asistidas; revisa las propuestas antes de incorporarlas al proyecto.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar panel IA">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="drawer-body">
        <div className="ai-action-intro">
          <strong>Desglosar una épica</strong>
          <p>Genera historias candidatas con criterios de aceptación y estimaciones para que el equipo las revise.</p>
        </div>

        {/* Quick prompt templates */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '6px' }}>Sugerencias rápidas:</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem' }}
              onClick={() => handleQuickTemplate('Pagos Stripe & Suscripciones', 'Implementar webhook idempotente y retry backoff')}
            >
              Pagos Stripe
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem' }}
              onClick={() => handleQuickTemplate('Autenticación Biométrica WebAuthn', 'Flujo FIDO2 con enclave seguro en frontend web')}
            >
              WebAuthn / Passkeys
            </button>
          </div>
        </div>

        <form onSubmit={handleDecompose} style={{ marginTop: '8px' }}>
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
            style={{ width: '100%', padding: '9px 16px', background: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8' }}
            disabled={loading || !epicTitle.trim()}
            data-testid="btn-ai-decompose-submit"
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-dot" style={{ backgroundColor: '#ffffff', boxShadow: 'none' }}></span>
                Preparando propuesta...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generar historias para revisar
              </span>
            )}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(251, 113, 133, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '2px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Verifica que el agente de IA esté activo y que <code>GEMINI_API_KEY</code> esté configurada para usar Gemini.
            </p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '22px' }} data-testid="ai-decompose-results">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Historias Generadas: "{result.epicTitle}"
              </h4>
              <span className="badge badge-epic">ÉPICA</span>
            </div>
            {result.stories && result.stories.map((story: any, idx: number) => (
              <div key={idx} style={{ background: '#16161a', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '10px', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{story.title}</strong>
                  <span className="points-pill">{story.estimatedStoryPoints} SP</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0', lineHeight: 1.4 }}>
                  {story.description}
                </p>
                {story.acceptanceCriteriaGherkin && (
                  <pre style={{ fontSize: '0.72rem', background: '#0e0e12', color: '#a1a1aa', padding: '8px 10px', borderRadius: '4px', overflowX: 'auto', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                    {story.acceptanceCriteriaGherkin}
                  </pre>
                )}
                {onCreateStory && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={creatingStory === idx || createdStories.includes(idx)}
                    onClick={async () => {
                      setError(null);
                      setCreatingStory(idx);
                      try {
                        await onCreateStory(story);
                        setCreatedStories((current) => [...current, idx]);
                      } catch (requestError: any) {
                        setError(requestError?.message || 'No se pudo crear esta historia.');
                      } finally {
                        setCreatingStory(null);
                      }
                    }}
                  >
                    {createdStories.includes(idx) ? 'Agregada al backlog' : creatingStory === idx ? 'Creando...' : 'Crear historia'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="drawer-footer">
        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot"></span>
          Las propuestas de IA no se guardan automáticamente; revísalas antes de aplicarlas.
        </small>
      </div>
    </aside>
  );
};
