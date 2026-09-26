import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const replacements = {
  Activity: 'Pulse',
  AlertCircle: 'WarningCircle',
  AlertTriangle: 'Warning',
  Apple: 'Orange',
  Award: 'Medal',
  BarChart: 'ChartBar',
  BarChart2: 'ChartBar',
  BarChart3: 'ChartBar',
  Beef: 'Cow',
  CalendarCheck2: 'CalendarCheck',
  CalendarClock: 'CalendarDots',
  CalendarDays: 'CalendarDots',
  ChartNoAxesCombined: 'ChartLineUp',
  CheckCircle2: 'CheckCircle',
  ChevronDown: 'CaretDown',
  ChevronLeft: 'CaretLeft',
  ChevronRight: 'CaretRight',
  ChevronUp: 'CaretUp',
  CircleAlert: 'WarningCircle',
  CircleDot: 'RadioButton',
  ClipboardCheck: 'ClipboardText',
  ClipboardList: 'ClipboardText',
  Clock3: 'Clock',
  CloudOff: 'CloudSlash',
  Droplets: 'Drop',
  Drumstick: 'Bone',
  Dumbbell: 'Barbell',
  Edit: 'PencilSimple',
  Edit2: 'PencilSimple',
  EllipsisVertical: 'DotsThreeVertical',
  EyeOff: 'EyeSlash',
  FileUp: 'FileArrowUp',
  Film: 'FilmSlate',
  Filter: 'Funnel',
  GripVertical: 'DotsSixVertical',
  Home: 'House',
  ImageIcon: 'Image',
  ImagePlus: 'ImagesSquare',
  Inbox: 'Tray',
  KeyRound: 'Key',
  Layers3: 'Stack',
  LayoutList: 'ListBullets',
  LibraryBig: 'Books',
  LineChart: 'ChartLine',
  Loader2: 'CircleNotch',
  LockKeyhole: 'LockKey',
  LogOut: 'SignOut',
  Mail: 'EnvelopeSimple',
  Maximize: 'CornersOut',
  MessageCircle: 'ChatCircle',
  MessageSquare: 'ChatText',
  MessageSquareText: 'ChatCenteredText',
  Mic: 'Microphone',
  MoveRight: 'ArrowRight',
  NotebookText: 'Notebook',
  PanelLeft: 'SidebarSimple',
  PenLine: 'PencilLine',
  RefreshCcw: 'ArrowCounterClockwise',
  RefreshCw: 'ArrowsClockwise',
  RotateCcw: 'ArrowCounterClockwise',
  Route: 'Path',
  Salad: 'BowlFood',
  Save: 'FloppyDisk',
  Scale: 'Scales',
  Search: 'MagnifyingGlass',
  Send: 'PaperPlaneTilt',
  SendHorizontal: 'PaperPlaneRight',
  Settings2: 'GearSix',
  Share2: 'ShareNetwork',
  ShieldAlert: 'ShieldWarning',
  Smartphone: 'DeviceMobile',
  Sparkles: 'ArrowsClockwise',
  Sunrise: 'SunHorizon',
  Trash2: 'Trash',
  TrendingDown: 'TrendDown',
  TrendingUp: 'TrendUp',
  Undo2: 'ArrowCounterClockwise',
  Upload: 'UploadSimple',
  UserPen: 'UserCircleGear',
  UserRound: 'UserCircle',
  UserSquare2: 'UserSquare',
  Utensils: 'ForkKnife',
  UtensilsCrossed: 'ForkKnife',
  VideoIcon: 'VideoCamera',
  Volume2: 'SpeakerHigh',
  VolumeX: 'SpeakerX',
  Wand2: 'PencilSimple',
  Wheat: 'Grains',
  Workflow: 'FlowArrow',
  Zap: 'Lightning',
};

const svgReplacements = new Map([
  ['M6 18L18 6M6 6l12 12', 'X'],
  ['M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', 'VideoCamera'],
  ['M5 13l4 4L19 7', 'Check'],
  ['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', 'MagnifyingGlass'],
  ['M4 12a8 8 0 018-8V0C5.373 0 0 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z', 'CircleNotch'],
  ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', 'Trash'],
  ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 'Clock'],
  ['M12 20h9 | M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', 'PencilSimple'],
  ['M3 6h18 | M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 | M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'Trash'],
  ['M12 4v16m8-8H4', 'Plus'],
  ['M15 19l-7-7 7-7', 'CaretLeft'],
  ['M9 5l7 7-7 7', 'CaretRight'],
  ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', 'PencilSimple'],
  ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', 'Lightbulb'],
  ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 'User'],
  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'ClipboardText'],
  ['M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5', 'ForkKnife'],
  ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 'Users'],
  ['M22 12h-4l-3 9L9 3l-3 9H2', 'Pulse'],
  ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'User'],
  ['M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', 'Users'],
  ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', 'Image'],
  ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'Eye'],
  ['M13 10V3L4 14h7v7l9-11h-7z', 'Lightning'],
  ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 'Calendar'],
  ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'FileText'],
  ['M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', 'ClipboardText'],
  ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z', 'ChartBar'],
  ['M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', 'Flask'],
  ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', 'Tag'],
  ['M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z', 'Check'],
  ['M8 5v10l7-5z', 'Play'],
  ['M10 12a2 2 0 100-4 2 2 0 000 4z | M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z', 'Eye'],
  ['M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489A2 2 0 0111.85 18H8.15a2 2 0 01-1.051-1.511L7.22 15H5a2 2 0 01-2-2V5zm5.771 4.757a.75.75 0 101.498-.104L9.75 7.5A.75.75 0 101 8l.479 2.757z', 'VideoCamera'],
  ['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 'ChatCircle'],
  ['M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.253v0c0 5.5 4.5 10 10 10s10-4.5 10-10v0c0-5.5-4.5-10-10-10z', 'ForkKnife'],
  ['M18 6 6 18 | m6 6 12 12', 'X'],
  ['M15.477 12.89 17 22l-5-3-5 3 1.523-9.11', 'Medal'],
  ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'Tag'],
  ['M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', 'Flame'],
  ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z | M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'Gear'],
  ['M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3', 'ThumbsUp'],
  ['M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-2-9a9 9 0 11-18 0 9 9 0 0118 0z', 'WarningCircle'],
  ['M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4', 'SlidersHorizontal'],
  ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z', 'Warning'],
  ['M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', 'EnvelopeSimple'],
  ['M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', 'Phone'],
  ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'Eye'],
  ['M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 'Eye'],
  ['M10.5 8.5V15.5L16 12L10.5 8.5Z | M7 4.5H17C18.3807 4.5 19.5 5.61929 19.5 7V17C19.5 18.3807 18.3807 19.5 17 19.5H7C5.61929 19.5 4.5 18.3807 4.5 17V7C4.5 5.61929 5.61929 4.5 7 4.5Z', 'VideoCamera'],
]);

