import React, { useEffect, useState } from 'react';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { useApp } from '../../context/AppContext';
import { getAccountModuleAccess } from '../../lib/moduleAccess';
import { SubscriptionPlanModal } from './SubscriptionPlanModal';

export const SubscriptionView: React.FC<{ title?: string }> = ({ title = 'Subscription' }) => {
  const { showToast, currentWorkspace, currentRole } = useApp();
  const access = getAccountModuleAccess(currentWorkspace, currentRole);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest<{ success: true; data: Record<string, unknown> | null }>('/subscription', { suppressErrorNotification: true }),
      apiRequest<{ success: true; data: Array<Record<string, unknown>> }>('/plans', { suppressErrorNotification: true }),
    ])
      .then(([current, planList]) => {
        setSubscription(current.data);
        setPlans(planList.data);
      })
      .catch((error) => showToast(title, describeApiError(error), 'error'));
  }, [title, showToast]);

  const plan = (subscription?.plan as { name?: string; code?: string; features?: string[] } | undefined) || undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-2">
        <p className="text-sm"><span className="font-semibold">Status:</span> {String(subscription?.status || 'none')}</p>
        <p className="text-sm"><span className="font-semibold">Plan:</span> {plan?.name || 'No active plan'}</p>
        <p className="text-sm"><span className="font-semibold">Period ends:</span> {String(subscription?.currentPeriodEndsAt || '—')}</p>
        {access.subscriptionAndPricing && (
          <button type="button" onClick={() => setOpen(true)} className="mt-3 px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold">
            Review plans & upgrade
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plans.map((item) => (
          <div key={String(item.id || item.code)} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="font-display font-bold text-sm">{String(item.name)}</p>
            <p className="text-xs text-slate-500 mt-1">{String(item.billingInterval || '')} · {String(item.currency || 'NGN')}</p>
          </div>
        ))}
      </div>
      {access.subscriptionAndPricing && access.subscriptionPhase && (
        <SubscriptionPlanModal isOpen={open} onClose={() => setOpen(false)} phase={access.subscriptionPhase} />
      )}
    </div>
  );
};
