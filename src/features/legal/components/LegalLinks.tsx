const links = [
  ['Privacy Policy', '/legal/privacy'],
  ['Terms of Service', '/legal/terms'],
  ['Health disclaimer', '/legal/health-disclaimer'],
  ['AI disclosure', '/legal/ai-disclosure'],
  ['Storage notice', '/legal/storage'],
] as const;

export function LegalLinks({ compact = false }: { compact?: boolean }) {
  return (
    <nav aria-label="Legal documents" className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {links.map(([label, href]) => (
        <a key={href} href={href} className="text-primary underline-offset-4 hover:underline">
          {label}
        </a>
      ))}
    </nav>
  );
}
