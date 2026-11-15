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

/** Up to two full rows of four cards on wide screens (auto-fill grid). */
export const MAX_DRAFTS = 8;

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
  const [submittingDraftIds, setSubmittingDraftIds] = useState<string[]>([]);
  const [improvingDraftId, setImprovingDraftId] = useState<string | null>(null);
  const [segmenting, setSegmenting] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<SuggestedSubtaskItem[]>([]);
  const [error, setError] = useState('');

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (drafts.length === 0) {
        setDrafts([createInitialDraft()]);
      }
      setError('');
    }
  }, [isOpen]);

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

  const updateDraft = (draftId: string, field: keyof IssueDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, [field]: value } : d))
    );
  };

  const handleAddBlankDraft = () => {
    if (drafts.length >= MAX_DRAFTS) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos.`);
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
    setError('');
  };

  const handleCloseDraft = (idToClose: string) => {
    if (drafts.length <= 1) {
      onClose();
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.id !== idToClose));
    setError('');
  };

  const handleCreateDraft = async (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft || !draft.title.trim()) return;

    setSubmittingDraftIds((prev) => [...prev, draftId]);
    setError('');
    try {
      await onCreate({
        title: draft.title,
        description: draft.description,
        type: draft.type,
        priority: draft.priority,
        storyPoints: Number(draft.storyPoints) || 0,
        acceptanceCriteria: draft.acceptanceCriteria,
      });

      if (drafts.length <= 1) {
        setDrafts([createInitialDraft()]);
        setSuggestedSubtasks([]);
        onClose();
      } else {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la incidencia.');
    } finally {
      setSubmittingDraftIds((prev) => prev.filter((id) => id !== draftId));
    }
  };

  const handleBreakdownTask = async (sourceDraft: IssueDraft) => {
    if (!sourceDraft.title.trim()) {
      setError('Ingresa un título para que la IA genere subtareas complementarias.');
      return;
    }
    if (!onBreakdownTask) {
      setSuggestedSubtasks([]);
      setError('El asistente de IA no está disponible en este momento. Inténtalo más tarde.');
      return;
    }
    setSegmenting(true);
    setError('');
    try {
      const res = await onBreakdownTask({
        title: sourceDraft.title,
        description: sourceDraft.description,
      });
      const subtasks = res?.subtasks || [];
      setSuggestedSubtasks(subtasks);
      if (!subtasks.length) {
        setError('La IA no devolvió subtareas para esta incidencia.');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron generar subtareas.');
    } finally {
      setSegmenting(false);
    }
  };

  const handleImprove = async (sourceDraft: IssueDraft) => {
    if (!onImprove || !sourceDraft.title.trim()) return;
    setImprovingDraftId(sourceDraft.id);
    setError('');
    try {
      const suggestion = await onImprove({
        title: sourceDraft.title,
        description: sourceDraft.description,
        type: sourceDraft.type,
      });
      updateDraft(sourceDraft.id, 'storyPoints', suggestion.storyPoints);
      updateDraft(sourceDraft.id, 'acceptanceCriteria', suggestion.acceptanceCriteriaGherkin);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo generar la propuesta.');
    } finally {
      setImprovingDraftId(null);
    }
  };

  // Accepting a subtask creates a new draft AND removes it from suggestions to save vertical space
  const handleAcceptSubtask = (st: SuggestedSubtaskItem) => {
    if (drafts.length >= MAX_DRAFTS) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos.`);
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
    // Remove accepted suggestion so it doesn't take up space
    setSuggestedSubtasks((prev) => prev.filter((item) => item.title !== st.title));
    setError('');
  };

  const handleAcceptAllSubtasks = () => {
    const availableSlots = MAX_DRAFTS - drafts.length;
    if (availableSlots <= 0) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos.`);
      return;
    }

    const toAdd = suggestedSubtasks.slice(0, availableSlots);
    if (toAdd.length === 0) return;

    const newDrafts: IssueDraft[] = toAdd.map((st) => ({
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${Math.random()}`,
      title: st.title,
      description: st.description || '',
      type: st.type || 'TASK',
      priority: st.priority || 'MEDIUM',
      storyPoints: st.estimatedStoryPoints || 3,
      acceptanceCriteria: st.acceptanceCriteriaGherkin || '',
    }));

    setDrafts((prev) => [...prev, ...newDrafts]);
    const addedTitles = new Set(toAdd.map((st) => st.title));
    setSuggestedSubtasks((prev) => prev.filter((st) => !addedTitles.has(st.title)));
    setError('');
  };

  const isMultiGrid = drafts.length > 1;

  // One recuadro: a wide two-column form. Several: cards in a responsive grid (stacked fields).
  const renderCardForm = (draft: IssueDraft, index: number) => {
    const isSubmitting = submittingDraftIds.includes(draft.id);
    const isImproving = improvingDraftId === draft.id;
    const isPrimaryCard = index === 0;

    return (
      <form
        key={draft.id}
        className="modal-grid-card"
        data-testid={`issue-draft-card-${index}`}
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreateDraft(draft.id);
        }}
      >
        {/* Card Header */}
        <div className="modal-grid-card-header">
          <div className="modal-grid-card-title-badge">
            <span className="modal-grid-card-num">#{index + 1}</span>
            <span className="modal-grid-card-label">
              {draft.title.trim() ? draft.title : `Recuadro ${index + 1}`}
            </span>
          </div>

          <div className="modal-grid-card-header-actions">
            <span className="subtask-badge sp">{draft.storyPoints} SP</span>
            {drafts.length > 1 && (
              <button
                type="button"
                className="modal-grid-card-close"
                title="Descartar este recuadro"
                aria-label={`Descartar recuadro ${index + 1}`}
                onClick={() => handleCloseDraft(draft.id)}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="issue-form-layout" data-testid={isPrimaryCard ? 'issue-form-layout' : undefined}>
          <div className="issue-form-main">
            {/* Title Input */}
            <div className="form-group">
              <label className="form-label" htmlFor={`issue-title-${draft.id}`}>
                Título de la Incidencia *
              </label>
              <input
                id={`issue-title-${draft.id}`}
                className="form-input"
                type="text"
                required
                placeholder="Ej: crear la base del proyecto"
                value={draft.title}
                onChange={(e) => updateDraft(draft.id, 'title', e.target.value)}
                data-testid={isPrimaryCard ? 'input-issue-title' : `input-issue-title-${index}`}
                autoFocus={isPrimaryCard && !isMultiGrid}
              />
            </div>

            {/* AI Actions Row */}
            <div className="modal-grid-card-actions-row">
              <button
                type="button"
                className="btn btn-ai btn-sm"
                onClick={() => void handleBreakdownTask(draft)}
                disabled={segmenting || isSubmitting || !draft.title.trim()}
              >
                {segmenting ? 'Segmentando...' : 'Segmentar en subtareas con IA'}
              </button>

              {onImprove && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void handleImprove(draft)}
                  disabled={isImproving || isSubmitting || !draft.title.trim()}
                >
                  {isImproving ? 'Estimando...' : 'Sugerir criterios y estimación con IA'}
                </button>
              )}
            </div>

            {/* AI Subtasks Tray: Only renders pending unaccepted suggestions */}
            {suggestedSubtasks.length > 0 && isPrimaryCard && (
              <div className="subtask-tray">
                <div className="subtask-tray-title">
                  <span>Sugerencias disponibles ({suggestedSubtasks.length}):</span>
                  <div className="subtask-tray-actions">
                    {drafts.length < MAX_DRAFTS && (
                      <button type="button" className="btn btn-sm btn-secondary" onClick={handleAcceptAllSubtasks}>
                        + Añadir todas ({Math.min(suggestedSubtasks.length, MAX_DRAFTS - drafts.length)})
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      title="Ocultar bandeja de sugerencias"
                      aria-label="Ocultar sugerencias"
                      onClick={() => setSuggestedSubtasks([])}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="subtask-card-list">
                  {suggestedSubtasks.map((st, i) => (
                    <div
                      key={i}
                      className="subtask-card-item"
                      onClick={() => {
                        if (drafts.length < MAX_DRAFTS) {
                          handleAcceptSubtask(st);
                        }
                      }}
                      title="Haz clic para abrir esta subtarea en un nuevo recuadro"
                    >
                      <div className="subtask-card-header-row">
                        <div className="subtask-card-title">{st.title}</div>
                        <div className="subtask-card-badges">
                          <span className="subtask-badge sp">{st.estimatedStoryPoints || 3} SP</span>
                          <span className="subtask-badge">{st.type || 'TASK'}</span>
                          <span className="subtask-badge high">{st.priority || 'MEDIUM'}</span>
                        </div>
                      </div>

                      <div className="subtask-card-desc">{st.description}</div>

                      <div className="subtask-card-footer-row">
                        <span className="subtask-card-hint">Clic para abrirla en un nuevo recuadro</span>
                        <button
                          type="button"
                          className="btn-open-recuadro"
                          disabled={drafts.length >= MAX_DRAFTS}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptSubtask(st);
                          }}
                        >
                          + Abrir recuadro
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor={`issue-desc-${draft.id}`}>
                Descripción
              </label>
              <textarea
                id={`issue-desc-${draft.id}`}
                className="form-textarea"
                rows={isMultiGrid ? 2 : 4}
                placeholder="Detalles técnicos o funcionales..."
                value={draft.description}
                onChange={(e) => updateDraft(draft.id, 'description', e.target.value)}
                data-testid={isPrimaryCard ? 'input-issue-desc' : `input-issue-desc-${index}`}
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="form-group">
              <label className="form-label" htmlFor={`issue-acceptance-${draft.id}`}>
                Criterios de aceptación
              </label>
              <textarea
                id={`issue-acceptance-${draft.id}`}
                className="form-textarea"
                rows={isMultiGrid ? 2 : 5}
                placeholder="¿Cómo sabremos que esta historia o subtarea está terminada?"
                value={draft.acceptanceCriteria}
                onChange={(e) => updateDraft(draft.id, 'acceptanceCriteria', e.target.value)}
              />
            </div>
          </div>

          <div className="issue-form-side">
            <div className="form-group">
              <label className="form-label" htmlFor={`issue-type-${draft.id}`}>Tipo</label>
              <select
                id={`issue-type-${draft.id}`}
                className="form-select"
                value={draft.type}
                onChange={(e) => updateDraft(draft.id, 'type', e.target.value)}
                data-testid={isPrimaryCard ? 'select-issue-type' : `select-issue-type-${index}`}
              >
                <option value="STORY">Historia</option>
                <option value="TASK">Tarea</option>
                <option value="BUG">Bug</option>
                <option value="EPIC">Epic</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`issue-priority-${draft.id}`}>Prioridad</label>
              <select
                id={`issue-priority-${draft.id}`}
                className="form-select"
                value={draft.priority}
                onChange={(e) => updateDraft(draft.id, 'priority', e.target.value)}
                data-testid={isPrimaryCard ? 'select-issue-priority' : `select-issue-priority-${index}`}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`issue-points-${draft.id}`}>Story Points</label>
              <input
                id={`issue-points-${draft.id}`}
                className="form-input"
                type="number"
                min="0"
                max="100"
                value={draft.storyPoints}
                onChange={(e) => updateDraft(draft.id, 'storyPoints', parseInt(e.target.value, 10) || 0)}
                data-testid={isPrimaryCard ? 'input-issue-points' : `input-issue-points-${index}`}
              />
            </div>

            {/* Fibonacci Quick Chips */}
            <div className="modal-grid-card-fibonacci">
              <span className="modal-grid-card-fibonacci-label">Fibonacci:</span>
              {[1, 2, 3, 5, 8, 13].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  className={`btn btn-sm ${draft.storyPoints === pts ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateDraft(draft.id, 'storyPoints', pts)}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="modal-grid-card-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleCloseDraft(draft.id)}
          >
            {drafts.length > 1 ? 'Descartar recuadro' : 'Cancelar'}
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSubmitting || !draft.title.trim()}
            data-testid={isPrimaryCard ? 'btn-submit-issue' : `btn-submit-issue-${index}`}
          >
            {isSubmitting ? 'Creando...' : 'Crear en Microservicio Go'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="modal-overlay create-issue-overlay" data-testid="create-issue-modal">
      <div
        className={`create-issue-dialog ${isMultiGrid ? 'is-multi' : 'is-single'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-heading"
        data-testid="create-issue-dialog"
      >
        <header className="create-issue-header">
          <div className="create-issue-heading-group">
            <div>
              <h2 id="create-issue-heading" className="create-issue-title">Crear Nueva Incidencia</h2>
              <p className="create-issue-subtitle">
                Registrada en el Microservicio MS1 (Go + PostgreSQL) vía GraphQL BFF
              </p>
            </div>
            <span className={`modal-grid-counter-badge ${drafts.length >= MAX_DRAFTS ? 'limit' : ''}`}>
              {drafts.length} / {MAX_DRAFTS} recuadros
            </span>
          </div>

          <div className="create-issue-header-actions">
            {drafts.length < MAX_DRAFTS && (
              <button
                type="button"
                className="modal-deck-add-btn"
                onClick={handleAddBlankDraft}
                title="Abrir otro recuadro para crear varias incidencias a la vez"
              >
                + Nuevo recuadro ({drafts.length}/{MAX_DRAFTS})
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm create-issue-close" onClick={onClose} aria-label="Cerrar modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {error && <div className="form-error create-issue-error" role="alert">{error}</div>}

        {/* Scrolls vertically inside the dialog; the header stays visible. */}
        <div className="create-issue-body" data-testid="create-issue-body">
          {isMultiGrid ? (
            <div className="create-issue-grid" data-testid="create-issue-grid">
              {drafts.map((draft, idx) => renderCardForm(draft, idx))}
            </div>
          ) : (
            renderCardForm(drafts[0], 0)
          )}
        </div>
      </div>
    </div>
  );
};
