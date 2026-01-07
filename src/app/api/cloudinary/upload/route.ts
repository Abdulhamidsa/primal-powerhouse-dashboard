/**
 * API Route: Upload Image to Cloudinary
 * Handles image uploads with validation and error handling
 * Server-side only for better security control
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateImageFile } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // Check environment variables are configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable');
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your environment.' },
        { status: 500 }
      );
    }

    if (!uploadPreset) {
      console.error('Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable');
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your environment.' },
        { status: 500 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get optional parameters
    const folder = formData.get('folder') as string | null;
    const publicId = formData.get('publicId') as string | null;
    const tags = formData.get('tags') as string | null;

    // Prepare Cloudinary upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);
    cloudinaryFormData.append('folder', folder || 'meals');

    if (publicId) {
      cloudinaryFormData.append('public_id', publicId);
    }

    if (tags) {
      cloudinaryFormData.append('tags', tags);
    }

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('Cloudinary error:', error);
      return NextResponse.json(
        {
          error: 'Failed to upload to Cloudinary',
          details: error.error?.message || 'Unknown error',
        },
        { status: 400 }
      );
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
