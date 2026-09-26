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
