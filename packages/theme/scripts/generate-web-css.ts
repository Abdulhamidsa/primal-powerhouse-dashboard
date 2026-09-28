import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { accentThemes } from '../src/accents.ts';
import { accentThemeIds, appearanceModeIds } from '../src/ids.ts';
import { baseModes } from '../src/modes.ts';

const outputPath = resolve(process.cwd(), 'packages/theme/generated/themes.css');
const kebabCase = (value: string) => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

function rgbChannels(value: string): string | null {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (!hex) return null;
  const number = Number.parseInt(hex[1], 16);
  return `${number >> 16} ${(number >> 8) & 255} ${number & 255}`;
}

function emitVariables(prefix: string, values: Record<string, string>) {
  return Object.entries(values).flatMap(([name, value]) => {
    const cssName = `--${prefix}-${kebabCase(name)}`;
    const channels = rgbChannels(value);
    return channels ? [`  ${cssName}: ${value};`, `  ${cssName}-rgb: ${channels};`] : [`  ${cssName}: ${value};`];
  });
}

function emitSelector(selector: string, prefix: string, values: Record<string, string>) {
  return [selector + ' {', ...emitVariables(prefix, values), '}'].join('\n');
}

const effectiveTokens = {
  ...baseModes.dark,
  ...accentThemes.ember,
  link: accentThemes.ember.accent,
  linkHover: accentThemes.ember.accentHover,
  navigationActive: accentThemes.ember.accent,
  navigationActiveBackground: accentThemes.ember.accentMuted,
};
const baseTokenNames = new Set(Object.keys(baseModes.dark));
const accentTokenNames = new Set(Object.keys(accentThemes.ember));
const derivedAccentTokens = new Set(['link', 'linkHover', 'navigationActive', 'navigationActiveBackground']);

function aliasSource(token: string) {
  const name = kebabCase(token);
  if (baseTokenNames.has(token)) return `--mode-${name}`;
  if (accentTokenNames.has(token)) return `--accent-${name}`;
  if (derivedAccentTokens.has(token)) {
    const source = token === 'link' || token === 'navigationActive'
      ? 'accent'
      : token === 'linkHover'
        ? 'accent-hover'
        : 'accent-muted';
    return `--accent-${source}`;
  }
  throw new Error(`No appearance source for ${token}`);
}

function emitEffectiveAliases() {
  const lines = [':root {'];
  for (const token of Object.keys(effectiveTokens)) {
    const source = aliasSource(token);
    const cssName = `--theme-${kebabCase(token)}`;
    lines.push(`  ${cssName}: var(${source});`);
    if (rgbChannels(effectiveTokens[token as keyof typeof effectiveTokens])) lines.push(`  ${cssName}-rgb: var(${source}-rgb);`);
  }
  lines.push(
    '  --color-bg: var(--theme-background);', '  --color-text-black: var(--theme-on-accent);',
    '  --color-background: var(--theme-background);', '  --color-surface: var(--theme-surface);',
    '  --color-bg-alt: var(--theme-surface-elevated);', '  --color-card: var(--theme-card);',
    '  --color-surface-hover: var(--theme-surface-hover);', '  --color-border: var(--theme-border);',
    '  --color-border-strong: var(--theme-border-strong);', '  --color-text: var(--theme-text);',
    '  --color-foreground: var(--theme-text);', '  --color-text-primary: var(--theme-text);',
    '  --color-text-secondary: var(--theme-text-muted);', '  --color-text-muted: var(--theme-text-muted);',
    '  --color-accent: var(--theme-accent);', '  --color-accent-hover: var(--theme-accent-hover);',
    '  --color-accent-muted: var(--theme-accent-muted);', '  --color-accent-translucent: var(--theme-accent-muted);',
    '  --color-text-on-accent: var(--theme-on-accent);', '  --color-input: var(--theme-input-background);',
    '  --color-input-border: var(--theme-input-border);', '  --color-primary: var(--theme-accent);',
    '  --color-link: var(--theme-link);', '  --color-link-hover: var(--theme-link-hover);',
    '  --color-error: var(--theme-error);', '  --color-danger: var(--theme-error);',
    '  --color-success: var(--theme-success);', '  --color-success-muted: var(--theme-success-muted);',
    '  --color-warning: var(--theme-warning);', '  --color-warning-muted: var(--theme-warning-muted);',
    '  --color-info: var(--theme-info);', '  --color-info-muted: var(--theme-info-muted);',
    '  --color-success-bg: var(--theme-success-muted);', '  --color-danger-bg: var(--theme-error-muted);',
    '  --color-danger-muted: var(--theme-error-muted);',
  );
  lines.push('}');
  return lines.join('\n');
}

const css = [
  '/* Generated from packages/theme/src/modes.ts and accents.ts. Do not edit manually. */',
  emitEffectiveAliases(),
  ...appearanceModeIds.map(mode => emitSelector(`:root[data-mode='${mode}']`, 'mode', baseModes[mode])),
  ...accentThemeIds.map(accent => emitSelector(`:root[data-accent='${accent}'], :root:not([data-accent])[data-theme='${accent}']`, 'accent', accentThemes[accent])),
  '',
].join('\n\n');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, css, 'utf8');
