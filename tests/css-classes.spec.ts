import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * jsdom does not apply CSS, so component tests cannot notice when a redesign deletes a rule
 * that a component still uses. This guard covers the AI drawer and the "+ Nuevo recuadro" button,
 * whose rules were lost in earlier redesigns.
 */
const css = readFileSync(join(__dirname, '..', 'src', 'index.css'), 'utf8');
const drawerSource = readFileSync(join(__dirname, '..', 'src', 'components', 'AIAssistantDrawer.tsx'), 'utf8');
const modalSource = readFileSync(join(__dirname, '..', 'src', 'components', 'CreateIssueModal.tsx'), 'utf8');

const hasRule = (className: string) => new RegExp(`\\.${className}(?![\\w-])[^{}]*\\{`).test(css);

describe('CSS rules for the AI drawer and the new-draft button', () => {
  it.each(['ai-drawer-backdrop', 'ai-drawer', 'ai-drawer-header', 'ai-drawer-close', 'ai-drawer-body', 'ai-drawer-footer'])(
    'defines a rule for .%s',
    (className) => {
      expect(hasRule(className)).toBe(true);
    },
  );

  it('defines a rule for every ai-drawer* class used by AIAssistantDrawer', () => {
    // data-testid values share the prefix but are not classes, so read only className attributes.
    const classAttributes = drawerSource.match(/className="[^"]*"/g) || [];
    const used = classAttributes
      .flatMap((attr) => attr.slice('className="'.length, -1).split(/\s+/))
      .filter((name) => name.startsWith('ai-drawer'));
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !hasRule(name))).toEqual([]);
  });

  it.each([
    ['AIAssistantDrawer', drawerSource],
    ['AIStoryDetailModal', readFileSync(join(__dirname, '..', 'src', 'components', 'AIStoryDetailModal.tsx'), 'utf8')],
  ])('defines a rule for every literal class used by %s', (_name, source) => {
    // Literal tokens from className="..." and className={`...`} (template expressions are skipped).
    const tokens = [
      ...(source.match(/className="[^"]*"/g) || []).map((attr) => attr.slice('className="'.length, -1)),
      ...(source.match(/className=\{`[^`]*`\}/g) || []).map((attr) => attr.slice('className={`'.length, -2).replace(/\$\{[^}]*\}/g, ' ')),
    ].flatMap((value) => value.split(/\s+/))
      .filter((name) => /^[a-z][\w-]*[a-z0-9]$/i.test(name));
    expect(tokens.length).toBeGreaterThan(10);
    expect(Array.from(new Set(tokens)).filter((name) => !hasRule(name))).toEqual([]);
  });

  it('defines a rule for the "+ Nuevo recuadro" button used by CreateIssueModal', () => {
    expect(modalSource).toContain('className="modal-deck-add-btn"');
    expect(hasRule('modal-deck-add-btn')).toBe(true);
  });

  it('no longer ships the orphan .drawer-panel rule', () => {
    expect(hasRule('drawer-panel')).toBe(false);
  });
});
