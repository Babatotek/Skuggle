import React from 'react';
import {
  Camera,
  BookOpen,
  FileText,
  ShieldCheck,
  ArrowRight,
  Play,
  Heart,
  Users,
  Shield,
  Star,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

interface LandingViewProps {
  onSelectRole: (role: UserRole) => void;
  onOpenModal: (modalName: string) => void;
  onRequestLogin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSelectRole,
  onOpenModal,
  onRequestLogin,
}) => {
  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#FAFBFD] text-slate-800 flex flex-col justify-between">
      
      {/* Main Hero Container */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-14 pb-12 w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Title with decorative doodle & star */}
            <div className="relative inline-block">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Welcome to <br />
                <span className="relative inline-block text-indigo-600">
                  Skuggle
                  {/* Purple organic curved underline */}
                  <svg
                    className="absolute -bottom-2.5 left-0 w-full h-3 text-indigo-500 overflow-visible"
                    viewBox="0 0 250 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 14C50 4 120 18 245 8"
                      stroke="#4F46E5"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Decorative yellow star */}
              <div className="absolute top-14 right-[-42px] hidden sm:block">
                <Star className="w-7 h-7 text-amber-400 fill-amber-300 transform rotate-12" />
              </div>
            </div>

            {/* Headline Subtitle */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
              Smart. Simple. Student Records Management for Modern Schools.
            </h2>

            {/* Paragraph Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Capture, manage and organize student records with photos, export reports, and access everything securely in one place. Anytime. Anywhere.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                id="btn-hero-get-started"
                type="button"
                onClick={() => onRequestLogin?.() ?? onSelectRole('school_admin')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2 hover:gap-3 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                id="btn-hero-learn-more"
                onClick={() => onOpenModal('onboarding_wizard')}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Learn More</span>
                <Play className="w-3.5 h-3.5 fill-indigo-600" />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Image with Floating Badges & Ambient Decor */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            
            {/* Background ambient gradient glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl filter blur-2xl opacity-60 -z-10" />

            {/* Decorative Dot Grid */}
            <div className="absolute -right-6 top-1/4 hidden xl:grid grid-cols-3 gap-2 opacity-30">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              ))}
            </div>

            {/* Main Card Frame */}
            <div className="relative w-full max-w-[500px] rounded-3xl overflow-visible p-1.5 bg-gradient-to-b from-indigo-100 via-purple-50 to-white shadow-xl shadow-indigo-100/50">
              
              {/* Image Container */}
              <div className="relative w-full h-[320px] sm:h-[380px] rounded-[22px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80"
                  alt="Student girl writing notes in modern school classroom"
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Subtle dark gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Floating Badge 1: 1,250+ Students Managed */}
              <div className="absolute top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">1,250+</p>
                  <p className="text-[11px] text-slate-500 font-medium">Students Managed</p>
                </div>
              </div>

              {/* Floating Badge 2: Secure & Always Protected */}
              <div className="absolute bottom-4 right-4 sm:right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Secure &</p>
                  <p className="text-[11px] text-slate-500 font-medium">Always Protected</p>
                </div>
              </div>

              {/* Purple Squiggle Doodle under card */}
              <div className="absolute -bottom-6 left-16 hidden sm:block">
                <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 18C8 6 16 22 24 10C32 2 38 20 46 8C52 2 56 16 58 12" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>

            </div>

          </div>

        </div>

        {/* 4 Feature Cards Row - Exact Match to Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-16 sm:mt-20">
          
          {/* Card 1: Capture & Upload */}
          <div
            id="feature-card-capture"
            onClick={() => onOpenModal('register_student')}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-emerald-700 transition-colors">
              Capture & Upload
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take photos using webcam or mobile, or upload from device instantly.
            </p>
          </div>

          {/* Card 2: Manage Records */}
          <div
            id="feature-card-manage"
            onClick={() => onSelectRole('school_admin')}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
              Manage Records
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Store and manage student information in a clean and organized way.
            </p>
          </div>

          {/* Card 3: Export Reports */}
          <div
            id="feature-card-export"
            onClick={() => onOpenModal('report_card')}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-purple-700 transition-colors">
              Export Reports
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download student records in PDF or Excel with school watermark.
            </p>
          </div>

          {/* Card 4: Secure & Private */}
          <div
            id="feature-card-secure"
            onClick={() => onOpenModal('result_checker')}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-amber-700 transition-colors">
              Secure & Private
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your data is encrypted and accessible only to your school.
            </p>
          </div>

        </div>

      </main>

      {/* Footer Banner - Exact match */}
      <footer className="py-6 border-t border-slate-200/60 bg-white text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
          <Heart className="w-4 h-4 text-indigo-500 fill-indigo-500" />
          <span>Trusted by schools to simplify student record management.</span>
        </div>
      </footer>

    </div>
  );
};
