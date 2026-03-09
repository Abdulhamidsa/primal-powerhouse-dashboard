'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useProfileAvatarEdit } from '@/features/profile-avatar-edit/hooks/useProfileAvatarEdit';
import type { ProfileAvatarResponse } from '@/features/profile-avatar-edit/types/profileAvatar.types';

interface ProfileAvatarEditModalProps {
  isOpen: boolean;
  currentImageUrl?: string;
  onCloseAction: () => void;
  onSavedAction: (result: ProfileAvatarResponse) => void;
}

export function ProfileAvatarEditModal({
  isOpen,
  currentImageUrl,
  onCloseAction,
  onSavedAction,
}: ProfileAvatarEditModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const { submit, isSubmitting, error } = useProfileAvatarEdit();

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError('');

    if (!selectedFile) {
      setUploadError('Please select an image first.');
      return;
    }

    const result = await submit(selectedFile);
    onSavedAction(result);
    setSelectedFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Update Profile Picture</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <ImageUpload
            onFileSelectAction={file => {
              setSelectedFile(file);
              setUploadError('');
            }}
            onError={setUploadError}
            currentImageUrl={currentImageUrl}
            disabled={isSubmitting}
          />

          {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
          {error?.message ? <p className="text-sm text-destructive">{error.message}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Picture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
