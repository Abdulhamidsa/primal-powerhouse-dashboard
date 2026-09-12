import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { workoutTemplateService } from '@/features/training/services';
import { createWorkoutTemplateSchema } from '@/features/training/schemas/template.schemas';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const templates = await workoutTemplateService.getCoachTemplates(auth.user.userId);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = createWorkoutTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const template = await workoutTemplateService.createTemplate(auth.user.userId, parsed.data);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