const files = execFileSync('rg', ['-l', 'lucide-react', 'src', '-g', '*.ts', '-g', '*.tsx'], {
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

const names = new Set();
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]lucide-react['"]/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim();
      if (name) names.add(name);
    }
  }
}

console.log([...names].sort().join('\n'));
console.error(`COUNT=${names.size}`);

if (process.argv.includes('--apply')) {
  for (const file of files) {
    let source = fs.readFileSync(file, 'utf8');
    const isClient = /^\s*['"]use client['"];/.test(source);
    const moduleName = isClient ? '@phosphor-icons/react' : '@phosphor-icons/react/ssr';

    source = source.replace(
      /import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"](?:lucide-react|\.\.\/\.\.\/node_modules\/lucide-react)['"];?/g,
      (_full, typeKeyword = '', specifiers) => {
        const mapped = specifiers
          .split(',')
          .map(part => part.trim())
          .filter(Boolean)
          .map(part => {
            const [importedRaw, localRaw] = part.replace(/^type\s+/, '').split(/\s+as\s+/);
            const imported = importedRaw.trim();
            const local = localRaw?.trim() ?? imported;
            if (imported === 'LucideIcon') return `Icon as ${local}`;
            const target = replacements[imported] ?? imported;
            return `${target}Icon as ${local}`;
          });
        return `import ${typeKeyword}{ ${mapped.join(', ')} } from '${moduleName}';`;
      },
    );

    fs.writeFileSync(file, source);
  }
}

if (process.argv.includes('--svg')) {
  const svgFiles = execFileSync('rg', ['-l', '<svg', 'src', '-g', '*.tsx'], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const groups = new Map();
  for (const file of svgFiles) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<svg\b[\s\S]*?<\/svg>/g)) {
      const block = match[0];
      const paths = [...block.matchAll(/\bd=["']([^"']+)["']/g)].map(item => item[1]);
      const key = paths.join(' | ') || block.replace(/\s+/g, ' ').slice(0, 140);
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      const rows = groups.get(key) ?? [];
      rows.push(`${file}:${line}`);
      groups.set(key, rows);
    }
  }
  for (const [key, rows] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n[${rows.length}] ${key}\n${rows.join('\n')}`);
  }
}

if (process.argv.includes('--apply-svg')) {
  const svgFiles = execFileSync('rg', ['-l', '<svg', 'src', '-g', '*.tsx'], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  for (const file of svgFiles) {
    let source = fs.readFileSync(file, 'utf8');
    const icons = new Set();
    source = source.replace(/<svg\b[\s\S]*?<\/svg>/g, block => {
      if (block.includes('daily-completion-ring-gradient') || block.includes('17.472 14.382')) return block;
      const paths = [...block.matchAll(/\bd=["']([^"']+)["']/g)].map(item => item[1]);
      const key = paths.join(' | ');
      const icon = svgReplacements.get(key);
      if (!icon) return block;

      icons.add(`${icon}Icon`);
      const opening = block.match(/^<svg\b([\s\S]*?)>/)?.[1] ?? '';
      const className = opening.match(/\bclassName=(?:"[^"]*"|'[^']*'|\{[^}]*\})/)?.[0];
      const width = opening.match(/\bwidth=("[^"]*"|'[^']*'|\{[^}]*\})/)?.[1];
      const filled = /\bfill=["']currentColor["']/.test(opening);
      const props = [className, width && !className?.includes('w-') ? `size=${width}` : null, filled ? 'weight="fill"' : null, 'aria-hidden="true"', 'focusable="false"']
        .filter(Boolean)
        .join(' ');
      return `<${icon}Icon ${props} />`;
    });

    if (icons.size) {
      const isClient = /^\s*['"]use client['"];/.test(source);
      const moduleName = isClient ? '@phosphor-icons/react' : '@phosphor-icons/react/ssr';
      const importLine = `import { ${[...icons].sort().join(', ')} } from '${moduleName}';\n`;
      const directive = source.match(/^(['"]use client['"];\s*)/);
      if (directive) {
        source = source.slice(0, directive[0].length) + '\n' + importLine + source.slice(directive[0].length);
      } else {
        source = importLine + source;
      }
      fs.writeFileSync(file, source);
    }
  }
}
