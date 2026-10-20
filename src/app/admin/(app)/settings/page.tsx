'use client';

import type { AccentThemeId } from '@primal/theme';
import { AdminPage } from '@/features/admin-shell/components/AdminPage';
import { useAdminUserId } from '@/features/admin-shell/components/AdminShellLayout';
import { ThemePreferenceSection } from '@/features/theme-preference/components/ThemePreferenceSection';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';

const ADMIN_ACCENTS = new Set<AccentThemeId>(['ocean', 'forest', 'ruby', 'aura']);

export default function AdminSettingsPage() {
  const userId = useAdminUserId();
  const { mode, accentTheme, setMode, setAccentTheme, appearanceOptions } = useThemePreference({
    scope: 'admin',
    userId,
  });
  const accentOptions = appearanceOptions.accents.filter(option => ADMIN_ACCENTS.has(option.id));

  return (
    <AdminPage className="max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Keep the workspace comfortable to use.</p>
      </div>

      <ThemePreferenceSection
        mode={mode}
        accentTheme={accentTheme}
        options={accentOptions}
        onModeChangeAction={setMode}
        onAccentChangeAction={setAccentTheme}
        variant="admin"
      />
    </AdminPage>
  );
}
