import { TenantBrandingConfig } from '../types';

/** Single demonstration school branding (matches seeded Royal Gateway Academy). */
export const DEFAULT_TENANT_BRANDINGS: Record<string, TenantBrandingConfig> = {
  royalgateway: {
    tenantId: 'royalgateway',
    school_name: 'Royal Gateway Academy',
    school_code: 'RGA',
    school_logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=240&auto=format&fit=crop&q=80',
    logo_badge_text: 'RGA',
    welcome_tagline: 'Excellence, Integrity & Leadership',
    primary_color: '#4F46E5', // Indigo
    secondary_color: '#059669', // Emerald
    accent_color: '#D97706',
    background_style: 'subtle_glow',
    welcome_animation: 'soft_zoom',
    animation_duration: 2.4,
    show_skuggle_branding: true,
    audio_enabled: true,
    motto: 'Excellence, Integrity & Leadership',
    crestIcon: 'crown-torch'
  },
};

export const INITIAL_ACTIVE_TENANT_KEY = 'royalgateway';
