import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';

interface Props { isOpen: boolean; onClose: () => void }
interface MfaStatus { success: true; data: { enabled: boolean; confirmed: boolean; policyEnabled: boolean; required: boolean } }

export const SecuritySettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [status, setStatus] = useState<MfaStatus['data'] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBusy(true);
    apiRequest<MfaStatus>('/auth/mfa', { suppressErrorNotification: true }).then((response) => setStatus(response.data)).catch((error) => showToast('Security settings unavailable', describeApiError(error), 'error')).finally(() => setBusy(false));
  }, [isOpen, showToast]);

  const updatePolicy = async (enabled: boolean) => {
    setBusy(true);
    try {
      await apiRequest('/auth/mfa/policy', { suppressErrorNotification: true, method: 'PUT', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ requireForPrivilegedRoles: enabled }) });
      setStatus((current) => current ? { ...current, policyEnabled: enabled, required: enabled } : current);
      showToast('MFA policy updated', enabled ? 'Privileged school roles must now use an authenticator.' : 'MFA is optional again; enrolled users remain protected.', 'success');
    } catch (error) {
      showToast('MFA policy update failed', describeApiError(error), 'failed');
    } finally { setBusy(false); }
  };

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="security-title">
    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-indigo-950 to-violet-700 text-white flex justify-between"><div className="flex gap-3"><ShieldCheck className="w-6 h-6" /><div><h2 id="security-title" className="font-bold">School security</h2><p className="text-xs text-indigo-200">Multi-factor authentication policy</p></div></div><button onClick={onClose} aria-label="Close security settings"><X /></button></div>
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 p-4 flex gap-4 justify-between">
          <div><p className="text-sm font-bold text-slate-900">Require MFA for privileged roles</p><p className="mt-1 text-xs leading-5 text-slate-600">When enabled, school administrators and other privileged roles must enroll an authenticator before making protected changes.</p>{status && <p className="mt-2 text-xs font-semibold text-indigo-700">Your authenticator: {status.confirmed ? 'configured' : 'not configured'}</p>}</div>
          <button type="button" disabled={busy || !status} aria-pressed={status?.policyEnabled ?? false} onClick={() => void updatePolicy(!(status?.policyEnabled ?? false))} className={`shrink-0 mt-1 w-12 h-7 rounded-full p-1 transition ${status?.policyEnabled ? 'bg-indigo-600' : 'bg-slate-300'} disabled:opacity-50`}><span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${status?.policyEnabled ? 'translate-x-5' : ''}`} /></button>
        </div>
        {!status?.confirmed && status?.policyEnabled && <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">Sign out and sign back in to complete authenticator enrollment before making further administrative changes.</p>}
      </div>
    </div>
  </div>;
};
