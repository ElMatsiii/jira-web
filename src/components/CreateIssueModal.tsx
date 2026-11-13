import React, { useState, useEffect } from 'react';

export interface SuggestedSubtaskItem {
  title: string;
  description: string;
  type: string;
  priority: string;
  estimatedStoryPoints: number;
  acceptanceCriteriaGherkin?: string;
}

export interface IssueDraft {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  storyPoints: number;
  acceptanceCriteria: string;
}

export interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (issue: {
    title: string;
    description: string;
    type: string;
    priority: string;
    storyPoints: number;
    acceptanceCriteria: string;
  }) => Promise<void> | void;
  onImprove?: (issue: { title: string; description: string; type: string }) => Promise<{
    storyPoints: number;
    acceptanceCriteriaGherkin: string;
  }>;
  onBreakdownTask?: (issue: { title: string; description?: string }) => Promise<{
    parentTitle: string;
    subtasks: SuggestedSubtaskItem[];
  }>;
}

const MAX_DRAFTS = 6;

const createInitialDraft = (): IssueDraft => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  title: '',
  description: '',
  type: 'STORY',
  priority: 'MEDIUM',
  storyPoints: 3,
  acceptanceCriteria: '',
});

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onImprove,
  onBreakdownTask,
}) => {
  const [drafts, setDrafts] = useState<IssueDraft[]>([createInitialDraft()]);
  const [activeDraftId, setActiveDraftId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [improving, setImproving] = useState(false);
  const [segmenting, setSegmenting] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<SuggestedSubtaskItem[]>([]);
  const [addedSubtaskTitles, setAddedSubtaskTitles] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (drafts.length === 0) {
        const initial = createInitialDraft();
        setDrafts([initial]);
        setActiveDraftId(initial.id);
      } else if (!activeDraftId || !drafts.some((d) => d.id === activeDraftId)) {
        setActiveDraftId(drafts[0].id);
      }
      setError('');
    }
  }, [isOpen]);

  // Sync activeDraftId when drafts change
  useEffect(() => {
    if (drafts.length > 0 && (!activeDraftId || !drafts.some((d) => d.id === activeDraftId))) {
      setActiveDraftId(drafts[0].id);
    }
  }, [drafts, activeDraftId]);

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

  const activeDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0] || createInitialDraft();

  const updateActiveDraft = (field: keyof IssueDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === activeDraft.id ? { ...d, [field]: value } : d))
    );
  };

  const handleAddBlankDraft = () => {
    if (drafts.length >= MAX_DRAFTS) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros de incidencia simultáneos.`);
      return;
    }
    const newDraft: IssueDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: '',
      description: '',
      type: 'TASK',
      priority: 'MEDIUM',
      storyPoints: 3,
      acceptanceCriteria: '',
    };
    setDrafts((prev) => [...prev, newDraft]);
    setActiveDraftId(newDraft.id);
    setError('');
  };

  const handleCloseDraft = (idToClose: string) => {
    if (drafts.length <= 1) {
      // Closing the only remaining draft closes the modal
      onClose();
      return;
    }
    const remaining = drafts.filter((d) => d.id !== idToClose);
    setDrafts(remaining);
    if (activeDraftId === idToClose) {
      setActiveDraftId(remaining[0].id);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDraft.title.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await onCreate({
        title: activeDraft.title,
        description: activeDraft.description,
        type: activeDraft.type,
        priority: activeDraft.priority,
        storyPoints: Number(activeDraft.storyPoints) || 0,
        acceptanceCriteria: activeDraft.acceptanceCriteria,
      });

      if (drafts.length <= 1) {
        setDrafts([createInitialDraft()]);
        setSuggestedSubtasks([]);
        setAddedSubtaskTitles([]);
        onClose();
      } else {
        const remaining = drafts.filter((d) => d.id !== activeDraft.id);
        setDrafts(remaining);
        setActiveDraftId(remaining[0].id);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la incidencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImprove = async () => {
    if (!onImprove || !activeDraft.title.trim()) return;
    setImproving(true);
    setError('');
    try {
      const suggestion = await onImprove({
        title: activeDraft.title,
        description: activeDraft.description,
        type: activeDraft.type,
      });
      updateActiveDraft('storyPoints', suggestion.storyPoints);
      updateActiveDraft('acceptanceCriteria', suggestion.acceptanceCriteriaGherkin);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo generar la propuesta.');
    } finally {
      setImproving(false);
    }
  };

  const handleBreakdownTask = async () => {
    if (!activeDraft.title.trim()) {
      setError('Ingresa un título para que la IA genere subtareas complementarias.');
      return;
    }
    setSegmenting(true);
    setError('');
    try {
      if (onBreakdownTask) {
        const res = await onBreakdownTask({
          title: activeDraft.title,
          description: activeDraft.description,
        });
        setSuggestedSubtasks(res.subtasks || []);
      } else {
        // Fallback internal suggestions if onBreakdownTask is not wired
        setSuggestedSubtasks([
          {
            title: `Crear Frontend para ${activeDraft.title}`,
            description: 'Estructurar vistas cliente, componentes reutilizables y estilos.',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 3,
            acceptanceCriteriaGherkin: 'Given la interfaz When el usuario interactúa Then responde visualmente',
          },
          {
            title: `Crear Backend y API para ${activeDraft.title}`,
            description: 'Servicios de lógica de negocio, endpoints y persistencia de datos.',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 5,
            acceptanceCriteriaGherkin: 'Given endpoints activos When se envían peticiones Then retorna estado 200',
          },
          {
            title: `Configurar Base de Datos para ${activeDraft.title}`,
            description: 'Esquema de tablas, índices y migraciones de datos.',
            type: 'TASK',
            priority: 'MEDIUM',
            estimatedStoryPoints: 3,
            acceptanceCriteriaGherkin: 'Given la base conectada When se ejecutan migraciones Then las tablas se configuran',
          },
        ]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron generar subtareas.');
    } finally {
      setSegmenting(false);
    }
  };

  const handleAcceptSubtask = (st: SuggestedSubtaskItem) => {
    if (drafts.length >= MAX_DRAFTS) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros de incidencia simultáneos.`);
      return;
    }

    const newDraft: IssueDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: st.title,
      description: st.description || '',
      type: st.type || 'TASK',
      priority: st.priority || 'MEDIUM',
      storyPoints: st.estimatedStoryPoints || 3,
      acceptanceCriteria: st.acceptanceCriteriaGherkin || '',
    };

    setDrafts((prev) => [...prev, newDraft]);
    setActiveDraftId(newDraft.id);
    setAddedSubtaskTitles((prev) => [...prev, st.title]);
    setError('');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="create-issue-modal">
      <div className="modal-card modal-deck-card">
        {/* Banner Header */}
        <div className="modal-header">
          <div>
            <h2>Crear Nueva Incidencia</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Registrada en el Microservicio MS1 (Go + PostgreSQL) vía GraphQL BFF
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="subtask-badge"
              style={{
                backgroundColor: drafts.length >= MAX_DRAFTS ? '#FEE2E2' : '#F5F1E9',
                color: drafts.length >= MAX_DRAFTS ? '#DC2626' : '#0D172A',
                fontWeight: 600,
              }}
            >
              {drafts.length} / {MAX_DRAFTS} recuadros
            </span>
            <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Deck Tab Bar: Up to 6 simultaneous issue recuadros */}
        <div className="modal-deck-tabs" role="tablist" aria-label="Recuadros de incidencias">
          {drafts.map((draft, idx) => {
            const isActive = draft.id === activeDraft.id;
            const tabLabel = draft.title.trim()
              ? `${idx + 1}. ${draft.title.length > 20 ? draft.title.substring(0, 18) + '...' : draft.title}`
              : `Recuadro ${idx + 1}`;

            return (
              <button
                key={draft.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`modal-deck-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveDraftId(draft.id);
                  setError('');
                }}
              >
                <span>{tabLabel}</span>
                {drafts.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="modal-deck-tab-close"
                    title="Cerrar este recuadro"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseDraft(draft.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        handleCloseDraft(draft.id);
                      }
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}

          {drafts.length < MAX_DRAFTS && (
            <button
              type="button"
              className="modal-deck-add-btn"
              onClick={handleAddBlankDraft}
              title="Abrir un nuevo recuadro de incidencia en blanco"
            >
              + Nuevo recuadro ({drafts.length}/{MAX_DRAFTS})
            </button>
          )}
        </div>

        {/* Main Issue Form for Active Recuadro */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="issue-title">Título de la Incidencia *</label>
            <input
              id="issue-title"
              className="form-input"
              type="text"
              required
              placeholder="Ej: crear la base de la pagina web"
              value={activeDraft.title}
              onChange={(e) => updateActiveDraft('title', e.target.value)}
              data-testid="input-issue-title"
              autoFocus
            />
          </div>

          {/* AI Actions Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => void handleBreakdownTask()}
              disabled={segmenting || submitting || !activeDraft.title.trim()}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {segmenting ? 'Segmentando subtareas con IA...' : 'Segmentar en subtareas con IA'}
            </button>

            {onImprove && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void handleImprove()}
                disabled={improving || submitting || !activeDraft.title.trim()}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {improving ? 'Preparando propuesta...' : 'Sugerir criterios y estimación con IA'}
              </button>
            )}
          </div>

          {/* AI Subtasks Tray (Suggested Subtasks) */}
          {suggestedSubtasks.length > 0 && (
            <div className="subtask-tray">
              <div className="subtask-tray-title">
                <span>Subtareas sugeridas por la IA para complementar esta tarea:</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Acepta una opción para abrir un segundo recuadro personalizable (máx 6)
                </span>
              </div>
              <div className="subtask-card-list">
                {suggestedSubtasks.map((st, i) => {
                  const isAdded = addedSubtaskTitles.includes(st.title);
                  return (
                    <div key={i} className="subtask-card-item">
                      <div className="subtask-card-info">
                        <div className="subtask-card-title">{st.title}</div>
                        <div className="subtask-card-desc">{st.description}</div>
                        <div className="subtask-card-badges">
                          <span className="subtask-badge sp">{st.estimatedStoryPoints || 3} SP</span>
                          <span className="subtask-badge">{st.type || 'TASK'}</span>
                          <span className="subtask-badge high">{st.priority || 'MEDIUM'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-open-recuadro"
                        disabled={isAdded || drafts.length >= MAX_DRAFTS}
                        onClick={() => handleAcceptSubtask(st)}
                      >
                        {isAdded ? 'Recuadro abierto' : '+ Abrir recuadro'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="form-error" role="alert" style={{ marginBottom: '14px' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="issue-acceptance">Criterios de aceptación</label>
            <textarea
              id="issue-acceptance"
              className="form-textarea"
              rows={3}
              placeholder="¿Cómo sabremos que esta historia o subtarea está terminada?"
              value={activeDraft.acceptanceCriteria}
              onChange={(e) => updateActiveDraft('acceptanceCriteria', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="issue-desc">Descripción</label>
            <textarea
              id="issue-desc"
              className="form-textarea"
              rows={3}
              placeholder="Detalles técnicos o funcionales..."
              value={activeDraft.description}
              onChange={(e) => updateActiveDraft('description', e.target.value)}
              data-testid="input-issue-desc"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="issue-type">Tipo</label>
              <select
                id="issue-type"
                className="form-select"
                value={activeDraft.type}
                onChange={(e) => updateActiveDraft('type', e.target.value)}
                data-testid="select-issue-type"
              >
                <option value="STORY">Historia</option>
                <option value="TASK">Tarea</option>
                <option value="BUG">Bug</option>
                <option value="EPIC">Epic</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="issue-priority">Prioridad</label>
              <select
                id="issue-priority"
                className="form-select"
                value={activeDraft.priority}
                onChange={(e) => updateActiveDraft('priority', e.target.value)}
                data-testid="select-issue-priority"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="issue-points">Story Points</label>
              <input
                id="issue-points"
                className="form-input"
                type="number"
                min="0"
                max="100"
                value={activeDraft.storyPoints}
                onChange={(e) => updateActiveDraft('storyPoints', parseInt(e.target.value, 10) || 0)}
                data-testid="input-issue-points"
              />
            </div>
          </div>

          {/* Fibonacci Quick Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginRight: '4px' }}>Fibonacci:</span>
            {[1, 2, 3, 5, 8, 13].map((pts) => (
              <button
                key={pts}
                type="button"
                className={`btn btn-sm ${activeDraft.storyPoints === pts ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.7rem', padding: '2px 7px' }}
                onClick={() => updateActiveDraft('storyPoints', pts)}
              >
                {pts}
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {drafts.length > 1 ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleCloseDraft(activeDraft.id)}
                style={{ color: '#DC2626' }}
              >
                Descartar este recuadro
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !activeDraft.title.trim()}
                data-testid="btn-submit-issue"
              >
                {submitting ? 'Creando...' : 'Crear en Microservicio Go'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
