import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const { notes } = body;

    if (!Array.isArray(notes)) {
      return jsonWithCache({ error: 'Notes must be an array' }, { status: 400 });
    }

    // Get the latest health metric record for this client
    const latestMetric = await prisma.healthMetric.findFirst({
      where: { clientId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestMetric) {
      return jsonWithCache({ error: 'No health metrics found for this client' }, { status: 404 });
    }

    // Update the notes
    const updated = await prisma.healthMetric.update({
      where: { id: latestMetric.id },
      data: {
        notes: notes.join('\n'),
      },
    });

    return jsonWithCache({
      success: true,
      notes: updated.notes?.split('\n') || [],
    });
  } catch (error) {
    console.error('Error saving notes:', error);
    return jsonWithCache(
      {
        error: 'Failed to save notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
