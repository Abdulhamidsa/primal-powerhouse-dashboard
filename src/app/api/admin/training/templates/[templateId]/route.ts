import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { workoutTemplateService } from '@/features/training/services';
import { updateWorkoutTemplateSchema } from '@/features/training/schemas/template.schemas';

type RouteContext = { params: Promise<{ templateId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { templateId } = await params;
  const template = await workoutTemplateService.getTemplate(templateId, auth.user.userId);
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(template);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { templateId } = await params;
  const body = await request.json();
  const parsed = updateWorkoutTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const template = await workoutTemplateService.updateTemplate(templateId, auth.user.userId, parsed.data);
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update template';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { templateId } = await params;

  try {
    await workoutTemplateService.deleteTemplate(templateId, auth.user.userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete template';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
