const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const crypto = require('crypto');
const { getPrivacyRetentionConfig, validatePrivacyRetentionConfig } = require('./privacy-retention-config.cjs');

const prisma = new PrismaClient();
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
    ? { publicId: String(input.publicId), resourceType: input.resourceType === 'video' || input.resourceType === 'audio' ? 'video' : input.resourceType === 'raw' ? 'raw' : 'image' }
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
  return parsed && parsed.mediaManifest && parsed.mediaManifest.version === 1 && Array.isArray(parsed.mediaManifest.entries) && Array.isArray(parsed.mediaManifest.unresolved)
    ? parsed.mediaManifest
    : null;
}

function isDryRun(options = {}) {
  return options.dryRun === true;
}

async function purgeExpiredExports(now, db = prisma, options = {}) {
  const where = { OR: [{ expiresAt: { lt: now } }, { status: 'EXPIRED' }] };
  if (isDryRun(options)) return await db.privacyExportJob.count({ where });
  const result = await db.privacyExportJob.deleteMany({ where });
  return result.count;
}

async function purgeExpiredAndUsedTokens(now, db = prisma, options = {}) {
  const verificationWhere = { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] };
  const resetWhere = { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] };
  const sessionsWhere = { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] };
  if (isDryRun(options)) {
    const [verification, reset, sessions] = await Promise.all([
      db.emailVerificationToken.count({ where: verificationWhere }),
      db.passwordResetToken.count({ where: resetWhere }),
      db.mobileSession.count({ where: sessionsWhere }),
    ]);
    return verification + reset + sessions;
  }
  const [verification, reset, sessions] = await Promise.all([
    db.emailVerificationToken.deleteMany({ where: verificationWhere }),
    db.passwordResetToken.deleteMany({ where: resetWhere }),
    db.mobileSession.deleteMany({ where: sessionsWhere }),
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

async function cleanupMediaManifest(manifest, options = {}) {
  if (!manifest.entries.length) return;
  if (isDryRun(options)) return;
  configureCloudinary();
  for (const entry of manifest.entries) await deleteManifestEntry(entry);
}

async function finalizeHardDeletes(now, db = prisma, options = {}) {
  const requests = await db.deletionRequest.findMany({
    where: { status: { in: ['REQUESTED', 'ANONYMIZED'] }, scheduledHardDeleteAt: { lte: now } },
    select: { id: true, clientId: true, metadata: true },
  });
  let finalized = 0;
  if (options.metrics) options.metrics.dueDeletionRequests = requests.length;
  for (const request of requests) {
    try {
      const client = await db.client.findUnique({ where: { id: request.clientId }, select: { id: true } });
      if (!client) {
        const finalizationAudit = await db.auditLog.findFirst({
          where: { action: 'privacy.deletion.finalized', targetUserId: request.clientId, metadata: { contains: request.id } },
          select: { id: true },
        });
        if (finalizationAudit) {
          finalized += 1;
          continue;
        }
        throw new Error('Client missing without finalization audit');
      }

      let manifest = readManifest(request.metadata);
      if (!manifest) {
        manifest = await collectLegacyMediaManifest(request.clientId, db);
        if (!isDryRun(options)) {
          await db.deletionRequest.update({
            where: { id: request.id },
            data: { metadata: JSON.stringify({
              mediaManifest: manifest,
              legacyManifestDerivedAt: now.toISOString(),
              legacyVendorMediaResolution: manifest.entries.length ? 'derived' : 'no-deterministic-reference',
            }) },
          });
        }
      }

      if (isDryRun(options)) {
        if (options.metrics && manifest.entries.length) options.metrics.mediaAssetsPending = (options.metrics.mediaAssetsPending ?? 0) + manifest.entries.length;
        if (options.metrics && manifest.unresolved?.length) options.metrics.deferredDeletions = (options.metrics.deferredDeletions ?? 0) + 1;
        continue;
      }

      await cleanupMediaManifest(manifest, options);

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
      if (options.metrics) {
        options.metrics.deferredDeletions = (options.metrics.deferredDeletions ?? 0) + 1;
        if (String(error?.message ?? '').includes('Cloudinary')) {
          options.metrics.mediaCleanupFailures = (options.metrics.mediaCleanupFailures ?? 0) + 1;
        }
      }
      console.error(JSON.stringify({ event: 'privacy.cleanup.deferred_deletion', requestId: request.id, error: safeErrorName(error) }));
    }
  }
  return finalized;
}

async function pruneOldAuditLogs(now, db = prisma, options = {}) {
  const { auditRetentionDays } = getPrivacyRetentionConfig();
  const threshold = new Date(now.getTime() - auditRetentionDays * 24 * 60 * 60 * 1000);
  if (isDryRun(options)) return await db.auditLog.count({ where: { createdAt: { lt: threshold } } });
  const result = await db.auditLog.deleteMany({ where: { createdAt: { lt: threshold } } });
  return result.count;
}

async function main(options = {}) {
  const dryRun = isDryRun(options) || process.env.PRIVACY_CLEANUP_DRY_RUN === 'true';
  const retention = validatePrivacyRetentionConfig();
  const now = new Date();
  const startedAt = Date.now();
  const metrics = { dryRun, dueDeletionRequests: 0, deferredDeletions: 0, mediaCleanupFailures: 0, mediaAssetsPending: 0 };
  const [expiredExportsDeleted, expiredTokensDeleted, hardDeletesFinalized, prunedAuditLogs] = await Promise.all([
    purgeExpiredExports(now, prisma, { dryRun }),
    purgeExpiredAndUsedTokens(now, prisma, { dryRun }),
    finalizeHardDeletes(now, prisma, { dryRun, metrics }),
    pruneOldAuditLogs(now, prisma, { dryRun }),
  ]);
  console.log(JSON.stringify({
    event: 'privacy.cleanup.completed',
    runId: crypto.randomUUID(),
    dryRun,
    retention,
    expiredExportsDeleted,
    expiredTokensDeleted,
    hardDeletesFinalized,
    prunedAuditLogs,
    ...metrics,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  }));
}

if (require.main === module) {
  main({ dryRun: process.argv.includes('--dry-run') })
    .catch((error) => {
      console.error(JSON.stringify({ event: 'privacy.cleanup.failed', error: safeErrorName(error), at: new Date().toISOString() }));
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { collectLegacyMediaManifest, cleanupMediaManifest, finalizeHardDeletes, purgeExpiredAndUsedTokens, purgeExpiredExports, pruneOldAuditLogs, main };
