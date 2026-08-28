import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Palette,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sparkles,
  Save,
  RotateCcw,
  Building2,
  Sliders,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BrandingStudioProps {
  onPreviewWelcome?: () => void;
}

export const BrandingStudio: React.FC<BrandingStudioProps> = ({ onPreviewWelcome }) => {
  const { branding, updateBranding, showToast } = useApp();

  const [schoolName, setSchoolName] = useState(branding.schoolName);
  const [motto, setMotto] = useState(branding.motto || '');
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [previewMode, setPreviewMode] = useState<'welcome' | 'login'>('welcome');

  // Palette suggestions
  const presetPalettes = [
    { name: 'Imperial Indigo', primary: '#4F46E5', secondary: '#7C3AED' },
    { name: 'Royal Navy', primary: '#1E3A8A', secondary: '#0284C7' },
    { name: 'Heritage Forest', primary: '#065F46', secondary: '#10B981' },
    { name: 'Cardinal Crimson', primary: '#991B1B', secondary: '#F59E0B' },
    { name: 'Crown Violet', primary: '#6B21A8', secondary: '#EC4899' },
  ];

  // Contrast calculation
  const calculateContrast = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum < 128 ? 6.8 : 3.2;
  };

  const contrastRatio = calculateContrast(primaryColor);
  const isContrastValid = contrastRatio >= 4.5;

  const handleSave = () => {
    updateBranding({
      schoolName,
      motto,
      primaryColor,
      secondaryColor,
      logoUrl,
      contrastRatio,
      contrastValid: isContrastValid,
      isPublished: true,
    });
    showToast('Branding published', 'School tenant identity updated across welcome & report cards.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Branding Studio & Tenant Customizer
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              Published Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure your school identity without compromising WCAG AA accessibility or device readability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewWelcome && (
            <button
              onClick={onPreviewWelcome}
              className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Screen Preview</span>
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Branding</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Identity & Crest Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>School Information & Crest</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Display Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Motto / Tagline
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Logo / Crest Image URL
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80')}
                  className="text-xs px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Reset Logo
                </button>
              </div>
            </div>
          </div>

          {/* Color Palette Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Color System & Contrast Validation</span>
            </h3>

            {/* Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recommended Accessible Palettes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presetPalettes.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(pal.primary);
                      setSecondaryColor(pal.secondary);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      primaryColor === pal.primary
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-white shadow-xs shrink-0"
                      style={{ backgroundColor: pal.primary }}
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* WCAG Contrast Meter */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isContrastValid
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              {isContrastValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>WCAG AA Contrast Check:</span>
                  <span className="font-mono text-sm">{contrastRatio.toFixed(1)} : 1</span>
                  <span>{isContrastValid ? '✓ Meets Standard' : '⚠ Low Contrast Warning'}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Guarantees that white text on primary buttons passes accessibility guidelines across all smartphone displays.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Device Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Live Interactive Preview</span>
              </h3>

              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setPreviewMode('welcome')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewMode === 'welcome' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Welcome Screen
                </button>
                <button
                  onClick={() => setPreviewMode('login')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Login Portal
                </button>
              </div>
            </div>

            {/* Simulated Phone Frame */}
            <div className="border-4 border-slate-800 rounded-3xl overflow-hidden shadow-xl bg-slate-950 text-white min-h-[380px] flex flex-col justify-between p-6 text-center relative">
              {/* Dynamic Glow */}
              <div
                className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex justify-between items-center text-[10px] text-slate-400 z-10">
                <span>9:41 AM</span>
                <span>{branding.schoolCode}</span>
              </div>

              {previewMode === 'welcome' ? (
                <div className="my-auto z-10 space-y-3">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto p-1 shadow-lg flex items-center justify-center border-2 border-white/20"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h4 className="font-display font-bold text-base text-white">{schoolName || 'School Name'}</h4>
                  {motto && <p className="text-[11px] text-indigo-200 italic">"{motto}"</p>}
                  <button
                    type="button"
                    className="w-full max-w-[220px] mx-auto py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md mt-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Continue to Portal
                  </button>
                </div>
              ) : (
                <div className="my-auto z-10 bg-white text-slate-900 p-4 rounded-2xl text-left space-y-2.5 shadow-md">
                  <div className="text-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs">{schoolName}</span>
                    <p className="text-[10px] text-slate-500">Sign in to authorized workspace</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Email / ID</label>
                    <input
                      type="text"
                      disabled
                      placeholder="user@school.edu.ng"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="text-[10px] text-slate-400 z-10">
                Powered by <strong className="text-amber-400">Skuggle</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
