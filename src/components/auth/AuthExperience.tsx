import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { UserRole, TenantBrandingConfig, AuthStage } from '../../types';
import { WelcomeStage } from './WelcomeStage';
import { LoginStage } from './LoginStage';
import { DEFAULT_TENANT_BRANDINGS, INITIAL_ACTIVE_TENANT_KEY } from '../../data/tenantBranding';

interface AuthExperienceProps {
  onAuthenticated: (
    role: UserRole,
    tenantConfig: TenantBrandingConfig,
    user?: import('../../app/types').AuthenticatedUser,
  ) => void;
  onBackToLanding?: () => void;
  activeTenantKey?: string;
  initialStage?: AuthStage;
}

export const AuthExperience: React.FC<AuthExperienceProps> = ({
  onAuthenticated,
  onBackToLanding,
  activeTenantKey = INITIAL_ACTIVE_TENANT_KEY,
  initialStage = 'welcome',
}) => {
  const [currentTenantKey, setCurrentTenantKey] = useState<string>(activeTenantKey);
  const [stage, setStage] = useState<AuthStage>(initialStage);

  const branding = DEFAULT_TENANT_BRANDINGS[currentTenantKey] || DEFAULT_TENANT_BRANDINGS.royalgateway;

  const handleWelcomeComplete = () => {
    setStage('login');
  };

  const handleReplayWelcome = () => {
    setStage('welcome');
  };

  const handleSelectTenant = (newTenantKey: string) => {
    setCurrentTenantKey(newTenantKey);
    setStage('welcome'); // Replay welcome for the newly selected school
  };

  const handleLoginSuccess = (
    role: UserRole,
    user?: import('../../app/types').AuthenticatedUser,
  ) => {
    onAuthenticated(role, branding, user);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {onBackToLanding && (
        <button
          type="button"
          id="btn-auth-back-landing"
          onClick={onBackToLanding}
          className="absolute left-4 top-4 z-20 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Back to landing
        </button>
      )}
      <AnimatePresence mode="wait">
        {stage === 'welcome' ? (
          <WelcomeStage
            key={`welcome-${currentTenantKey}`}
            branding={branding}
            onComplete={handleWelcomeComplete}
            onSkip={() => setStage('login')}
          />
        ) : (
          <LoginStage
            key={`login-${currentTenantKey}`}
            branding={branding}
            onAuthenticate={handleLoginSuccess}
            onReplayWelcome={handleReplayWelcome}
            onSelectTenant={handleSelectTenant}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
