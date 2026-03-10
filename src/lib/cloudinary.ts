/**
 * Cloudinary Service
 * Handles image uploads and transformations using Cloudinary
 * Best practices: Centralized configuration, error handling, and type safety
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

/**
 * Get Cloudinary configuration from environment variables
 * Validates required environment variables
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'meals';

  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured');
  }

  if (!uploadPreset) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured');
  }

  return {
    cloudName,
    uploadPreset,
    apiKey,
    apiSecret,
    folder,
  };
}

/**
 * Upload an image to Cloudinary using the Upload API
 * Client-side compatible (uses unsigned upload preset)
 */
export async function uploadToCloudinary(
  file: File,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    onProgress?: (progress: number) => void;
  }
): Promise<CloudinaryUploadResult> {
  try {
    const config = getCloudinaryConfig();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', options?.folder || config.folder || 'meals');

    if (options?.publicId) {
      formData.append('public_id', options.publicId);
    }

    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload image to Cloudinary');
    }

    const result: CloudinaryUploadResult = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image');
  }
}

/**
 * Generate a Cloudinary URL with transformations
 * Examples: resize, crop, format conversion, quality optimization
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit' | 'pad';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    gravity?: 'auto' | 'face' | 'center';
    aspectRatio?: string;
  }
): string {
  const config = getCloudinaryConfig();
  const baseUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload`;

  // Build transformation string
  const transformArray: string[] = [];

  if (transformations?.width) transformArray.push(`w_${transformations.width}`);
  if (transformations?.height) transformArray.push(`h_${transformations.height}`);
  if (transformations?.crop) transformArray.push(`c_${transformations.crop}`);
  if (transformations?.quality) transformArray.push(`q_${transformations.quality}`);
  if (transformations?.format) transformArray.push(`f_${transformations.format}`);
  if (transformations?.gravity) transformArray.push(`g_${transformations.gravity}`);
  if (transformations?.aspectRatio) transformArray.push(`ar_${transformations.aspectRatio}`);

  const transformString = transformArray.length > 0 ? `${transformArray.join(',')}/` : '';

  return `${baseUrl}/${transformString}${publicId}`;
}

/**
 * Generate optimized image URL for different use cases
 */
export function getOptimizedImageUrl(
  publicId: string,
  size: 'thumbnail' | 'card' | 'detail' | 'full' = 'card'
): string {
  const presets = {
    thumbnail: { width: 200, height: 200, crop: 'fill', quality: 'auto', format: 'auto' },
    card: { width: 600, height: 400, crop: 'fill', quality: 'auto', format: 'auto' },
    detail: { width: 1200, height: 800, crop: 'fit', quality: 'auto', format: 'auto' },
    full: { width: 2000, quality: 'auto', format: 'auto' },
  } as const;

  return getCloudinaryUrl(publicId, presets[size]);
}

/**
 * Delete an image from Cloudinary
 * Note: Requires API Key and Secret (server-side only)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const config = getCloudinaryConfig();

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Cloudinary API credentials not configured for deletion');
    }

    // This should be called via an API route for security
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image from Cloudinary');
    }

    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
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
}

export function shouldUsePrivateChatMediaDelivery(): boolean {
  const setting = process.env.CHAT_MEDIA_PRIVATE_DELIVERY;
  if (!setting) return true;
  return setting.toLowerCase() !== 'false';
}

export function validateChatMediaFile(file: File): {
  valid: boolean;
  type?: 'image' | 'video' | 'audio';
  error?: string;
} {
  const normalizedType = file.type.toLowerCase().split(';')[0].trim();

  const imageTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ]);
  const videoTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/ogg']);
  const audioTypes = new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
  ]);

  if (imageTypes.has(normalizedType) || normalizedType.startsWith('image/')) {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size exceeds 10MB limit.' };
    }
    return { valid: true, type: 'image' };
  }

  if (videoTypes.has(normalizedType) || normalizedType.startsWith('video/')) {
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'Video size exceeds 50MB limit.' };
    }
    return { valid: true, type: 'video' };
  }

  if (audioTypes.has(normalizedType) || normalizedType.startsWith('audio/')) {
    if (file.size > 25 * 1024 * 1024) {
      return { valid: false, error: 'Audio size exceeds 25MB limit.' };
    }
    return { valid: true, type: 'audio' };
  }

  return {
    valid: false,
    error: 'Unsupported file type. Use image, audio, or video.',
  };
}
