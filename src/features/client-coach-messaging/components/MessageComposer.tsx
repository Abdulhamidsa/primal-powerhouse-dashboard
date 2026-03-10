'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mic, Paperclip, SendHorizontal, Square, Trash2, X } from 'lucide-react';
import { useMessageUpload } from '@/features/client-coach-messaging/hooks/useMessageUpload';
import { useVoiceRecorder } from '@/features/client-coach-messaging/hooks/useVoiceRecorder';
import type { MessageAttachment } from '@/features/client-coach-messaging/types/messaging.types';

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function MessageComposer({
  conversationId,
  onSendAction,
}: {
  conversationId: string | null;
  onSendAction: (body: string, attachments: MessageAttachment[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const { uploadFile, isUploading } = useMessageUpload();
  const recorder = useVoiceRecorder();

  useEffect(() => {
    if (!recorder.recordedBlob) {
      setVoicePreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(recorder.recordedBlob);
    setVoicePreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [recorder.recordedBlob]);

  const canSend = Boolean(draft.trim() || attachments.length || recorder.recordedBlob) && !isSending;

  const removeAttachment = (publicId: string) => {
    setAttachments(current => current.filter(item => item.publicId !== publicId));
  };

  const uploadAndQueue = async (file: File) => {
    if (!conversationId) return;
    const uploaded = await uploadFile(conversationId, file);
    setAttachments(current => [...current, uploaded]);
  };

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadAndQueue(file);
    } finally {
      event.target.value = '';
    }
  };

  const onSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!conversationId || !canSend) return;

    setIsSending(true);

    try {
      let queued = attachments;
      if (recorder.recordedBlob) {
        const voiceFile = new File([recorder.recordedBlob], `voice-${Date.now()}.webm`, {
          type: recorder.recordedBlob.type || 'audio/webm',
        });
        const uploadedVoice = await uploadFile(conversationId, voiceFile);
        queued = [...queued, uploadedVoice];
      }

      await onSendAction(draft, queued);
      setDraft('');
      setAttachments([]);
      recorder.clearRecording();
    } catch (error) {
      console.error('Send message failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={onSend} className="space-y-3">
      <textarea
        value={draft}
        onChange={event => setDraft(event.target.value)}
        rows={3}
        className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
        placeholder="Write your message"
      />

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <button
              key={attachment.publicId}
              type="button"
              onClick={() => removeAttachment(attachment.publicId)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px]"
              style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
            >
              {attachment.type}
              <X size={12} />
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="rounded-xl border px-3 py-2"
        style={{ borderColor: recorder.isRecording ? 'var(--color-danger)' : 'var(--color-border)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {!recorder.isRecording ? (
            <button
              type="button"
              onClick={recorder.startRecording}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <Mic size={14} />
              Record voice
            </button>
          ) : (
            <>
              <span
                className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                style={{
                  background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
                  color: 'var(--color-danger)',
                }}
              >
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--color-danger)' }} />
                Recording {formatDuration(recorder.recordingDurationSec)}
              </span>

              <button
                type="button"
                onClick={recorder.stopRecording}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                <Square size={14} />
                Stop
              </button>

              <button
                type="button"
                onClick={recorder.cancelRecording}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
            </>
          )}

          {voicePreviewUrl ? (
            <button
              type="button"
              onClick={recorder.clearRecording}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <Trash2 size={14} />
              Discard voice
            </button>
          ) : null}
        </div>

        {voicePreviewUrl ? (
          <div className="mt-2 rounded-lg border p-2" style={{ borderColor: 'var(--color-border)' }}>
            <p className="mb-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Voice preview
            </p>
            <audio src={voicePreviewUrl} controls className="w-full" />
          </div>
        ) : null}
      </div>

      {recorder.error ? (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {recorder.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <Paperclip size={14} />
          Add image or video
          <input type="file" className="hidden" accept="image/*,video/*" onChange={onPickFile} />
        </label>

        <button
          type="submit"
          disabled={!canSend || isUploading || isSending}
          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            opacity: !canSend || isUploading || isSending ? 0.6 : 1,
          }}
        >
          {isUploading || isSending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
          {isSending ? 'Sending...' : isUploading ? 'Uploading...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
