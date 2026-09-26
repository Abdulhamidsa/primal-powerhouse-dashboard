'use client';

import { useState } from 'react';
import { TrayIcon as Inbox, ChatCenteredTextIcon as MessageSquareText } from '@phosphor-icons/react';
import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';
import { AdminCoachingInterestInbox } from '@/features/coaching-interest/components/AdminCoachingInterestInbox';
import { useAdminCoachingInterests } from '@/features/coaching-interest/hooks/useAdminCoachingInterests';

export function AdminChatWorkspace() {
  const [view, setView] = useState<'chats' | 'requests'>('chats');
  const { pendingCount } = useAdminCoachingInterests('pending');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 p-2">
        <WorkspaceTab active={view === 'chats'} onClick={() => setView('chats')}>
          <MessageSquareText aria-hidden="true" focusable="false" size={16} /> Active chats
        </WorkspaceTab>
        <WorkspaceTab active={view === 'requests'} onClick={() => setView('requests')}>
          <Inbox aria-hidden="true" focusable="false" size={16} /> Requests
          {pendingCount > 0 ? (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-on-accent)]">
              {pendingCount}
            </span>
          ) : null}
        </WorkspaceTab>
      </div>
      <div className="min-h-0 flex-1">
        {view === 'chats' ? <ChatPanel variant="admin" /> : <AdminCoachingInterestInbox />}
      </div>
    </div>
  );
}

function WorkspaceTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors ${active ? 'bg-white/[0.09] text-foreground' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
