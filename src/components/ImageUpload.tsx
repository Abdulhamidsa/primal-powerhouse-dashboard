/**
 * ImageUpload Component
 * Modern drag-and-drop image upload with preview
 * Local preview only - actual upload happens on form submission
 * Features: drag-and-drop, preview, validation
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon } from '../../node_modules/lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  onFileSelect,
  onError,
  currentImageUrl,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    [disabled]
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

  const handleFile = (file: File) => {
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
    onFileSelect(file);
  };

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
    [disabled, onFileSelect, onError]
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
    onFileSelect(null);

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
        // Image Preview
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-zinc-700 group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized={preview.startsWith('blob:')}
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={20} />
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Upload Zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`
            relative w-full h-64 rounded-lg border-2 border-dashed transition-all cursor-pointer
            ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center mb-4">
              {isDragging ? <Upload size={20} /> : <ImageIcon size={20} />}
            </div>
            <p className="text-lg font-medium text-zinc-300 mb-2">
              {isDragging ? 'Drop image here' : 'Upload meal image'}
            </p>
            <p className="text-sm text-zinc-400 mb-4">Drag and drop or click to browse</p>
            <p className="text-xs text-zinc-500">Supports: JPG, PNG, WebP, GIF (Max 10MB)</p>
            <p className="text-xs text-zinc-500 mt-2">Image will be uploaded when you create the meal</p>
          </div>
        </div>
      )}
    </div>
  );
}
