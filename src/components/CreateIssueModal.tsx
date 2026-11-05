import React, { useState } from 'react';

export interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (issue: {
    title: string;
    description: string;
    type: string;
    priority: string;
    storyPoints: number;
  }) => Promise<void> | void;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('STORY');
  const [priority, setPriority] = useState('MEDIUM');
  const [storyPoints, setStoryPoints] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onCreate({
        title,
        description,
        type,
        priority,
        storyPoints: Number(storyPoints) || 0,
      });
      setTitle('');
      setDescription('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="create-issue-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Crear Nueva Incidencia</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="issue-title">Título de la Incidencia *</label>
            <input
              id="issue-title"
              className="form-input"
              type="text"
              required
              placeholder="Ej: Implementar pasarela de pagos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-issue-title"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="issue-desc">Descripción</label>
            <textarea
              id="issue-desc"
              className="form-textarea"
              rows={3}
              placeholder="Detalles técnicos o funcionales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-issue-desc"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="issue-type">Tipo</label>
              <select
                id="issue-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
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
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value, 10) || 0)}
                data-testid="input-issue-points"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !title.trim()}
              data-testid="btn-submit-issue"
            >
              {submitting ? 'Creando...' : 'Crear en Microservicio Go'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
