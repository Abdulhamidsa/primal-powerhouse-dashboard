import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { themeIds } from '../src/ids.ts';
import { themes } from '../src/themes.ts';

const outputPath = resolve(process.cwd(), 'packages/theme/generated/themes.css');

const kebabCase = (value: string) => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

function rgbChannels(value: string): string | null {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (!hex) return null;
  const number = Number.parseInt(hex[1], 16);
  return `${number >> 16} ${(number >> 8) & 255} ${number & 255}`;
}

function emitTheme(themeId: (typeof themeIds)[number], selector: string) {
  const tokens = themes[themeId];
  const lines = [`${selector} {`];

  for (const [name, value] of Object.entries(tokens)) {
    const cssName = `--theme-${kebabCase(name)}`;
    lines.push(`  ${cssName}: ${value};`);
    const channels = rgbChannels(value);
    if (channels) lines.push(`  ${cssName}-rgb: ${channels};`);
  }

  lines.push('  --color-bg: var(--theme-background);');
  lines.push('  --color-text-black: var(--theme-on-accent);');
  lines.push('  --color-background: var(--theme-background);');
  lines.push('  --color-surface: var(--theme-surface);');
  lines.push('  --color-bg-alt: var(--theme-surface-elevated);');
  lines.push('  --color-card: var(--theme-card);');
  lines.push('  --color-surface-hover: var(--theme-surface-hover);');
  lines.push('  --color-border: var(--theme-border);');
  lines.push('  --color-border-strong: var(--theme-border-strong);');
  lines.push('  --color-text: var(--theme-text);');
  lines.push('  --color-foreground: var(--theme-text);');
  lines.push('  --color-text-primary: var(--theme-text);');
  lines.push('  --color-text-secondary: var(--theme-text-muted);');
  lines.push('  --color-text-muted: var(--theme-text-muted);');
  lines.push('  --color-accent: var(--theme-accent);');
  lines.push('  --color-accent-hover: var(--theme-accent-hover);');
  lines.push('  --color-accent-muted: var(--theme-accent-muted);');
  lines.push('  --color-accent-translucent: var(--theme-accent-muted);');
  lines.push('  --color-text-on-accent: var(--theme-on-accent);');
  lines.push('  --color-input: var(--theme-input-background);');
  lines.push('  --color-input-border: var(--theme-input-border);');
  lines.push('  --color-primary: var(--theme-accent);');
  lines.push('  --color-error: var(--theme-error);');
  lines.push('  --color-danger: var(--theme-error);');
  lines.push('  --color-success: var(--theme-success);');
  lines.push('  --color-success-muted: var(--theme-success-muted);');
  lines.push('  --color-warning: var(--theme-warning);');
  lines.push('  --color-warning-muted: var(--theme-warning-muted);');
  lines.push('  --color-info: var(--theme-info);');
  lines.push('  --color-info-muted: var(--theme-info-muted);');
  lines.push('  --color-success-bg: var(--theme-success-muted);');
  lines.push('  --color-danger-bg: var(--theme-error-muted);');
  lines.push('  --color-danger-muted: var(--theme-error-muted);');
  lines.push('}');
  return lines.join('\n');
}

const css = [
  '/* Generated from packages/theme/src/themes.ts. Do not edit manually. */',
  emitTheme('ember', ':root'),
  ...themeIds.filter(themeId => themeId !== 'ember').map(themeId => emitTheme(themeId, `:root[data-theme='${themeId}']`)),
  '',
].join('\n\n');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, css, 'utf8');
