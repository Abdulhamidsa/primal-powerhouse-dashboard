'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Mic, Paperclip, SendHorizontal, Square, Trash2, X } from 'lucide-react';
import { useMessageUpload } from '@/features/client-coach-messaging/hooks/useMessageUpload';
import { useVideoRecorder } from '@/features/client-coach-messaging/hooks/useVideoRecorder';
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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const { uploadFile, isUploading } = useMessageUpload();
  const recorder = useVoiceRecorder();
  const videoRecorder = useVideoRecorder();

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

  useEffect(() => {
    if (!videoRecorder.recordedBlob) {
      setVideoPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(videoRecorder.recordedBlob);
    setVideoPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [videoRecorder.recordedBlob]);

  useEffect(() => {
    if (!liveVideoRef.current) return;

    if (!videoRecorder.liveStream) {
      liveVideoRef.current.srcObject = null;
      return;
    }

    liveVideoRef.current.srcObject = videoRecorder.liveStream;
    void liveVideoRef.current.play().catch(() => {
      // Ignore autoplay failures and let the user start playback manually if needed.
    });
  }, [videoRecorder.liveStream]);

  const canSend =
    Boolean(draft.trim() || attachments.length || recorder.recordedBlob || videoRecorder.recordedBlob) && !isSending;

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

      if (videoRecorder.recordedBlob) {
        const videoFile = new File([videoRecorder.recordedBlob], `video-note-${Date.now()}.webm`, {
          type: videoRecorder.recordedBlob.type || 'video/webm',
        });
        const uploadedVideo = await uploadFile(conversationId, videoFile);
        queued = [...queued, uploadedVideo];
      }

      await onSendAction(draft, queued);
      setDraft('');
      setAttachments([]);
      recorder.clearRecording();
      videoRecorder.clearRecording();
    } catch (error) {
      console.error('Send message failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={onSend} className="space-y-3">
      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <button
              key={attachment.publicId}
              type="button"
              onClick={() => removeAttachment(attachment.publicId)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              {attachment.type === 'image' ? <ImagePlus size={11} /> : <Paperclip size={11} />}
              {attachment.type}
              <X size={12} />
            </button>
          ))}
        </div>
      ) : null}

      {videoRecorder.isRecording ? (
        <div
          className="space-y-3 rounded-2xl border px-3 py-3"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-alt)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent)' }} />
              Recording video {formatDuration(videoRecorder.recordingDurationSec)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={videoRecorder.stopRecording}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                aria-label="Stop video recording"
                title="Stop video recording"
              >
                <Square size={14} />
              </button>
              <button
                type="button"
                onClick={videoRecorder.cancelRecording}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                aria-label="Cancel video recording"
                title="Cancel video recording"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <video
            ref={liveVideoRef}
            muted
            playsInline
            autoPlay
            className="w-full max-h-64 rounded-lg border object-cover"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          />
        </div>
      ) : null}

      {recorder.isRecording ? (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-danger) 35%, var(--color-border))',
            background: 'color-mix(in srgb, var(--color-danger) 6%, var(--color-surface))',
          }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--color-danger)' }} />
            Recording {formatDuration(recorder.recordingDurationSec)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recorder.stopRecording}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              aria-label="Stop recording"
              title="Stop recording"
            >
              <Square size={14} />
            </button>
            <button
              type="button"
              onClick={recorder.cancelRecording}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              aria-label="Cancel recording"
              title="Cancel recording"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {voicePreviewUrl ? (
        <div
          className="rounded-2xl border px-3 py-2.5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Voice note ready
            </p>
            <button
              type="button"
              onClick={recorder.clearRecording}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              aria-label="Discard voice note"
              title="Discard voice note"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <audio src={voicePreviewUrl} controls className="w-full" />
        </div>
      ) : null}

      {videoPreviewUrl ? (
        <div
          className="rounded-2xl border px-3 py-2.5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Video note ready
            </p>
            <button
              type="button"
              onClick={videoRecorder.clearRecording}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              aria-label="Discard video note"
              title="Discard video note"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <video src={videoPreviewUrl} controls className="w-full rounded-lg" />
        </div>
      ) : null}

      {recorder.error || videoRecorder.error ? (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {videoRecorder.error ?? recorder.error}
        </p>
      ) : null}

      <div
        className="flex items-end gap-2 border px-3 py-2 shadow-sm"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <label
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Add image or video"
          title="Add image or video"
        >
          <Paperclip size={16} />
          <input type="file" className="hidden" accept="image/*,video/*" onChange={onPickFile} />
        </label>

        <button
          type="button"
          onClick={recorder.startRecording}
          disabled={recorder.isRecording || videoRecorder.isRecording || isUploading || isSending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
          style={{
            borderColor: recorder.recordedBlob ? 'var(--color-accent)' : 'var(--color-border)',
            color: recorder.recordedBlob ? 'var(--color-accent)' : 'var(--color-text-muted)',
            opacity: recorder.isRecording || isUploading || isSending ? 0.5 : 1,
          }}
          aria-label="Record voice note"
          title="Record voice note"
        >
          <Mic size={16} />
        </button>

        <button
          type="button"
          onClick={videoRecorder.startRecording}
          disabled={videoRecorder.isRecording || recorder.isRecording || isUploading || isSending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
          style={{
            borderColor: videoRecorder.recordedBlob ? 'var(--color-accent)' : 'var(--color-border)',
            color: videoRecorder.recordedBlob ? 'var(--color-accent)' : 'var(--color-text-muted)',
            opacity: videoRecorder.isRecording || recorder.isRecording || isUploading || isSending ? 0.5 : 1,
          }}
          aria-label="Record video note"
          title="Record video note"
        >
          <Camera size={16} />
        </button>

        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          rows={1}
          className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none"
          style={{ color: 'var(--color-text)' }}
          placeholder="Message your coach"
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void onSend(event);
            }
          }}
        />

        <button
          type="submit"
          disabled={!canSend || isUploading || isSending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full transition"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            opacity: !canSend || isUploading || isSending ? 0.6 : 1,
          }}
          aria-label={isSending ? 'Sending message' : isUploading ? 'Uploading attachment' : 'Send message'}
          title={isSending ? 'Sending message' : isUploading ? 'Uploading attachment' : 'Send message'}
        >
          {isUploading || isSending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
        </button>
      </div>
    </form>
  );
}
