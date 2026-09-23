import { UserPageHero } from '@/components/UserPageHero';
import { Handshake } from 'lucide-react';

export default function UpgradePage() {
  return <div className="px-4 pb-32 pt-4"><div className="mx-auto max-w-3xl"><UserPageHero eyebrow="Next step" title="Upgrade to coaching" description="Personal coaching options will be available here soon." icon={<Handshake size={17} />} /></div></div>;
}
