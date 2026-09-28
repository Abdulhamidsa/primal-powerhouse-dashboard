import { prisma } from '@/lib/prisma';

export type MediaResourceType = 'image' | 'video' | 'raw';

export type MediaManifestEntry = {
  sourceModel: string;
  sourceId: string;
  publicId: string;
  resourceType: MediaResourceType;
  assetType: string;
  normalizedSourceReference: string;
};

export type ClientMediaManifest = {
  version: 1;
  collectedAt: string;
  entries: MediaManifestEntry[];
  unresolved: string[];
};

const CLOUDINARY_HOST = /(^|\.)res\.cloudinary\.com$/i;
const COMMON_ASSET_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp|bmp|heic|mov|mp3|mp4|m4a|wav|webm)$/i;

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeResourceType(value: unknown): MediaResourceType {
  return value === 'video' || value === 'audio' ? 'video' : value === 'raw' ? 'raw' : 'image';
}

export function parseCloudinaryReference(value: unknown): {
  publicId: string;
  resourceType: MediaResourceType;
} | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!CLOUDINARY_HOST.test(url.hostname)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 1 || uploadIndex >= segments.length - 1) return null;

  const resourceSegment = segments[uploadIndex - 1];
  const resourceType: MediaResourceType = resourceSegment === 'video' ? 'video' : resourceSegment === 'raw' ? 'raw' : 'image';
  let publicIdSegments = segments.slice(uploadIndex + 1);

  const versionIndex = publicIdSegments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex >= 0) {
    publicIdSegments = publicIdSegments.slice(versionIndex + 1);
  } else if (publicIdSegments.length > 1) {
    // Upload URLs without a version may contain transformation segments. The
    // application only stores upload-result URLs, so accept the final path as
    // the conservative fallback rather than guessing a public ID.
    publicIdSegments = publicIdSegments.slice(-1);
  }

  const publicId = decodeURIComponent(publicIdSegments.join('/')).replace(COMMON_ASSET_EXTENSIONS, '');
  return publicId ? { publicId, resourceType } : null;
}

function addEntry(
  entries: Map<string, MediaManifestEntry>,
  unresolved: Set<string>,
  input: {
    sourceModel: string;
    sourceId: string;
    value: unknown;
    assetType: string;
    sourceReference: string;
    publicId?: unknown;
    resourceType?: unknown;
  },
) {
  const parsed = input.publicId
    ? { publicId: String(input.publicId), resourceType: normalizeResourceType(input.resourceType) }
    : parseCloudinaryReference(input.value);

  if (!parsed) {
    if (typeof input.value === 'string' && input.value.trim()) {
      unresolved.add(input.sourceReference);
    }
    return;
  }

  const key = `${parsed.resourceType}:${parsed.publicId}`;
  if (entries.has(key)) return;
  entries.set(key, {
    sourceModel: input.sourceModel,
    sourceId: input.sourceId,
    publicId: parsed.publicId,
    resourceType: parsed.resourceType,
    assetType: input.assetType,
    normalizedSourceReference: input.sourceReference,
  });
}

function addAttachmentValue(
  entries: Map<string, MediaManifestEntry>,
  unresolved: Set<string>,
  sourceId: string,
  value: unknown,
  index: number,
) {
  const attachment = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const reference = typeof attachment.url === 'string'
    ? attachment.url
    : typeof attachment.secureUrl === 'string'
      ? attachment.secureUrl
      : `message:${sourceId}:attachment:${index}`;

  addEntry(entries, unresolved, {
    sourceModel: 'Message',
    sourceId,
    value: reference,
    publicId: attachment.publicId,
    resourceType: attachment.resourceType,
    assetType: 'conversation-attachment',
    sourceReference: reference,
  });
}

