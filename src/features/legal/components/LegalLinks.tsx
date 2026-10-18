const links = [
  ['Privacy Policy', '/legal/privacy'],
  ['Terms of Service', '/legal/terms'],
  ['Health disclaimer', '/legal/health-disclaimer'],
  ['Storage notice', '/legal/storage'],
] as const;

export function LegalLinks({ compact = false, tone = 'accent' }: { compact?: boolean; tone?: 'accent' | 'neutral' }) {
  const linkClassName = tone === 'neutral'
    ? 'text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
    : 'text-primary underline-offset-4 hover:underline';

  return (
    <nav aria-label="Legal documents" className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {links.map(([label, href]) => (
        <a key={href} href={href} className={linkClassName}>
          {label}
        </a>
      ))}
    </nav>
  );
}
