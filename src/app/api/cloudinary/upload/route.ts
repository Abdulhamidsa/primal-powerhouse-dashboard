/**
 * API Route: Upload Image to Cloudinary
 * Handles image uploads with validation and error handling
 * Server-side only for better security control
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateChatMediaFile } from '@/lib/cloudinary';
import { requireApiAuth, requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

const WEEKLY_CHECKIN_IMAGE_MAX_BYTES = 35 * 1024 * 1024;

function isWeeklyCheckInFolder(folder: string | null): boolean {
  return (folder ?? '').toLowerCase().trim() === 'weekly-checkins';
}

function isImageFile(file: File): boolean {
  return file.type.toLowerCase().startsWith('image/');
}

function isGifImage(file: File): boolean {
  return file.type.toLowerCase() === 'image/gif';
}

export async function POST(request: NextRequest) {
  try {
    // Check environment variables are configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable');
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your environment.' },
        { status: 500 },
      );
    }

    if (!uploadPreset) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable');
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your environment.' },
        { status: 500 },
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get optional parameters
    const folder = formData.get('folder') as string | null;
    const publicId = formData.get('publicId') as string | null;
    const tags = formData.get('tags') as string | null;
    const normalizedFolder = (folder || 'meals').trim().toLowerCase();
    const clientFolders = new Set(['weekly-checkins', 'profile-avatars']);
    const staffFolders = new Set(['meals', 'training-exercises']);

    if (!clientFolders.has(normalizedFolder) && !staffFolders.has(normalizedFolder)) {
      return NextResponse.json({ error: 'Unsupported upload folder' }, { status: 400 });
    }

    if (clientFolders.has(normalizedFolder)) {
      const auth = await requireApiAuth(request, 'client');
      if (!auth.ok) return auth.res;
    } else {
      const auth = await requireStaffActor(request);
      if (!auth.ok) return auth.res;
    }

    if (publicId && !publicId.trim().toLowerCase().startsWith(`${normalizedFolder}/`)) {
      return NextResponse.json({ error: 'Invalid public ID' }, { status: 400 });
    }

    // Validate the file. Weekly check-in images are allowed to be larger.
    const validation = validateChatMediaFile(file);
    const isWeeklyCheckInImage = isWeeklyCheckInFolder(folder) && isImageFile(file);
    const isWeeklyCheckInOversizeImage = isWeeklyCheckInImage && validation.error === 'Image size exceeds 10MB limit.';

    if (!validation.valid && !isWeeklyCheckInOversizeImage) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (isWeeklyCheckInOversizeImage && file.size > WEEKLY_CHECKIN_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: 'Weekly check-in image size exceeds 35MB limit.' }, { status: 400 });
    }

    // Prepare Cloudinary upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);
    cloudinaryFormData.append('folder', normalizedFolder);

    if (publicId) {
      cloudinaryFormData.append('public_id', publicId);
    }

    if (tags) {
      cloudinaryFormData.append('tags', tags);
    }

    // GIFs can go through the image upload endpoint, videos need the video endpoint.
    const uploadUrl = file.type.startsWith('video/')
      ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('Cloudinary upload failed:', safeErrorMessage(error));
      return NextResponse.json(
        {
          error: 'Failed to upload to Cloudinary',
        },
        { status: 400 },
      );
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Upload error:', safeErrorMessage(error));
    return NextResponse.json(
      {
        error: 'Failed to upload image',
      },
      { status: 500 },
    );
  }
}
