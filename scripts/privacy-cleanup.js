const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const prisma = new PrismaClient();
const AUDIT_RETENTION_DAYS = Number(process.env.PRIVACY_AUDIT_RETENTION_DAYS ?? 365);
const COMMON_ASSET_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp|bmp|heic|mov|mp3|mp4|m4a|wav|webm)$/i;

function safeErrorName(error) {
  return error instanceof Error ? error.name : 'UnknownError';
}

function parseJson(value) {
  if (typeof value !== 'string' || !value.trim()) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseCloudinaryReference(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/(^|\.)res\.cloudinary\.com$/i.test(url.hostname)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 1 || uploadIndex >= segments.length - 1) return null;
  const resourceType = segments[uploadIndex - 1] === 'video' ? 'video' : segments[uploadIndex - 1] === 'raw' ? 'raw' : 'image';
  let publicIdSegments = segments.slice(uploadIndex + 1);
  const versionIndex = publicIdSegments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex >= 0) publicIdSegments = publicIdSegments.slice(versionIndex + 1);
  else if (publicIdSegments.length > 1) publicIdSegments = publicIdSegments.slice(-1);
  const publicId = decodeURIComponent(publicIdSegments.join('/')).replace(COMMON_ASSET_EXTENSIONS, '');
  return publicId ? { publicId, resourceType } : null;
}

function addEntry(entries, unresolved, input) {
  const parsed = input.publicId
    ? { publicId: String(input.publicId), resourceType: input.resourceType === 'video' || input.resourceType === 'raw' ? input.resourceType : 'image' }
    : parseCloudinaryReference(input.value);
  if (!parsed) {
    if (typeof input.value === 'string' && /cloudinary/i.test(input.value)) unresolved.add(input.sourceReference);
    return;
  }
  const key = `${parsed.resourceType}:${parsed.publicId}`;
  if (!entries.some((entry) => `${entry.resourceType}:${entry.publicId}` === key)) {
    entries.push({
      sourceModel: input.sourceModel,
      sourceId: input.sourceId,
      publicId: parsed.publicId,
      resourceType: parsed.resourceType,
      assetType: input.assetType,
      normalizedSourceReference: input.sourceReference,
    });
  }
}

async function collectLegacyMediaManifest(clientId, db) {
  const [client, weeklyCheckIns, messages, meals, sideItems] = await Promise.all([
    db.client.findUnique({ where: { id: clientId }, select: { id: true, avatar: true, progressPhotos: true } }),
    db.weeklyCheckIn.findMany({ where: { clientId }, select: { id: true, progressPhotoFrontUrl: true, progressPhotoSideUrl: true, progressPhotoBackUrl: true } }),
    db.message.findMany({ where: { conversation: { clientId } }, select: { id: true, attachmentsJson: true } }),
    db.meal.findMany({ where: { clientId }, select: { id: true, imageUrl: true } }),
    db.sideItem.findMany({ where: { clientId }, select: { id: true, imageUrl: true } }),
  ]);
  const entries = [];
  const unresolved = new Set();
  if (!client) return { version: 1, collectedAt: new Date().toISOString(), entries, unresolved: [] };

  addEntry(entries, unresolved, { sourceModel: 'Client', sourceId: client.id, value: client.avatar, assetType: 'client-avatar', sourceReference: 'Client.avatar' });
  const progressPhotos = parseJson(client.progressPhotos);
  (Array.isArray(progressPhotos) ? progressPhotos : [progressPhotos]).forEach((value, index) => {
    addEntry(entries, unresolved, { sourceModel: 'Client', sourceId: client.id, value, assetType: 'progress-photo', sourceReference: `Client.progressPhotos[${index}]` });
  });
  weeklyCheckIns.forEach((checkIn) => {
    [['progressPhotoFrontUrl', checkIn.progressPhotoFrontUrl], ['progressPhotoSideUrl', checkIn.progressPhotoSideUrl], ['progressPhotoBackUrl', checkIn.progressPhotoBackUrl]].forEach(([field, value]) => {
      addEntry(entries, unresolved, { sourceModel: 'WeeklyCheckIn', sourceId: checkIn.id, value, assetType: 'weekly-check-in-photo', sourceReference: `WeeklyCheckIn.${checkIn.id}.${field}` });
    });
  });
  messages.forEach((message) => {
    const attachments = parseJson(message.attachmentsJson);
    if (!Array.isArray(attachments)) return;
    attachments.forEach((attachment, index) => {
      const item = attachment && typeof attachment === 'object' ? attachment : {};
      const value = typeof item.url === 'string' ? item.url : typeof item.secureUrl === 'string' ? item.secureUrl : '';
      addEntry(entries, unresolved, {
        sourceModel: 'Message', sourceId: message.id, value, publicId: item.publicId, resourceType: item.resourceType,
        assetType: 'conversation-attachment', sourceReference: value || `message:${message.id}:attachment:${index}`,
      });
    });
  });
  meals.forEach((meal) => addEntry(entries, unresolved, { sourceModel: 'Meal', sourceId: meal.id, value: meal.imageUrl, assetType: 'personalized-meal-image', sourceReference: `Meal.${meal.id}.imageUrl` }));
  sideItems.forEach((item) => addEntry(entries, unresolved, { sourceModel: 'SideItem', sourceId: item.id, value: item.imageUrl, assetType: 'personalized-side-item-image', sourceReference: `SideItem.${item.id}.imageUrl` }));

  return { version: 1, collectedAt: new Date().toISOString(), entries, unresolved: [...unresolved] };
}

