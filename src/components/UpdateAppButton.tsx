'use client';

import { useState } from 'react';
import { useAppUpdate } from '@/components/AppUpdateManager';

export default function UpdateAppButton() {
  const { hasUpdate, versionInfo, updateNow, dismissUpdate } = useAppUpdate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white"
      >
        Update app
        {hasUpdate && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end bg-black/60 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-5 text-white shadow-2xl">
            <h2 className="text-lg font-semibold">
              {hasUpdate && versionInfo ? `${versionInfo.title}` : 'App is up to date'}
            </h2>

            {hasUpdate && versionInfo ? (
              <>
                <p className="mt-1 text-sm text-white/70">Version {versionInfo.version} is available.</p>

                <div className="mt-4 space-y-2">
                  {versionInfo.notes.map(note => (
                    <div key={note} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/85">
                      {note}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={dismissUpdate}
                    className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm"
                  >
                    Later
                  </button>

                  <button
                    type="button"
                    onClick={updateNow}
                    className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Update now
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-white/70">You already have the latest version.</p>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}