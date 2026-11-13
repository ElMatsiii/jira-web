export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export const normalizeType = (val: unknown): IssueType => {
  if (typeof val === 'number') {
    switch (val) {
      case 1:
        return 'STORY';
      case 2:
        return 'TASK';
      case 3:
        return 'BUG';
      case 4:
        return 'EPIC';
      default:
        return 'TASK';
    }
  }
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'STORY' || upper === 'HISTORIA') return 'STORY';
    if (upper === 'TASK' || upper === 'TAREA') return 'TASK';
    if (upper === 'BUG') return 'BUG';
    if (upper === 'EPIC' || upper === 'ÉPICA' || upper === 'EPICA') return 'EPIC';
    if (upper === '1') return 'STORY';
    if (upper === '2') return 'TASK';
    if (upper === '3') return 'BUG';
    if (upper === '4') return 'EPIC';
  }
  return 'TASK';
};

export const normalizePriority = (val: unknown): IssuePriority => {
  if (typeof val === 'number') {
    switch (val) {
      case 1:
        return 'LOW';
      case 2:
        return 'MEDIUM';
      case 3:
        return 'HIGH';
      case 4:
        return 'CRITICAL';
      default:
        return 'MEDIUM';
    }
  }
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'LOW' || upper === 'BAJA') return 'LOW';
    if (upper === 'MEDIUM' || upper === 'MEDIA') return 'MEDIUM';
    if (upper === 'HIGH' || upper === 'ALTA') return 'HIGH';
    if (upper === 'CRITICAL' || upper === 'CRÍTICA' || upper === 'CRITICA') return 'CRITICAL';
    if (upper === '1') return 'LOW';
    if (upper === '2') return 'MEDIUM';
    if (upper === '3') return 'HIGH';
    if (upper === '4') return 'CRITICAL';
  }
  return 'MEDIUM';
};

export const normalizeStatus = (val: unknown): IssueStatus => {
  if (typeof val === 'number') {
    switch (val) {
      case 1:
        return 'TODO';
      case 2:
        return 'IN_PROGRESS';
      case 3:
        return 'IN_REVIEW';
      case 4:
        return 'DONE';
      default:
        return 'TODO';
    }
  }
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'TODO' || upper === 'POR HACER') return 'TODO';
    if (upper === 'IN_PROGRESS' || upper === 'EN PROGRESO') return 'IN_PROGRESS';
    if (upper === 'IN_REVIEW' || upper === 'EN REVISIÓN' || upper === 'EN REVISION') return 'IN_REVIEW';
    if (upper === 'DONE' || upper === 'LISTO') return 'DONE';
  }
  return 'TODO';
};

export const typeToId = (val: unknown): number => {
  const norm = normalizeType(val);
  switch (norm) {
    case 'STORY':
      return 1;
    case 'TASK':
      return 2;
    case 'BUG':
      return 3;
    case 'EPIC':
      return 4;
    default:
      return 2;
  }
};

export const priorityToId = (val: unknown): number => {
  const norm = normalizePriority(val);
  switch (norm) {
    case 'LOW':
      return 1;
    case 'MEDIUM':
      return 2;
    case 'HIGH':
      return 3;
    case 'CRITICAL':
      return 4;
    default:
      return 2;
  }
};