export async function collectClientMediaManifest(clientId: string, db: any = prisma): Promise<ClientMediaManifest> {
  const entries = new Map<string, MediaManifestEntry>();
  const unresolved = new Set<string>();

  const [client, weeklyCheckIns, messages, meals, sideItems] = await Promise.all([
    db.client.findUnique({
      where: { id: clientId },
      select: { id: true, avatar: true, progressPhotos: true },
    }),
    db.weeklyCheckIn.findMany({
      where: { clientId },
      select: { id: true, progressPhotoFrontUrl: true, progressPhotoSideUrl: true, progressPhotoBackUrl: true },
    }),
    db.message.findMany({
      where: { conversation: { clientId } },
      select: { id: true, attachmentsJson: true },
    }),
    db.meal.findMany({
      where: { clientId },
      select: { id: true, imageUrl: true },
    }),
    db.sideItem.findMany({
      where: { clientId },
      select: { id: true, imageUrl: true },
    }),
  ]);

  if (!client) throw new Error('Client not found');

  addEntry(entries, unresolved, {
    sourceModel: 'Client',
    sourceId: client.id,
    value: client.avatar,
    assetType: 'client-avatar',
    sourceReference: 'Client.avatar',
  });

  const progressPhotos = parseJson(client.progressPhotos);
  if (Array.isArray(progressPhotos)) {
    progressPhotos.forEach((photo, index) => addEntry(entries, unresolved, {
      sourceModel: 'Client',
      sourceId: client.id,
      value: photo,
      assetType: 'progress-photo',
      sourceReference: `Client.progressPhotos[${index}]`,
    }));
  } else {
    addEntry(entries, unresolved, {
      sourceModel: 'Client',
      sourceId: client.id,
      value: progressPhotos,
      assetType: 'progress-photo',
      sourceReference: 'Client.progressPhotos',
    });
  }

  for (const checkIn of weeklyCheckIns) {
    for (const [field, value] of [
      ['progressPhotoFrontUrl', checkIn.progressPhotoFrontUrl],
      ['progressPhotoSideUrl', checkIn.progressPhotoSideUrl],
      ['progressPhotoBackUrl', checkIn.progressPhotoBackUrl],
    ] as const) {
      addEntry(entries, unresolved, {
        sourceModel: 'WeeklyCheckIn',
        sourceId: checkIn.id,
        value,
        assetType: 'weekly-check-in-photo',
        sourceReference: `WeeklyCheckIn.${checkIn.id}.${field}`,
      });
    }
  }

  for (const message of messages) {
    const attachments = parseJson(message.attachmentsJson);
    if (!Array.isArray(attachments)) continue;
    attachments.forEach((attachment, index) => addAttachmentValue(entries, unresolved, message.id, attachment, index));
  }

  for (const meal of meals) {
    addEntry(entries, unresolved, {
      sourceModel: 'Meal',
      sourceId: meal.id,
      value: meal.imageUrl,
      assetType: 'personalized-meal-image',
      sourceReference: `Meal.${meal.id}.imageUrl`,
    });
  }

  for (const sideItem of sideItems) {
    addEntry(entries, unresolved, {
      sourceModel: 'SideItem',
      sourceId: sideItem.id,
      value: sideItem.imageUrl,
      assetType: 'personalized-side-item-image',
      sourceReference: `SideItem.${sideItem.id}.imageUrl`,
    });
  }

  return {
    version: 1,
    collectedAt: new Date().toISOString(),
    entries: [...entries.values()],
    unresolved: [...unresolved],
  };
}

export function readMediaManifest(metadata: string | null | undefined): ClientMediaManifest | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { mediaManifest?: ClientMediaManifest };
    return parsed.mediaManifest?.version === 1 ? parsed.mediaManifest : null;
  } catch {
    return null;
  }
}

export function withMediaManifest(metadata: string | null | undefined, mediaManifest: ClientMediaManifest): string {
  let existing: Record<string, unknown> = {};
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) existing = parsed;
    } catch {
      // Replace legacy/non-JSON metadata with the structured manifest record.
    }
  }
  return JSON.stringify({ ...existing, mediaManifest });
}
