/**
 * API Route: Delete Image from Cloudinary
 * Server-side only (requires API credentials)
 */

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireCloudinaryAssetAccess } from '@/lib/cloudinary-access';
import { safeErrorMessage } from '@/lib/security/log-redaction';

// Configure Cloudinary (server-side only)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const publicId = typeof body?.publicId === 'string' ? body.publicId.trim() : '';

    if (!publicId || publicId.length > 512) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    const access = await requireCloudinaryAssetAccess(request, publicId);
    if (!access.ok) return access.res;

    // Verify credentials are configured
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary API credentials not configured' }, { status: 500 });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete error:', safeErrorMessage(error));
    return NextResponse.json(
      {
        error: 'Failed to delete image',
      },
      { status: 500 }
    );
  }
}
