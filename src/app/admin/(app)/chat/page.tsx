
import { AdminChatWorkspace } from '@/features/coaching-interest/components/AdminChatWorkspace';
import { AdminPage, AdminPageHeader, AdminPanel } from '@/features/admin-shell/components/AdminPage';
import { RadioIcon as Radio } from '@phosphor-icons/react/ssr';

export default function AdminChatPage() {
  return (
    <AdminPage className="max-w-none">
      <AdminPageHeader
        eyebrow="Coach inbox"
        title="Client Chat"
        description="Review client conversations, answer unread messages, and keep the coaching loop moving from one focused desktop workspace."
        actions={
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground">
            <Radio aria-hidden="true" focusable="false" size={15} className="text-emerald-400" />
            Live messaging
          </div>
        }
      />

      <AdminPanel className="h-[calc(100dvh-220px)] min-h-[620px] overflow-hidden">
        <AdminChatWorkspace />
      </AdminPanel>
    </AdminPage>
  );
}
