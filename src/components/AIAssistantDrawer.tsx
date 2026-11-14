import React, { useState, useEffect } from 'react';
import { normalizePriority, normalizeType } from '../utils/issue-utils';
import { AIStoryDetailModal, AISuggestedStory } from './AIStoryDetailModal';

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDecomposeEpic: (epicTitle: string, epicDescription: string) => Promise<any>;
  onCreateStory?: (story: AISuggestedStory) => Promise<void>;
}

type StoryStatus = 'pending' | 'creating' | 'created';

interface StoryDraft extends AISuggestedStory {
  draftId: number;
  status: StoryStatus;
}

const toPayload = ({ draftId: _draftId, status: _status, ...story }: StoryDraft): AISuggestedStory => story;

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onDecomposeEpic,
  onCreateStory,
}) => {
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDescription, setEpicDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryDraft[]>([]);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creatingAll, setCreatingAll] = useState(false);

  // Esc closes the story detail first, then the drawer.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isOpen) return;
      if (detailId !== null) setDetailId(null);
      else onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, detailId]);

  if (!isOpen) return null;

  const pendingCount = stories.filter((story) => story.status === 'pending').length;
  const createdCount = stories.filter((story) => story.status === 'created').length;
  const detailStory = stories.find((story) => story.draftId === detailId) || null;

  const updateStory = (draftId: number, changes: Partial<StoryDraft>) =>
    setStories((current) => current.map((story) => (story.draftId === draftId ? { ...story, ...changes } : story)));

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epicTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await onDecomposeEpic(epicTitle, epicDescription);
      const received: AISuggestedStory[] = Array.isArray(res?.stories) ? res.stories : [];
      setStories(received.map((story, index) => ({ ...story, draftId: index, status: 'pending' })));
      setGeneratedFor(res?.epicTitle || epicTitle);
      setDetailId(null);
      setFormCollapsed(true);
    } catch (err: any) {
      setError(err?.message || 'Error al comunicarse con el Servidor MCP / Gemini');
    } finally {
      setLoading(false);
    }
  };

  /** Creates one story; returns false (and shows the error) when it fails. */
  const createStory = async (story: StoryDraft): Promise<boolean> => {
    if (!onCreateStory) return false;
    setError(null);
    updateStory(story.draftId, { status: 'creating' });
    try {
      await onCreateStory(toPayload(story));
      updateStory(story.draftId, { status: 'created' });
      return true;
    } catch (requestError: any) {
      updateStory(story.draftId, { status: 'pending' });
      setError(requestError?.message || `No se pudo crear "${story.title}".`);
      return false;
    }
  };

  const createAll = async () => {
    setCreatingAll(true);
    // Sequential, so issue keys follow the suggested order; stops at the first failure.
    for (const story of stories.filter((item) => item.status === 'pending')) {
      if (!(await createStory(story))) break;
    }
    setCreatingAll(false);
  };

  const discardStory = (draftId: number) => setStories((current) => current.filter((story) => story.draftId !== draftId));

  const handleQuickTemplate = (title: string, desc: string) => {
    setEpicTitle(title);
    setEpicDescription(desc);
  };

  const showForm = !formCollapsed || generatedFor === null;

  return (
    <div
      className="ai-drawer-backdrop"
      data-testid="ai-drawer-backdrop"
      onClick={(event) => {
        // Only a click on the dimmed area itself closes; clicks inside the panel never reach here as target.
        if (event.target === event.currentTarget) onClose();
      }}
    >
    <aside className="ai-drawer" role="dialog" aria-modal="true" aria-label="Asistente Scrum Master IA" data-testid="ai-drawer">
      <div className="ai-drawer-header">
        <div>
          <h3 className="ai-drawer-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <p className="ai-drawer-subtitle">
            Acciones asistidas; revisa las propuestas antes de incorporarlas al proyecto.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm ai-drawer-close" onClick={onClose} aria-label="Cerrar panel IA">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="ai-drawer-body">
        <div className="ai-action-intro">
          <strong>Desglosar una épica</strong>
          <p>Genera historias candidatas con criterios de aceptación y estimaciones para que el equipo las revise.</p>
        </div>

        {!showForm && (
          <div className="ai-epic-summary" data-testid="ai-epic-summary">
            <div className="ai-epic-summary-text">
              <span className="badge badge-epic">Épica</span>
              <strong>{generatedFor}</strong>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormCollapsed(false)}>
              Editar épica
            </button>
          </div>
        )}

        {showForm && (
          <>
            <div className="ai-quick-templates">
              <div className="ai-quick-templates-label">Sugerencias rápidas:</div>
              <div className="ai-quick-templates-list">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickTemplate('Pagos Stripe & Suscripciones', 'Implementar webhook idempotente y retry backoff')}
                >
                  Pagos Stripe
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickTemplate('Autenticación Biométrica WebAuthn', 'Flujo FIDO2 con enclave seguro en frontend web')}
                >
                  WebAuthn / Passkeys
                </button>
              </div>
            </div>

            <form onSubmit={handleDecompose} className="ai-epic-form">
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

              <div className="ai-epic-form-actions">
                {generatedFor !== null && (
                  <button type="button" className="btn btn-outline" onClick={() => setFormCollapsed(true)}>
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary ai-generate-btn"
                  disabled={loading || !epicTitle.trim()}
                  data-testid="btn-ai-decompose-submit"
                >
                  {loading ? (
                    <>
                      <span className="pulse-dot" aria-hidden="true"></span>
                      Preparando propuesta...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      {generatedFor !== null ? 'Volver a generar historias' : 'Generar historias para revisar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {error && (
          <div className="form-error ai-drawer-error" role="alert">
            <strong>{error}</strong>
            <p>Verifica que el agente de IA esté activo y que <code>GEMINI_API_KEY</code> esté configurada para usar Gemini.</p>
          </div>
        )}

        {generatedFor !== null && (
          <section className="ai-results" data-testid="ai-decompose-results" aria-label="Historias propuestas">
            <div className="ai-results-header">
              <h4 className="ai-results-title">
                Historias propuestas ({stories.length})
                {createdCount > 0 && <span className="ai-results-count"> · {createdCount} creadas</span>}
              </h4>
              {onCreateStory && pendingCount > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void createAll()}
                  disabled={creatingAll}
                  data-testid="btn-ai-create-all"
                >
                  {creatingAll ? 'Creando...' : `Crear todas (${pendingCount})`}
                </button>
              )}
            </div>

            {stories.length === 0 && (
              <p className="ai-results-empty">No quedan historias propuestas para esta épica.</p>
            )}

            <div className="ai-story-list">
              {stories.map((story, idx) => {
                const type = normalizeType(story.type);
                const priority = normalizePriority(story.priority);
                const busy = story.status === 'creating' || creatingAll;
                return (
                  <article
                    key={story.draftId}
                    className={`ai-story-card${story.status === 'created' ? ' is-created' : ''}`}
                    data-testid={`ai-story-card-${idx}`}
                  >
                    <h5 className="ai-story-title">{story.title}</h5>
                    <div className="ai-story-meta">
                      <span className={`badge badge-${type.toLowerCase()}`}>{type}</span>
                      <span
                        className={`priority-${priority.toLowerCase()}`}
                        title={`Prioridad sugerida: ${priority}`}
                        data-testid={`ai-story-priority-${idx}`}
                      >
                        ● {priority}
                      </span>
                      <span className="points-pill">{Number(story.estimatedStoryPoints) || 0} SP</span>
                    </div>
                    <div className="ai-story-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetailId(story.draftId)}>
                        Ver detalle
                      </button>
                      {story.status === 'created' ? (
                        <span className="ai-story-created">✓ Creada en el backlog</span>
                      ) : (
                        <>
                          {onCreateStory && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={busy}
                              onClick={() => void createStory(story)}
                            >
                              {story.status === 'creating' ? 'Creando...' : 'Crear'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => discardStory(story.draftId)}
                          >
                            Descartar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="ai-drawer-footer">
        <small className="ai-drawer-footnote">
          <span className="pulse-dot" aria-hidden="true"></span>
          Las propuestas de IA no se guardan automáticamente; revísalas antes de aplicarlas.
        </small>
      </div>
    </aside>

    {detailStory && (
      <AIStoryDetailModal
        key={detailStory.draftId}
        story={detailStory}
        canCreate={Boolean(onCreateStory) && detailStory.status === 'pending' && !creatingAll}
        onClose={() => setDetailId(null)}
        onSave={(edited) => {
          updateStory(detailStory.draftId, edited);
          setDetailId(null);
        }}
        onSaveAndCreate={(edited) => {
          const updated = { ...detailStory, ...edited };
          updateStory(detailStory.draftId, edited);
          setDetailId(null);
          void createStory(updated);
        }}
      />
    )}
    </div>
  );
};
