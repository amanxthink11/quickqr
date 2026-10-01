'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/session';
import {
  createWidget,
  updateWidget,
  pauseWidget,
  resumeWidget,
  deleteWidget,
} from './service';
import { ActionResponse } from '@/lib/auth/actions';
import { WidgetConfig } from './types';
import { Widget } from '@prisma/client';

/**
 * Server Action: Creates a new remote website widget in the active organization.
 */
export async function createWidgetAction(input: {
  name: string;
  config: Partial<WidgetConfig>;
}): Promise<ActionResponse<{ widgetId: string; publicId: string }>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const widget = await createWidget(ctx.user.id, orgId, {
      name: input.name,
      config: input.config,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/widgets');

    return {
      success: true,
      data: {
        widgetId: widget.id,
        publicId: widget.publicId,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create widget';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates widget name or configuration.
 * Public ID and embed snippet remain completely stable.
 */
export async function updateWidgetAction(input: {
  widgetId: string;
  name?: string;
  config?: Partial<WidgetConfig>;
}): Promise<ActionResponse<Widget>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const widget = await updateWidget(ctx.user.id, orgId, input.widgetId, {
      name: input.name,
      config: input.config,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/widgets');
    revalidatePath(`/dashboard/widgets/${input.widgetId}`);

    return { success: true, data: widget };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update widget';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Pauses a widget remotely.
 */
export async function pauseWidgetAction(widgetId: string): Promise<ActionResponse<Widget>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const widget = await pauseWidget(ctx.user.id, orgId, widgetId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/widgets');
    revalidatePath(`/dashboard/widgets/${widgetId}`);

    return { success: true, data: widget };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to pause widget';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Resumes a paused widget.
 */
export async function resumeWidgetAction(widgetId: string): Promise<ActionResponse<Widget>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const widget = await resumeWidget(ctx.user.id, orgId, widgetId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/widgets');
    revalidatePath(`/dashboard/widgets/${widgetId}`);

    return { success: true, data: widget };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resume widget';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Soft deletes an existing widget.
 */
export async function deleteWidgetAction(widgetId: string): Promise<ActionResponse<boolean>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const success = await deleteWidget(ctx.user.id, orgId, widgetId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/widgets');

    return { success: true, data: success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete widget';
    return { success: false, error: message };
  }
}
