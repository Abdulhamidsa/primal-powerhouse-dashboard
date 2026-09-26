'use client';

import { useState } from 'react';
import { WarningCircleIcon as AlertCircle, CheckIcon as Check, CopyIcon as Copy, EyeIcon as Eye, EyeSlashIcon as EyeOff } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CredentialDisplayMode, ClientCredentials } from '@/features/client-credentials/types/clientCredentials.types';

type Props = {
  open: boolean;
  mode: CredentialDisplayMode;
  credentials: ClientCredentials;
  onCloseAction: () => void;
};

export function ClientCredentialsModal({ open, mode, credentials, onCloseAction }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const title = mode === 'reset' ? 'Password Reset Complete' : 'Client Credentials';
  const description =
    mode === 'reset'
      ? 'This new password is only shown once. Copy it now and store it securely.'
      : 'Stored credentials are shown securely. Reveal only when needed.';

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-accent-muted)' }}>
              <AlertCircle aria-hidden="true" focusable="false" style={{ color: 'var(--color-accent)', width: 20, height: 20 }} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {title}
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                {description}
              </DialogDescription>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border mb-6"
            style={{
              background: 'var(--color-bg-alt)',
              borderColor: 'var(--color-border)',
            }}
          >
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 flex items-start gap-2">
              <AlertCircle aria-hidden="true" focusable="false" className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {mode === 'reset'
                  ? 'Save this password securely. It will not be shown again after you close this dialog.'
                  : 'Share securely. Do not send via unencrypted channels.'}
              </span>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={credentials.email}
                  readOnly
                  className="flex-1 px-3 py-2 rounded text-sm"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                    border: '1px solid',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(credentials.email, 'email')}
                  className="p-2 rounded transition-colors"
                  style={{
                    background: copiedField === 'email' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                    color: copiedField === 'email' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}
                  title="Copy email"
                >
                  {copiedField === 'email' ? <Check aria-hidden="true" focusable="false" className="w-4 h-4" /> : <Copy aria-hidden="true" focusable="false" className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password ?? ''}
                  readOnly
                  className="flex-1 px-3 py-2 rounded text-sm font-mono"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                    border: '1px solid',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="p-2 rounded transition-colors"
                  style={{
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-text-muted)',
                  }}
                  title={showPassword ? 'Hide password' : 'Reveal password'}
                >
                  {showPassword ? <EyeOff aria-hidden="true" focusable="false" className="w-4 h-4" /> : <Eye aria-hidden="true" focusable="false" className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(credentials.password ?? '', 'password')}
                  className="p-2 rounded transition-colors"
                  style={{
                    background: copiedField === 'password' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                    color: copiedField === 'password' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}
                  title="Copy password"
                >
                  {copiedField === 'password' ? <Check aria-hidden="true" focusable="false" className="w-4 h-4" /> : <Copy aria-hidden="true" focusable="false" className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-2 rounded-lg font-medium"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
