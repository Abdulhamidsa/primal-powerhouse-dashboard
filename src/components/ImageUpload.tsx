/**
 * ImageUpload Component
 * Modern drag-and-drop image upload with preview
 * Local preview only - actual upload happens on form submission
 * Features: drag-and-drop, preview, validation
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { UploadSimpleIcon as Upload, XIcon as X, ImageIcon as ImageIcon } from '@phosphor-icons/react/ssr';

interface ImageUploadProps {
  onFileSelectAction: (file: File | null) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  onFileSelectAction,
  onError,
  currentImageUrl,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit.',
      };
    }

    return { valid: true };
  };

  const handleFile = useCallback(
    (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        onError?.(validation.error!);
        return;
      }

      // Cleanup old preview URL
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setSelectedFile(file);

      // Notify parent component
      onFileSelectAction(file);
    },
    [preview, onError, onFileSelectAction],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));

      if (!imageFile) {
        onError?.('Please drop an image file');
        return;
      }

      handleFile(imageFile);
    },
    [disabled, handleFile, onError],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFile(file);
  };

  const handleRemove = () => {
    // Cleanup preview URL
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setSelectedFile(null);
    onFileSelectAction(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div className="group relative h-64 w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)]">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized={preview.startsWith('blob:')}
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 border-t border-white/10 bg-black/45 p-3 backdrop-blur-md">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload aria-hidden="true" focusable="false" size={16} />
              Change
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X aria-hidden="true" focusable="false" size={16} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`
        relative flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-all
        ${
          isDragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)]'
            : 'border-[var(--color-border)] bg-[var(--color-bg-alt)] hover:bg-[var(--color-surface)]'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
            {isDragging ? (
              <Upload aria-hidden="true" focusable="false" size={20} className="text-[var(--color-accent)]" />
            ) : (
              <ImageIcon aria-hidden="true" focusable="false" size={20} className="text-[var(--color-accent)]" />
            )}
          </div>

          <p className="text-base font-medium text-[var(--color-text)]">
            {isDragging ? 'Drop image here' : 'Upload meal image'}
          </p>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Drag and drop or click to browse</p>

          <p className="mt-4 text-xs text-[var(--color-text-muted)]">Supports JPG, PNG, WebP, GIF up to 10MB</p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Image will be uploaded when you create the meal</p>
        </div>
      )}
    </div>
  );
}
