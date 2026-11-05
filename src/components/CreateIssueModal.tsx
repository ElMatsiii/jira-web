import React, { useState, useEffect } from 'react';

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
          <div>
            <h2>Crear Nueva Incidencia</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Registrada en el Microservicio MS1 (Go + PostgreSQL) vía GraphQL BFF
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
              autoFocus
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

          {/* Fibonacci Quick Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginRight: '4px' }}>Fibonacci:</span>
            {[1, 2, 3, 5, 8, 13].map((pts) => (
              <button
                key={pts}
                type="button"
                className={`btn btn-sm ${storyPoints === pts ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.7rem', padding: '2px 7px' }}
                onClick={() => setStoryPoints(pts)}
              >
                {pts}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
