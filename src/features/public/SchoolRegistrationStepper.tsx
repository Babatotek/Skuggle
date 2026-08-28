import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Shield,
  Palette,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  Sparkles,
  Eye,
  AlertCircle,
  Lock,
  Globe,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from '../../components/BrandMark';
import confetti from 'canvas-confetti';
import { apiRequest, describeApiError, initializeCsrf } from '../../lib/apiClient';

interface SchoolRegistrationStepperProps {
  onCancel: () => void;
  onComplete: () => void;
  onPreviewWelcome: () => void;
}

export const SchoolRegistrationStepper: React.FC<SchoolRegistrationStepperProps> = ({
  onCancel,
  onComplete,
  onPreviewWelcome,
}) => {
  const { branding, updateBranding, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    schoolName: 'Bethel Grace International College',
    schoolCategory: 'Primary & Secondary',
    schoolCode: 'BGIC-IBADAN',
    state: 'Oyo State',
    city: 'Ibadan',
    address: '18 Ring Road, Challenge, Ibadan',
    officialEmail: 'info@bethelgrace.edu.ng',
    officialPhone: '+234 803 998 4433',
    motto: 'Knowledge, Integrity and Discipline',
    adminFullName: 'Rev. Emmanuel Adeleke',
    adminEmail: 'principal@bethelgrace.edu.ng',
    adminPhone: '+234 802 445 1199',
    adminPassword: 'Password@2026',
    primaryColor: '#4F46E5',
    secondaryColor: '#7C3AED',
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
    curriculumType: 'NERDC (Nigerian National Curriculum)',
  });

  const steps = [
    { num: 1, label: 'Institution Profile', icon: Building2 },
    { num: 2, label: 'Administrator Account', icon: Shield },
    { num: 3, label: 'School Brand Studio', icon: Palette },
    { num: 4, label: 'Review & Launch', icon: CheckCircle2 },
  ];

  // Contrast calculator helper
  const calculateContrast = (hex: string) => {
    // Simplified relative luminance
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum < 128 ? 6.2 : 3.1;
  };

  const contrastRatio = calculateContrast(formData.primaryColor);
  const isContrastValid = contrastRatio >= 4.5;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleCreateTenant = async () => {
    setIsSubmitting(true);
    try {
      await initializeCsrf();
      await apiRequest('/schools/register', {
        suppressErrorNotification: true,
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          schoolCode: formData.schoolCode,
          schoolEmail: formData.officialEmail,
          phone: formData.officialPhone,
          address: `${formData.address}, ${formData.city}, ${formData.state}`,
          schoolType: formData.schoolCategory,
          schoolLevel: formData.schoolCategory,
          primaryColor: formData.primaryColor,
          adminName: formData.adminFullName,
          adminEmail: formData.adminEmail,
          password: formData.adminPassword,
          password_confirmation: formData.adminPassword,
        }),
      });
      updateBranding({
        schoolName: formData.schoolName,
        schoolCode: formData.schoolCode,
        motto: formData.motto,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        email: formData.officialEmail,
        phone: formData.officialPhone,
        isPublished: true,
        contrastRatio,
        contrastValid: isContrastValid,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      showToast('Check your email', `${formData.schoolName} was registered. We sent ${formData.adminEmail} a secure verification link.`, 'success');
      onComplete();
    } catch (error) {
      showToast('Registration failed', describeApiError(error), 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF7] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <BrandMark size="md" showText={true} />
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            Cancel & Return
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-10">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {steps.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const Icon = step.icon;
              return (
                <div key={step.num} className="text-center">
                  <div
                    className={`h-2 rounded-full mb-2 transition-colors ${
                      isDone || isCurrent ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-semibold flex items-center justify-center gap-1 truncate ${
                      isCurrent ? 'text-indigo-900 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-3 h-3 hidden sm:inline" />
                    <span>{step.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <AnimatePresence mode="wait">
            {/* Step 1: Institution Profile */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Tell us about your Institution
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Basic school records used for official correspondence, report cards, and student records.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official School Name *
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="e.g. Crown Heights International Academy"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      School Category / Levels *
                    </label>
                    <select
                      value={formData.schoolCategory}
                      onChange={(e) => setFormData({ ...formData, schoolCategory: e.target.value })}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    >
                      <option value="Nursery & Primary">Nursery & Primary School</option>
                      <option value="Junior & Senior Secondary">Junior & Senior Secondary (JSS/SSS)</option>
                      <option value="Comprehensive (Nursery to SSS 3)">Comprehensive (Nursery, Primary & Secondary)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      School Code / Short ID *
                    </label>
                    <input
                      type="text"
                      value={formData.schoolCode}
                      onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. CHIA-LAGOS"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Lagos State"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City / Town *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Lekki"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Campus Physical Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                      placeholder="admin@school.edu.ng"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.officialPhone}
                      onChange={(e) => setFormData({ ...formData, officialPhone: e.target.value })}
                      placeholder="+234 803 000 0000"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Administrator Account */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    First Privileged Administrator Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    This verified account holds owner privileges to govern staff access, invite teachers, and approve academic records.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Security Rule:</strong> Privileged credentials require 2FA options upon first login. You can delegate secondary admin roles (Exam Officer, Bursar) later.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Administrator Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.adminFullName}
                      onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                      placeholder="e.g. Dr. / Mr. / Mrs. Full Name"
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Admin Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder="principal@school.edu.ng"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Admin Phone (for OTP recovery) *
                      </label>
                      <input
                        type="tel"
                        value={formData.adminPhone}
                        onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                        placeholder="+234 800 000 0000"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Master Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 pr-10"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Minimum 8 characters with at least 1 number and special symbol.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: School Brand Studio */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Branding Studio & Tenant Identity
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Personalize your school welcome screen and report card colors while guaranteeing accessible WCAG contrast.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        School Motto / Slogan
                      </label>
                      <input
                        type="text"
                        value={formData.motto}
                        onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                        placeholder="e.g. Knowledge, Character and Excellence"
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary School Brand Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-32 text-sm px-3 py-2 rounded-xl border border-slate-300 font-mono"
                        />
                        <div className="flex gap-1.5">
                          {['#4F46E5', '#1E3A8A', '#047857', '#991B1B', '#7C3AED'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setFormData({ ...formData, primaryColor: c })}
                              style={{ backgroundColor: c }}
                              className="w-6 h-6 rounded-full border border-white shadow-xs hover:scale-110 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* WCAG Contrast Check Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">WCAG AA Contrast Ratio</span>
                        <span className={`font-bold ${isContrastValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {contrastRatio.toFixed(1)} : 1 {isContrastValid ? '(Passes AA)' : '(Low Contrast)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ensures white text and buttons remain clearly readable on all phone screens.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        School Crest / Logo URL
                      </label>
                      <input
                        type="text"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="Image URL or default crest"
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Live Welcome Screen Preview Mockup */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Live Tenant Welcome Preview
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[260px] shadow-md">
                      <div
                        className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center shadow-lg border-2 border-white/40"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        <img
                          src={formData.logoUrl}
                          alt="Crest preview"
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      </div>
                      <h4 className="font-display font-bold text-base text-white mb-1">
                        {formData.schoolName || 'School Name'}
                      </h4>
                      <p className="text-xs text-indigo-200 italic mb-4 max-w-[220px]">
                        "{formData.motto || 'School Motto'}"
                      </p>
                      <div
                        className="w-full max-w-[200px] py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        Continue to School Portal
                      </div>
                      <div className="text-[10px] text-slate-400 mt-4 flex items-center gap-1">
                        <span>Powered by</span>
                        <span className="font-bold text-amber-400">Skuggle</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Launch */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Review Institution Details & Launch
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Confirm your configuration. You will enter the guided launch checklist immediately upon creation.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Institution:</span>
                    <strong className="text-slate-900">{formData.schoolName} ({formData.schoolCode})</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-800">{formData.address}, {formData.city}, {formData.state}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Master Administrator:</span>
                    <strong className="text-slate-900">{formData.adminFullName} ({formData.adminEmail})</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Curriculum:</span>
                    <span className="text-slate-800">{formData.curriculumType}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Tenant Portal URL:</span>
                    <span className="font-mono text-indigo-700 font-bold">{formData.schoolCode.toLowerCase()}.skuggle.ng</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    <strong>Launch Next Steps:</strong> After creation, you will see your interactive <strong>Launch Checklist</strong> to define Academic Sessions, Terms, Classes, and invite Teachers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={onPreviewWelcome}
                  className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Welcome Preview</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleCreateTenant}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Provisioning School Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Create School Tenant</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
