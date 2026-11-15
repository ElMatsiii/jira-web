/** Minimal issue shape needed to group the backlog by epic. */
export interface GroupableIssue {
  id: string;
  key: string;
  parentId?: string | null;
}

export interface BacklogRow<T extends GroupableIssue> {
  issue: T;
  /** true for an issue shown under its epic. */
  nested: boolean;
  /** For an epic: how many of its issues are listed under it. */
  childCount: number;
  /** Key of the epic when the issue has one but it is not shown above it (e.g. filtered out). */
  parentKey?: string;
}

/**
 * Orders the visible issues so each epic is followed by its issues (nested). An issue whose epic is
 * not visible stays at the top level and keeps a reference to the epic's key. Order is preserved.
 */
export function groupIssuesByEpic<T extends GroupableIssue>(visible: T[], all: T[] = visible): BacklogRow<T>[] {
  const visibleIds = new Set(visible.map((issue) => issue.id));
  const children = new Map<string, T[]>();
  for (const issue of visible) {
    if (issue.parentId && visibleIds.has(issue.parentId)) {
      children.set(issue.parentId, [...(children.get(issue.parentId) || []), issue]);
    }
  }
  const keyById = new Map(all.map((issue) => [issue.id, issue.key]));

  const rows: BacklogRow<T>[] = [];
  for (const issue of visible) {
    if (issue.parentId && visibleIds.has(issue.parentId)) continue; // listed under its epic
    const own = children.get(issue.id) || [];
    rows.push({
      issue,
      nested: false,
      childCount: own.length,
      ...(issue.parentId && keyById.has(issue.parentId) ? { parentKey: keyById.get(issue.parentId) } : {}),
    });
    for (const child of own) rows.push({ issue: child, nested: true, childCount: 0 });
  }
  return rows;
}
