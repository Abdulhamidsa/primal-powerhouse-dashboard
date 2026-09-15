import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { shouldUsePrivateChatMediaDelivery, validateChatMediaFile } from '@/lib/cloudinary';
import { rateLimit } from '@/lib/security/rate-limit';
import { canAccessConversation, getRequestIpAddress, resolveActor } from '@/lib/chat/conversation';

export const runtime = 'nodejs';

type UploadedFileLike = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  type: string;
  size: number;
  name?: string;
};

function isUploadedFileLike(value: unknown): value is UploadedFileLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as { arrayBuffer?: unknown }).arrayBuffer === 'function' &&
      typeof (value as { type?: unknown }).type === 'string' &&
      typeof (value as { size?: unknown }).size === 'number'
  );
}

function getUploadedFileName(file: UploadedFileLike): string {
  return typeof file.name === 'string' && file.name.trim() ? file.name : `upload-${Date.now()}`;
}

function toResourceType(kind: 'image' | 'video' | 'audio'): 'image' | 'video' {
  if (kind === 'image') return 'image';
  return 'video';
}

async function uploadBuffer(
  fileBuffer: Buffer,
  options: {
    folder: string;
    resourceType: 'image' | 'video';
    originalFilename: string;
  }
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary server credentials are not configured');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        type: shouldUsePrivateChatMediaDelivery() ? 'authenticated' : 'upload',
        filename_override: options.originalFilename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { conversationId } = await params;
  const conversation = await (prisma as any).conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, clientId: true, coachId: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!canAccessConversation(actor, conversation)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rateLimitKey = `chat:upload:${actor.userId}:${conversationId}:${getRequestIpAddress(request)}`;
  const limited = rateLimit(rateLimitKey, 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please slow down.' }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!isUploadedFileLike(file)) {
    return NextResponse.json({ error: 'No media file was provided.' }, { status: 400 });
  }

  const validation = validateChatMediaFile(file);
  if (!validation.valid || !validation.type) {
    return NextResponse.json({ error: validation.error ?? 'Invalid file.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const originalFilename = getUploadedFileName(file);

  const uploadResult = await uploadBuffer(fileBuffer, {
    folder: `conversations/${conversationId}`,
    resourceType: toResourceType(validation.type),
    originalFilename,
  });

  const attachment = {
    type: validation.type,
    publicId: uploadResult.public_id as string,
    resourceType: uploadResult.resource_type as 'image' | 'video',
    mimeType: file.type,
    bytes: Math.max(1, Number(uploadResult.bytes ?? file.size ?? 0)),
    width: Number(uploadResult.width ?? 0) > 0 ? Number(uploadResult.width) : null,
    height: Number(uploadResult.height ?? 0) > 0 ? Number(uploadResult.height) : null,
    durationSec: Number(uploadResult.duration ?? 0) > 0 ? Number(uploadResult.duration) : null,
  };

  return NextResponse.json({ attachment });
}
