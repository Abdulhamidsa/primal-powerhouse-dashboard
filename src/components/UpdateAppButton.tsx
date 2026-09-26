'use client';

import { useMemo, useState } from 'react';
import { CheckCircleIcon as CheckCircle2, DownloadIcon as Download, CircleNotchIcon as Loader2, ArrowsClockwiseIcon as RefreshCw, ArrowsClockwiseIcon as Sparkles } from '@phosphor-icons/react';
import { useAppUpdate } from '@/components/AppUpdateManager';

type UpdateState = 'idle' | 'updating' | 'success';

export default function UpdateAppButton() {
  const { hasUpdate, versionInfo, installedVersion, updateNow } = useAppUpdate();
  const [open, setOpen] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [error, setError] = useState('');

  const currentInstalledVersion = installedVersion || 'Unknown';
  const availableVersion = versionInfo?.version || currentInstalledVersion;

  const isUpdating = updateState === 'updating';
  const isSuccess = updateState === 'success';

  const buttonLabel = useMemo(() => {
    return hasUpdate ? 'Update app' : 'App version';
  }, [hasUpdate]);

  const handleUpdate = async () => {
    try {
      setError('');
      setUpdateState('updating');

      await new Promise(resolve => setTimeout(resolve, 700));

      setUpdateState('success');

      await new Promise(resolve => setTimeout(resolve, 1000));

      await updateNow();
    } catch (err) {
      console.error(err);
      setUpdateState('idle');
      setError('Update failed. Please try again.');
    }
  };

  const handleClose = () => {
    if (isUpdating) return;

    setOpen(false);
    setUpdateState('idle');
    setError('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 text-left hover:bg-muted/40 active:bg-muted/60"
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid h-9 w-9 place-items-center rounded-xl ${
              hasUpdate ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-foreground'
            }`}
          >
            {hasUpdate ? <Download className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{buttonLabel}</p>
              {hasUpdate ? <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
            </div>

            <p className="truncate text-xs text-muted-foreground">
              {hasUpdate
                ? `New version ${availableVersion} is available`
                : `Current version ${currentInstalledVersion}`}
            </p>
          </div>

          <div className="rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            v{currentInstalledVersion}
          </div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" onClick={handleClose}>
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-border bg-gradient-to-b from-accent/10 to-transparent px-5 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15">
                    {isSuccess ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isUpdating ? (
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    ) : hasUpdate ? (
                      <Sparkles className="h-6 w-6 text-accent" />
                    ) : (
                      <RefreshCw className="h-6 w-6 text-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      {isSuccess
                        ? 'App updated'
                        : isUpdating
                          ? 'Updating app'
                          : hasUpdate
                            ? versionInfo?.title || 'Update available'
                            : 'App is up to date'}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {isSuccess
                        ? `You now have version ${availableVersion}.`
                        : isUpdating
                          ? `Installing version ${availableVersion}...`
                          : hasUpdate
                            ? `Version ${availableVersion} is ready to install.`
                            : `You are currently on version ${currentInstalledVersion}.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Installed
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">v{currentInstalledVersion}</p>
                    </div>

                    <div className="h-px flex-1 bg-border" />

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Available
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">v{availableVersion}</p>
                    </div>
                  </div>
                </div>

                {hasUpdate && versionInfo?.notes?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What is new</p>

                    <div className="space-y-2">
                      {versionInfo.notes.map(note => (
                        <div key={note} className="rounded-2xl border border-border bg-muted/30 px-3 py-3">
                          <p className="text-sm text-foreground">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isUpdating ? (
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <p className="text-sm font-medium text-foreground">
                        Applying update and refreshing cached files...
                      </p>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-full animate-pulse rounded-full bg-accent" />
                    </div>
                  </div>
                ) : null}

                {isSuccess ? (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Update completed successfully</p>
                        <p className="text-xs text-muted-foreground">The app is now running the latest version.</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3 border-t border-border px-5 py-4">
                {hasUpdate && !isUpdating && !isSuccess ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                      }}
                      className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                    >
                      Later
                    </button>

                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-95"
                    >
                      Update now
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isUpdating}
                    className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
                  >
                    {isSuccess ? 'Done' : 'Close'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}