function readManifest(metadata) {
  const parsed = parseJson(metadata);
  return parsed && parsed.mediaManifest && parsed.mediaManifest.version === 1 ? parsed.mediaManifest : null;
}

async function purgeExpiredExports(now, db = prisma) {
  const result = await db.privacyExportJob.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { status: 'EXPIRED' }] } });
  return result.count;
}

async function purgeExpiredAndUsedTokens(now, db = prisma) {
  const [verification, reset, sessions] = await Promise.all([
    db.emailVerificationToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
    db.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
    db.mobileSession.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] } }),
  ]);
  return verification.count + reset.count + sessions.count;
}

function configureCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary credentials unavailable');
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

async function deleteManifestEntry(entry) {
  const resourceType = entry.resourceType === 'raw' ? 'raw' : entry.resourceType === 'video' ? 'video' : 'image';
  const result = await cloudinary.uploader.destroy(entry.publicId, { resource_type: resourceType, invalidate: true });
  const normalized = String(result?.result ?? '').toLowerCase();
  if (!['ok', 'not found', 'not_found'].includes(normalized)) throw new Error('Cloudinary cleanup failed');
}

async function cleanupMediaManifest(manifest) {
  if (!manifest.entries.length) return;
  configureCloudinary();
  for (const entry of manifest.entries) await deleteManifestEntry(entry);
}

async function finalizeHardDeletes(now, db = prisma) {
  const requests = await db.deletionRequest.findMany({
    where: { status: { in: ['REQUESTED', 'ANONYMIZED'] }, scheduledHardDeleteAt: { lte: now } },
    select: { id: true, clientId: true, metadata: true },
  });
  let finalized = 0;
  for (const request of requests) {
    try {
      let manifest = readManifest(request.metadata);
      if (!manifest) {
        manifest = await collectLegacyMediaManifest(request.clientId, db);
        await db.deletionRequest.update({
          where: { id: request.id },
          data: { metadata: JSON.stringify({
            mediaManifest: manifest,
            legacyManifestDerivedAt: now.toISOString(),
            legacyVendorMediaResolution: manifest.entries.length ? 'derived' : 'no-deterministic-reference',
          }) },
        });
      }

      await cleanupMediaManifest(manifest);

      await db.$transaction(async (tx) => {
        const messages = await tx.message.findMany({ where: { conversation: { clientId: request.clientId } }, select: { id: true } });
        const messageIds = messages.map((message) => message.id);
        if (messageIds.length) await tx.mobilePushDelivery.deleteMany({ where: { messageId: { in: messageIds } } });
        await tx.mealPlanRecalculationAudit.deleteMany({ where: { clientId: request.clientId } });
        await tx.auditLog.create({
          data: {
            actorRole: 'system',
            targetUserId: request.clientId,
            action: 'privacy.deletion.finalized',
            metadata: JSON.stringify({
              deletionRequestId: request.id,
              unresolvedMediaReferences: manifest.unresolved?.length ?? 0,
              legacyVendorMediaResolution: manifest.unresolved?.length ? 'unresolved' : 'complete',
            }),
          },
        });
        // Client is intentionally deleted last; DeletionRequest is removed by
        // its cascade, so it must never be updated after this operation.
        await tx.client.delete({ where: { id: request.clientId } });
      });
      finalized += 1;
    } catch (error) {
      console.error('[privacy-cleanup] Deferred deletion', { requestId: request.id, error: safeErrorName(error) });
    }
  }
  return finalized;
}

async function pruneOldAuditLogs(now, db = prisma) {
  const threshold = new Date(now.getTime() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await db.auditLog.deleteMany({ where: { createdAt: { lt: threshold } } });
  return result.count;
}

async function main() {
  const now = new Date();
  const [expiredExportsDeleted, expiredTokensDeleted, hardDeletesFinalized, prunedAuditLogs] = await Promise.all([
    purgeExpiredExports(now),
    purgeExpiredAndUsedTokens(now),
    finalizeHardDeletes(now),
    pruneOldAuditLogs(now),
  ]);
  console.log('[privacy-cleanup] Completed', { expiredExportsDeleted, expiredTokensDeleted, hardDeletesFinalized, prunedAuditLogs, at: now.toISOString() });
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('[privacy-cleanup] Failed', { error: safeErrorName(error) });
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { collectLegacyMediaManifest, cleanupMediaManifest, finalizeHardDeletes, purgeExpiredAndUsedTokens };
