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
  const [submittingDraftIds, setSubmittingDraftIds] = useState<string[]>([]);
  const [improvingDraftId, setImprovingDraftId] = useState<string | null>(null);
  const [segmenting, setSegmenting] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<SuggestedSubtaskItem[]>([]);
  const [addedSubtaskTitles, setAddedSubtaskTitles] = useState<string[]>([]);
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
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos en el grid.`);
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
        setAddedSubtaskTitles([]);
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
    setSegmenting(true);
    setError('');
    try {
      if (onBreakdownTask) {
        const res = await onBreakdownTask({
          title: sourceDraft.title,
          description: sourceDraft.description,
        });
        setSuggestedSubtasks(res.subtasks || []);
      } else {
        setSuggestedSubtasks([
          {
            title: `Crear Frontend para ${sourceDraft.title}`,
            description: 'Estructurar vistas cliente, componentes reutilizables y estilos.',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 3,
            acceptanceCriteriaGherkin: 'Given la interfaz When el usuario interactúa Then responde visualmente',
          },
          {
            title: `Crear Backend y API para ${sourceDraft.title}`,
            description: 'Servicios de lógica de negocio, endpoints y persistencia de datos.',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 5,
            acceptanceCriteriaGherkin: 'Given endpoints activos When se envían peticiones Then retorna estado 200',
          },
          {
            title: `Configurar Base de Datos para ${sourceDraft.title}`,
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

  const handleAcceptSubtask = (st: SuggestedSubtaskItem) => {
    if (drafts.length >= MAX_DRAFTS) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos en el grid.`);
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
    setAddedSubtaskTitles((prev) => [...prev, st.title]);
    setError('');
  };

  const handleAcceptAllSubtasks = () => {
    const availableSlots = MAX_DRAFTS - drafts.length;
    if (availableSlots <= 0) {
      setError(`Límite alcanzado: máximo ${MAX_DRAFTS} recuadros simultáneos en el grid.`);
      return;
    }

    const toAdd = suggestedSubtasks
      .filter((st) => !addedSubtaskTitles.includes(st.title))
      .slice(0, availableSlots);

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
    setAddedSubtaskTitles((prev) => [...prev, ...toAdd.map((st) => st.title)]);
    setError('');
  };

  const isMultiGrid = drafts.length > 1;

  // Render individual form fields inside a recuadro card
  const renderCardForm = (draft: IssueDraft, index: number) => {
    const isSubmitting = submittingDraftIds.includes(draft.id);
    const isImproving = improvingDraftId === draft.id;
    const isPrimaryCard = index === 0;

    return (
      <form
        key={draft.id}
        className="modal-grid-card"
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
              {draft.title.trim()
                ? draft.title.length > 26
                  ? draft.title.substring(0, 24) + '...'
                  : draft.title
                : `Recuadro ${index + 1}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="subtask-badge sp">{draft.storyPoints} SP</span>
            {drafts.length > 1 && (
              <button
                type="button"
                className="modal-grid-card-close"
                title="Descartar este recuadro del grid"
                aria-label={`Descartar recuadro ${index + 1}`}
                onClick={() => handleCloseDraft(draft.id)}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="form-group" style={{ marginBottom: '8px' }}>
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
            autoFocus={isPrimaryCard}
          />
        </div>

        {/* AI Actions Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <button
            type="button"
            className="btn btn-ai"
            onClick={() => void handleBreakdownTask(draft)}
            disabled={segmenting || isSubmitting || !draft.title.trim()}
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
          >
            {segmenting ? 'Segmentando...' : 'Segmentar en subtareas con IA'}
          </button>

          {onImprove && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handleImprove(draft)}
              disabled={isImproving || isSubmitting || !draft.title.trim()}
              style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            >
              {isImproving ? 'Estimando...' : 'Sugerir criterios y estimación con IA'}
            </button>
          )}
        </div>

        {/* AI Subtasks Tray (Suggested Subtasks) */}
        {suggestedSubtasks.length > 0 && isPrimaryCard && (
          <div className="subtask-tray">
            <div className="subtask-tray-title">
              <span>Subtareas sugeridas por la IA para complementar esta tarea:</span>
              {drafts.length < MAX_DRAFTS && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={handleAcceptAllSubtasks}
                >
                  + Añadir todas al Grid ({MAX_DRAFTS - drafts.length} disp.)
                </button>
              )}
            </div>

            <div className="subtask-card-list">
              {suggestedSubtasks.map((st, i) => {
                const isAdded = addedSubtaskTitles.includes(st.title);
                return (
                  <div
                    key={i}
                    className={`subtask-card-item ${isAdded ? 'added' : ''}`}
                    onClick={() => {
                      if (!isAdded && drafts.length < MAX_DRAFTS) {
                        handleAcceptSubtask(st);
                      }
                    }}
                    title={isAdded ? 'Ya agregada al grid' : 'Clic para abrir este recuadro en el grid'}
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
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {isAdded ? 'Mostrándose en el Grid 3x2' : 'Haz clic para agregar al grid simultáneo'}
                      </span>
                      <button
                        type="button"
                        className="btn-open-recuadro"
                        disabled={isAdded || drafts.length >= MAX_DRAFTS}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptSubtask(st);
                        }}
                      >
                        {isAdded ? 'Recuadro abierto' : '+ Abrir recuadro'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acceptance Criteria */}
        <div className="form-group" style={{ marginBottom: '8px' }}>
          <label className="form-label" htmlFor={`issue-acceptance-${draft.id}`}>
            Criterios de aceptación
          </label>
          <textarea
            id={`issue-acceptance-${draft.id}`}
            className="form-textarea"
            rows={2}
            placeholder="¿Cómo sabremos que esta historia o subtarea está terminada?"
            value={draft.acceptanceCriteria}
            onChange={(e) => updateDraft(draft.id, 'acceptanceCriteria', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="form-group" style={{ marginBottom: '8px' }}>
          <label className="form-label" htmlFor={`issue-desc-${draft.id}`}>
            Descripción
          </label>
          <textarea
            id={`issue-desc-${draft.id}`}
            className="form-textarea"
            rows={2}
            placeholder="Detalles técnicos o funcionales..."
            value={draft.description}
            onChange={(e) => updateDraft(draft.id, 'description', e.target.value)}
            data-testid={isPrimaryCard ? 'input-issue-desc' : `input-issue-desc-${index}`}
          />
        </div>

        {/* Row: Type, Priority, Story Points */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
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
        </div>

        {/* Fibonacci Quick Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginRight: '2px' }}>Fibonacci:</span>
          {[1, 2, 3, 5, 8, 13].map((pts) => (
            <button
              key={pts}
              type="button"
              className={`btn btn-sm ${draft.storyPoints === pts ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.68rem', padding: '1px 6px' }}
              onClick={() => updateDraft(draft.id, 'storyPoints', pts)}
            >
              {pts}
            </button>
          ))}
        </div>

        {/* Card Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
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
    <div
      className={`modal-overlay ${isMultiGrid ? 'grid-mode' : ''}`}
      role="dialog"
      aria-modal="true"
      data-testid="create-issue-modal"
    >
      {/* 1 CARD MODE: Centered on Screen */}
      {!isMultiGrid && (
        <div className="modal-card">
          {/* Header Banner */}
          <div className="modal-header">
            <div>
              <h2>Crear Nueva Incidencia</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Registrada en el Microservicio MS1 (Go + PostgreSQL) vía GraphQL BFF
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="modal-grid-counter-badge">
                1 / {MAX_DRAFTS} recuadros
              </span>
              <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar modal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick bar to add new blank recuadro */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              className="modal-deck-add-btn"
              onClick={handleAddBlankDraft}
              title="Abrir un segundo recuadro simultáneo en grid 3x2"
            >
              + Nuevo recuadro (1/{MAX_DRAFTS})
            </button>
          </div>

          {error && <div className="form-error" role="alert" style={{ marginBottom: '14px' }}>{error}</div>}

          {/* Render the single centered card */}
          {renderCardForm(drafts[0], 0)}
        </div>
      )}

      {/* MULTI-CARD MODE (2 to 6 CARDS): SIMULTANEOUS 3x2 GRID */}
      {isMultiGrid && (
        <div style={{ width: '100%', maxWidth: '1560px', margin: '0 auto' }}>
          {/* Top Sticky Bar */}
          <div className="modal-grid-top-bar">
            <div className="modal-grid-top-left">
              <div>
                <h2 className="modal-grid-top-title">Crear Nueva Incidencia</h2>
                <p className="modal-grid-top-subtitle">
                  Vista simultánea en Grid 3x2 — Microservicio MS1 (Go + PostgreSQL)
                </p>
              </div>
              <span
                className={`modal-grid-counter-badge ${drafts.length >= MAX_DRAFTS ? 'limit' : ''}`}
              >
                {drafts.length} / {MAX_DRAFTS} recuadros simultáneos
              </span>
            </div>

            <div className="modal-grid-top-actions">
              {drafts.length < MAX_DRAFTS && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddBlankDraft}
                  title="Abrir un nuevo recuadro en el grid"
                >
                  + Nuevo recuadro ({drafts.length}/{MAX_DRAFTS})
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                Cancelar
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: '14px', maxWidth: '1560px' }}>
              {error}
            </div>
          )}

          {/* 3x2 Grid Cards Container */}
          <div className={`modal-grid-container cols-${Math.min(drafts.length, 3)}`}>
            {drafts.map((draft, idx) => renderCardForm(draft, idx))}
          </div>
        </div>
      )}
    </div>
  );
};
