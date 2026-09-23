import { UserPageHero } from '@/components/UserPageHero';
import { BookOpen } from 'lucide-react';

export default function LearnPage() {
  return <div className="px-4 pb-32 pt-4"><div className="mx-auto max-w-3xl"><UserPageHero eyebrow="Learn" title="The Primal Method" description="Guides and practical lessons will appear here as they are published." icon={<BookOpen size={17} />} /></div></div>;
}
