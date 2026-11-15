import { groupIssuesByEpic } from '../src/utils/epic-grouping';

const epic = { id: 'e1', key: 'WEB-1' };
const story = { id: 's1', key: 'WEB-2', parentId: 'e1' };
const task = { id: 't1', key: 'WEB-3', parentId: 'e1' };
const loose = { id: 'l1', key: 'WEB-4' };
const unknownParent = { id: 'u1', key: 'WEB-5', parentId: 'gone' };

describe('groupIssuesByEpic', () => {
  it('lists each epic followed by its issues, keeping the original order', () => {
    const rows = groupIssuesByEpic([story, loose, epic, task]);

    expect(rows.map((row) => [row.issue.key, row.nested, row.childCount])).toEqual([
      ['WEB-4', false, 0],
      ['WEB-1', false, 2],
      ['WEB-2', true, 0],
      ['WEB-3', true, 0],
    ]);
  });

  it('keeps an issue at the top level, with its epic key, when the epic is filtered out', () => {
    const rows = groupIssuesByEpic([story, loose], [epic, story, loose]);

    expect(rows).toEqual([
      { issue: story, nested: false, childCount: 0, parentKey: 'WEB-1' },
      { issue: loose, nested: false, childCount: 0 },
    ]);
  });

  it('ignores a parent that is not in the project list', () => {
    expect(groupIssuesByEpic([unknownParent])).toEqual([{ issue: unknownParent, nested: false, childCount: 0 }]);
    expect(groupIssuesByEpic([])).toEqual([]);
  });
});
