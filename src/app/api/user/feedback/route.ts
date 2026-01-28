import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return jsonWithCache({ error: 'Feedback message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return jsonWithCache({ error: 'Feedback message must be less than 1000 characters' }, { status: 400 });
    }

    // Ensure feedback table exists
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "feedback" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "message" TEXT NOT NULL,
          "clientId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "feedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `;
    } catch (tableError) {
      // Table might already exist, continue
      console.log('[FEEDBACK API] Feedback table check/create error (might already exist):', tableError);
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        clientId: user.userId,
      },
    });

    console.log('[FEEDBACK API] Feedback submitted:', {
      feedbackId: feedback.id,
      clientId: feedback.clientId,
    });

    return jsonWithCache({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('[FEEDBACK API] Error submitting feedback:', error);
    return jsonWithCache({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
