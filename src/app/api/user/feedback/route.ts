import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Feedback message must be less than 1000 characters' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('[FEEDBACK API] Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
