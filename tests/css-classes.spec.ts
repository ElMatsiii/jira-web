import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * jsdom does not apply CSS, so component tests cannot notice when a redesign deletes or renames a
 * rule that a component still uses (it happened with the AI drawer, the "+ Nuevo recuadro" button,
 * Timeline and Analytics). These checks keep src/index.css and the components in sync both ways.
 */
const SRC = join(__dirname, '..', 'src');
const css = readFileSync(join(SRC, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
const sources = sourceFiles(SRC).map((path) => ({ file: relative(SRC, path).replace(/\\/g, '/'), text: readFileSync(path, 'utf8') }));
const allSource = sources.map((s) => s.text).join('\n');

/** Selectors of every rule, each one split by comma (at-rule headers excluded). */
const selectors = Array.from(css.matchAll(/([^{}]+)\{[^{}]*\}/g))
  .map((block) => block[1].trim())
  .filter((selector) => !selector.startsWith('@'))
  .flatMap((selector) => selector.split(',').map((part) => part.trim()));

/**
 * True when some rule styles the element that carries the class, i.e. the class is in the last
 * compound of a selector (".a", ".a:hover", ".b .a", ".a.is-x"). A class that only appears as an
 * ancestor (".a h2") styles its children, not the element, so it does not count.
 */
const hasRule = (className: string) => {
  const own = new RegExp(`\\.${className.replace(/-/g, '\\-')}(?![\\w-])`);
  return selectors.some((selector) => own.test(selector.split(/\s*[\s>+~]\s*/).pop() || ''));
};

/**
 * Values each dynamic class prefix can take, e.g. `badge-${type.toLowerCase()}`.
 * A new prefix in a component must be added here, so its rules get checked too.
 */
const DYNAMIC_CLASS_VALUES: Record<string, string[]> = {
  'badge-': ['story', 'task', 'bug', 'epic'],
  'priority-': ['low', 'medium', 'high', 'critical'],
  'status-': ['planned', 'active', 'completed', 'cancelled'],
};

/** Literal class tokens of one source: className="…", and quoted/template strings inside className={…}. */
const classTokens = (text: string): string[] => {
  const values: string[] = [];
  for (const match of text.matchAll(/className="([^"]*)"/g)) values.push(match[1]);
  for (const match of text.matchAll(/className=\{([^}]*(?:\}[^}]*)*?)\}(?=[\s/>])/g)) {
    for (const literal of match[1].matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) {
      values.push((literal[1] ?? literal[2] ?? literal[3]).replace(/[\w-]+-\$\{[^}]*\}|\$\{[^}]*\}/g, ' '));
    }
  }
  return values.flatMap((value) => value.split(/\s+/)).filter((token) => /^[a-z][\w-]*[a-z0-9]$/i.test(token));
};

const dynamicPrefixes = Array.from(new Set(Array.from(allSource.matchAll(/([a-z][\w-]*-)\$\{/gi), (m) => m[1])))
  // `${...}` inside non-class strings such as data-testid or aria labels are not classes.
  .filter((prefix) => !/^(ai-story-|ai-story-card-|input-issue-|select-issue-|btn-submit-issue-|issue-draft-card-|issue-row-|btn-advance-|issue-|tab-|draft-)/.test(prefix));

describe('CSS ↔ components', () => {
  it.each(sources.filter((s) => s.file.endsWith('.tsx')).map((s) => [s.file, s.text] as const))(
    'every literal class used by %s has a rule in index.css',
    (_file, text) => {
      const missing = Array.from(new Set(classTokens(text))).filter((name) => !hasRule(name));
      expect(missing).toEqual([]);
    },
  );

  it('knows the values of every dynamic class prefix used in components', () => {
    const classPrefixes = dynamicPrefixes.filter((prefix) =>
      new RegExp(`className=\\{\`[^\`]*${prefix.replace(/-/g, '\\-')}\\$\\{`).test(allSource));
    expect(classPrefixes.sort()).toEqual(Object.keys(DYNAMIC_CLASS_VALUES).sort());
  });

  it.each(Object.entries(DYNAMIC_CLASS_VALUES).flatMap(([prefix, values]) => values.map((value) => `${prefix}${value}`)))(
    'defines a rule for the dynamic class .%s',
    (className) => {
      expect(hasRule(className)).toBe(true);
    },
  );

  it('has no orphan rules: every class selector is referenced by some component', () => {
    const defined = new Set<string>();
    for (const block of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      if (block[1].trim().startsWith('@')) continue;
      for (const match of block[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(match[1]);
    }
    const dynamic = Object.entries(DYNAMIC_CLASS_VALUES).flatMap(([prefix, values]) => values.map((v) => `${prefix}${v}`));
    const referenced = (name: string) =>
      dynamic.includes(name) || new RegExp(`(^|[^\\w-])${name.replace(/-/g, '\\-')}(?![\\w-])`).test(allSource);
    expect(Array.from(defined).filter((name) => !referenced(name)).sort()).toEqual([]);
  });
});

describe('CSS rules that earlier redesigns lost', () => {
  it.each(['ai-drawer-backdrop', 'ai-drawer', 'ai-drawer-header', 'ai-drawer-close', 'ai-drawer-body', 'ai-drawer-footer', 'modal-deck-add-btn'])(
    'defines a rule for .%s',
    (className) => {
      expect(hasRule(className)).toBe(true);
    },
  );

  it.each(['timeline-form', 'timeline-list', 'timeline-sprint', 'timeline-dot', 'sprint-status', 'chart-card', 'burndown-chart', 'stat-box', 'ai-diagnosis-card', 'work-log-section', 'work-log-form'])(
    'defines a rule for the Timeline/Analytics class .%s',
    (className) => {
      expect(hasRule(className)).toBe(true);
    },
  );

  it('no longer ships removed orphan rules', () => {
    for (const name of ['drawer-panel', 'metric-card', 'timeline-sprint-card', 'status-chip', 'backlog-table', 'filter-chip', 'modal-content']) {
      expect(hasRule(name)).toBe(false);
    }
  });
});
