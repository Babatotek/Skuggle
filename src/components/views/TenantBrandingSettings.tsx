import React, { useState } from 'react';
import {
  Palette,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Image,
  Sliders,
  Eye,
  Building,
  Save,
  Layers,
  Sparkle
} from 'lucide-react';
import { TenantBrandingConfig, WelcomeBackgroundStyle, WelcomeAnimationType } from '../../types';
import { DEFAULT_TENANT_BRANDINGS } from '../../data/tenantBranding';
import { SchoolLogoCrest } from '../auth/SchoolLogoCrest';
import { WelcomeStage } from '../auth/WelcomeStage';
import { feedbackBus } from '../../shared/feedback/feedbackBus';

interface TenantBrandingSettingsProps {
  currentConfig?: TenantBrandingConfig;
  onSaveConfig?: (config: TenantBrandingConfig) => void;
  onPreviewWelcome?: () => void;
}

export const TenantBrandingSettings: React.FC<TenantBrandingSettingsProps> = ({
  currentConfig = DEFAULT_TENANT_BRANDINGS.royalgateway,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<TenantBrandingConfig>({ ...currentConfig });
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  // Preset color palettes commonly used by world-class institutions
  const BRAND_COLOR_PRESETS = [
    { name: 'Institutional Blue', primary: '#155EEF', secondary: '#7F56D9' },
    { name: 'Royal Indigo', primary: '#4F46E5', secondary: '#059669' },
    { name: 'Oxford Navy & Gold', primary: '#0F172A', secondary: '#D97706' },
    { name: 'Cambridge Teal', primary: '#0D9488', secondary: '#2563EB' },
    { name: 'STEM Violet', primary: '#7C3AED', secondary: '#06B6D4' },
    { name: 'Crimson Heritage', primary: '#B91C1C', secondary: '#1E293B' },
  ];

  const handleSave = () => {
    if (onSaveConfig) {
      onSaveConfig(config);
    }
    feedbackBus.success('Branding settings saved successfully');
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Palette className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              School Branding & Welcome Experience
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure how students, teachers, and parents experience your school&apos;s branded entrance and sign-in flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-preview-welcome-flow"
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Test Welcome Entrance</span>
          </button>

          <button
            id="btn-save-branding-config"
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
{/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: School Identity */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
              1. Institutional Identity
            </h3>

            {/* School Name (comes from tenant record) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                School Name <span className="text-slate-400 font-normal">(Inherited from tenant record)</span>
              </label>
              <input
                type="text"
                value={config.school_name}
                onChange={(e) => setConfig({ ...config, school_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* School Motto / Tagline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                School Motto / Tagline <span className="text-slate-400 font-normal">(Optional entrance subtitle)</span>
              </label>
              <input
                type="text"
                value={config.welcome_tagline || ''}
                onChange={(e) => setConfig({ ...config, welcome_tagline: e.target.value, motto: e.target.value })}
                placeholder="e.g. Learning. Growing. Leading."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Monogram Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Monogram Acronym / Badge Text
              </label>
              <input
                type="text"
                value={config.logo_badge_text || ''}
                onChange={(e) => setConfig({ ...config, logo_badge_text: e.target.value })}
                placeholder="e.g. GFA"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Colors & Palette */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
              2. Brand Colors
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BRAND_COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setConfig({ ...config, primary_color: p.primary, secondary_color: p.secondary })}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white text-left transition-all flex items-center gap-2.5"
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      <span className="w-5 h-5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: p.primary }} />
                      <span className="w-5 h-5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: p.secondary }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Animation & Background Style */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
              3. Welcome Sequence Dynamics
            </h3>

            {/* Background Style */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Welcome Background Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'subtle_glow', title: 'Subtle Glow', desc: 'Center radial glow' },
                  { id: 'gradient', title: 'Soft Gradient', desc: 'Subtle vertical shade' },
                  { id: 'solid', title: 'Solid Clean', desc: 'Minimal off-white' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setConfig({ ...config, background_style: bg.id as WelcomeBackgroundStyle })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      config.background_style === bg.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{bg.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{bg.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Style */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Entrance Animation Curve
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'soft_zoom', label: 'Soft Zoom' },
                  { id: 'fade', label: 'Classic Fade' },
                  { id: 'float', label: 'Float In' },
                  { id: 'minimal', label: 'Minimal' },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => setConfig({ ...config, welcome_animation: anim.id as WelcomeAnimationType })}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      config.welcome_animation === anim.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Animation Duration</span>
                <span className="font-mono font-bold text-indigo-600">{config.animation_duration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="1.8"
                max="3.2"
                step="0.1"
                value={config.animation_duration}
                onChange={(e) => setConfig({ ...config, animation_duration: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>1.8s (Fast)</span>
                <span>2.4s (Recommended)</span>
                <span>3.2s (Deliberate)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800">Show &ldquo;Powered by Skuggle&rdquo;</span>
                  <p className="text-[11px] text-slate-500">Displays platform accreditation at screen bottom</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.show_skuggle_branding}
                  onChange={(e) => setConfig({ ...config, show_skuggle_branding: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800">Harmonic Sound Chime</span>
                  <p className="text-[11px] text-slate-500">Plays synthesized institutional chord upon logo resolve</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.audio_enabled}
                  onChange={(e) => setConfig({ ...config, audio_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
              </label>
            </div>

          </div>

        </div>

        {/* Right Column: Static Preview & Composition Visualizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400">
              Entrance Composition
            </h3>

            {/* Mini Stage Preview Card */}
            <div
              className="relative rounded-2xl border border-slate-200/80 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[340px] overflow-hidden"
              style={{
                background:
                  config.background_style === 'subtle_glow'
                    ? `radial-gradient(circle at center, ${config.primary_color}18 0%, transparent 60%), #F8FAFC`
                    : config.background_style === 'gradient'
                    ? `linear-gradient(180deg, ${config.primary_color}0D 0%, #F8FAFC 100%)`
                    : '#F8FAFC',
              }}
            >
              {/* Logo */}
              <div className="relative">
                <SchoolLogoCrest branding={config} size="lg" />
              </div>

              {/* School Name */}
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {config.school_name || 'School Name'}
                </h4>
                {config.welcome_tagline && (
                  <p className="text-xs font-medium text-slate-600 mt-1">
                    {config.welcome_tagline}
                  </p>
                )}
              </div>

              {/* Powered by Skuggle */}
              {config.show_skuggle_branding && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-2">
                  <span>Powered by</span>
                  <span className="font-bold text-slate-600">Skuggle</span>
                </p>
              )}

              {/* Progress Indicator */}
              <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="w-1/2 h-full rounded-full" style={{ backgroundColor: config.primary_color }} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLivePreviewModal(true)}
              className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-700" />
              <span>Launch Fullscreen Preview Sequence</span>
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Live Preview Modal */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50">
          <WelcomeStage
            branding={config}
            onComplete={() => setShowLivePreviewModal(false)}
            onSkip={() => setShowLivePreviewModal(false)}
          />
        </div>
      )}

    </div>
  );
};
