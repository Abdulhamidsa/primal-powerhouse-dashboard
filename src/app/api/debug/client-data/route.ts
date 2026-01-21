import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the client ID from query
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        motivationalMessage: true,
      },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: String(error),
        type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}
