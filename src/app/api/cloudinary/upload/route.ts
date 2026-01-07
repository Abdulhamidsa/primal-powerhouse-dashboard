/**
 * API Route: Upload Image to Cloudinary
 * Handles image uploads with validation and error handling
 * Server-side only for better security control
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, validateImageFile } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get optional parameters
    const folder = formData.get('folder') as string | null;
    const publicId = formData.get('publicId') as string | null;
    const tags = formData.get('tags') as string | null;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: folder || undefined,
      publicId: publicId || undefined,
      tags: tags ? tags.split(',') : undefined,
    });

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
