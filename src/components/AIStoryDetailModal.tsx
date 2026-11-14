import React, { useState } from 'react';
import { normalizePriority, normalizeType } from '../utils/issue-utils';

export interface AISuggestedStory {
  title: string;
  description: string;
  type: string;
  priority?: string;
  estimatedStoryPoints: number;
  acceptanceCriteriaGherkin: string;
}

export interface AIStoryDetailModalProps {
  story: AISuggestedStory;
  /** Whether the story can still be created (pending and a create handler exists). */
  canCreate: boolean;
  onSave: (story: AISuggestedStory) => void;
  onSaveAndCreate: (story: AISuggestedStory) => void;
  onClose: () => void;
}

/**
 * Full view of an AI-suggested story: description and Gherkin criteria can be edited before creating it.
 * Esc handling lives in the drawer, which closes this modal before closing itself.
 */
export const AIStoryDetailModal: React.FC<AIStoryDetailModalProps> = ({ story, canCreate, onSave, onSaveAndCreate, onClose }) => {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [criteria, setCriteria] = useState(story.acceptanceCriteriaGherkin);
  const type = normalizeType(story.type);
  const priority = normalizePriority(story.priority);
  const edited = (): AISuggestedStory => ({
    ...story,
    title: title.trim() || story.title,
    description,
    acceptanceCriteriaGherkin: criteria,
  });

  return (
    <div
      className="modal-overlay ai-story-detail-overlay"
      data-testid="ai-story-detail-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-card ai-story-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-story-detail-heading"
        data-testid="ai-story-detail"
      >
        <header className="modal-header">
          <h4 id="ai-story-detail-heading" className="ai-story-detail-heading">Detalle de la historia sugerida</h4>
          <button type="button" className="btn btn-secondary btn-sm ai-drawer-close" onClick={onClose} aria-label="Cerrar detalle">
            ✕
          </button>
        </header>

        <div className="ai-story-meta">
          <span className={`badge badge-${type.toLowerCase()}`}>{type}</span>
          <span className={`priority-${priority.toLowerCase()}`}>● {priority}</span>
          <span className="points-pill">{Number(story.estimatedStoryPoints) || 0} SP</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ai-story-detail-title">Título</label>
          <input id="ai-story-detail-title" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ai-story-detail-description">Descripción</label>
          <textarea
            id="ai-story-detail-description"
            className="form-textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ai-story-detail-criteria">Criterios de aceptación (Gherkin)</label>
          <textarea
            id="ai-story-detail-criteria"
            className="form-textarea ai-gherkin-input"
            rows={8}
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
        </div>

        <footer className="ai-story-detail-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSave(edited())}>Guardar cambios</button>
          {canCreate && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onSaveAndCreate(edited())}>
              Guardar y crear
            </button>
          )}
        </footer>
      </section>
    </div>
  );
};
