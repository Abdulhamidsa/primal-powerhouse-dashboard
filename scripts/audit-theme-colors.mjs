import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readdirSync } from 'node:fs';

const repositoryRoot = process.cwd();
const scanRoots = ['src', 'apps/mobile/src'];
const allowlistPath = join(repositoryRoot, 'scripts/theme-color-allowlist.json');
const allowlist = existsSync(allowlistPath) ? JSON.parse(readFileSync(allowlistPath, 'utf8')) : { files: [] };
const allowedFiles = new Set(allowlist.files ?? []);
const extensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const literalPatterns = [
  /#[0-9a-f]{3,8}\b/gi,
  /\b(?:bg|text|border|ring|from|to|via)-(?:red|blue|green|yellow|orange|pink|purple|violet|indigo|emerald|slate|gray|grey|black|white|amber|cyan|teal|lime|rose|sky|fuchsia|zinc|neutral|stone)-[0-9]{2,3}\b/g,
  /\b(?:rgba?|hsla?)\([^)]*\)/g,
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    return extensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [absolutePath] : [];
  });
}

const findings = [];
for (const root of scanRoots) {
  for (const file of walk(join(repositoryRoot, root))) {
    const displayPath = relative(repositoryRoot, file).replaceAll('\\', '/');
    if (allowedFiles.has(displayPath)) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const matches = literalPatterns.flatMap(pattern => line.match(pattern) ?? []);
      if (matches.length) findings.push({ file: displayPath, line: index + 1, values: [...new Set(matches)] });
    });
  }
}

console.log(`Theme color audit: ${findings.length} line(s) with literal colors.`);
for (const finding of findings.slice(0, 200)) console.log(`${finding.file}:${finding.line} ${finding.values.join(', ')}`);
if (findings.length > 200) console.log(`… ${findings.length - 200} additional line(s) omitted.`);
if (process.argv.includes('--strict') && findings.length) process.exitCode = 1;
