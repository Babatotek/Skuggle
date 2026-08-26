import React, { useState } from 'react';
import {
  Bus,
  HeartPulse,
  Utensils,
  ShoppingBag,
  Calendar,
  Users,
  Shield,
  Download,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentMoreViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const ParentMoreView: React.FC<ParentMoreViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSection, setActiveSection] = useState<'transport' | 'clinic' | 'cafeteria' | 'store' | 'calendar' | 'pta' | 'security'>('transport');

  const handleDownload = (filename: string) => {
    feedbackBus.info(`Downloading ${filename}...`);
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">More</h1>
          <p className="text-sm text-slate-500 mt-1">Transport tracking, clinic records, cafeteria menu, uniform store, and school calendar will appear here once your school launches the parent portal.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No school services linked yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">School transport, medical, cafeteria, and calendar data are published by your school admin after setup is complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 overflow-x-hidden">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wide">
              Parent Ancillary Services & Community
            </span>
            <span className="text-xs text-slate-400 font-medium">All-in-One Utility Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            School Services, Logistics & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access live bus tracking, cafeteria meal menus, clinic records, uniform store pre-orders, and PTA document archives.
          </p>
        </div>
      </div>

      {/* Grid of Navigation Pills / Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSection('transport')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'transport'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Live Bus Transport</span>
        </button>

        <button
          onClick={() => setActiveSection('clinic')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'clinic'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Clinic & Health Log</span>
        </button>

        <button
          onClick={() => setActiveSection('cafeteria')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'cafeteria'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Cafeteria Meal Menu</span>
        </button>

        <button
          onClick={() => setActiveSection('store')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'store'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Uniform & Book Store</span>
        </button>

        <button
          onClick={() => setActiveSection('calendar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'calendar'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Academic Calendar</span>
        </button>

        <button
          onClick={() => setActiveSection('pta')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'pta'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>PTA Documents & Minutes</span>
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* SECTION 1: LIVE BUS TRANSPORT */}
      {activeSection === 'transport' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">School Bus Shuttle Route #4 (Lekki Phase 1 Corridor)</h3>
              <p className="text-xs text-slate-500">Live GPS positioning and driver contact details for Nathan, Chidera, and Somto.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bus In Transit (GPS Active)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Bus Vehicle #4</h4>
                  <p className="text-slate-500 text-[11px]">Toyota Coaster • Plate: <strong>APP-492-LG</strong></p>
                </div>
              </div>
              <div className="space-y-1.5 text-slate-700 pt-2 border-t border-slate-200">
                <p>Assigned Driver: <strong>Mr. Rasheed Alabi</strong></p>
                <p>Phone: <strong className="text-indigo-600">+234 802 889 1234</strong></p>
                <p>Bus Attendant: <strong>Mrs. Folake Sanni</strong> (+234 803 445 6789)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Pickup & Drop-off Point</h4>
                  <p className="text-slate-500 text-[11px]">Designated Family Bus Stop</p>
                </div>
              </div>
              <div className="space-y-1.5 text-slate-700 pt-2 border-t border-slate-200">
                <p>Location: <strong>Admiralty Way Junction / House 24 Gate</strong></p>
                <p>Morning Pickup ETA: <strong>07:15 AM</strong> (Prompt)</p>
                <p>Afternoon Drop-off ETA: <strong>04:05 PM</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Route Waypoint Progress</h4>
                  <p className="text-slate-500 text-[11px]">Real-time stop ledger</p>
                </div>
              </div>
              <div className="space-y-1.5 text-slate-700 pt-2 border-t border-slate-200">
                <p className="text-emerald-700 font-semibold">✓ Stop 1: Victoria Garden City (06:45 AM)</p>
                <p className="text-emerald-700 font-semibold">✓ Stop 2: Chevron Tollgate (07:00 AM)</p>
                <p className="text-indigo-700 font-bold">● Stop 3: Admiralty Way (07:15 AM - Current)</p>
                <p className="text-slate-400">○ School Main Gate Arrival (07:35 AM)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CLINIC & HEALTH LOG */}
      {activeSection === 'clinic' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Ward Medical & Sickbay Clinic Records</h3>
            <p className="text-xs text-slate-500">School Matron logs, immunization status, and allergy alerts.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">Nathan Bello (JSS 2A)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Blood Group: <strong>O+</strong> • Genotype: <strong>AA</strong> • Allergies: <strong>None reported</strong></p>
                <p className="text-emerald-700 font-semibold mt-1">Last Clinic Visit: 16 Oct 2026 (Scheduled Dental Appointment Excuse Filed)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10.5px] shrink-0">
                Medical Clearance: Fit
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">Chidera Bello (Primary 4B)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Blood Group: <strong>O+</strong> • Genotype: <strong>AA</strong> • Allergies: <strong>Mild Peanuts Allergy (On Nurse Watch)</strong></p>
                <p className="text-slate-600 mt-1">Last Clinic Visit: 04 Sep 2026 (Annual Routine Vision & Hearing Screening: 20/20)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10.5px] shrink-0">
                Medical Clearance: Fit
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">Somto Bello (Nursery 2A)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Blood Group: <strong>O+</strong> • Genotype: <strong>AA</strong> • Allergies: <strong>None</strong></p>
                <p className="text-slate-600 mt-1">Immunization Checklist: 100% Up to Date (Measles, Polio, MMR, Yellow Fever)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10.5px] shrink-0">
                Medical Clearance: Fit
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CAFETERIA MEAL PLAN */}
      {activeSection === 'cafeteria' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Termly Cafeteria Hot Lunch Weekly Rotation</h3>
            <p className="text-xs text-slate-500">Prepared fresh daily by certified nutritionists under strict hygiene protocols.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10.5px]">Monday</span>
              <p className="font-bold text-slate-900 mt-1">Jollof Rice & Grilled Chicken</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Served with fried sweet plantain, coleslaw & fresh orange slices.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10.5px]">Tuesday</span>
              <p className="font-bold text-slate-900 mt-1">Spaghetti Bolognese / Beef Stir-fry</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Served with steamed carrots, sweet corn & chilled apple juice.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10.5px]">Wednesday</span>
              <p className="font-bold text-slate-900 mt-1">Fried Rice & Golden Fish Fillet</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Served with vegetable medley and fresh fruit salad cup.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10.5px]">Thursday</span>
              <p className="font-bold text-slate-900 mt-1">Beans Porridge & Diced Plantain</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Traditional honey beans with flaked fish and banana.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10.5px]">Friday</span>
              <p className="font-bold text-slate-900 mt-1">Crispy Potato Chips & Chicken</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Served with dipping sauce and freshly baked vanilla muffin.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: UNIFORM & BOOK STORE */}
      {activeSection === 'store' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Royal Gateway Academy Official Uniform & Book Store</h3>
              <p className="text-xs text-slate-500">Order replacement blazers, PE sportswear, laboratory coats, and textbooks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">Apparel</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Junior Secondary Blazer (JSS 1-3)</h4>
                <p className="text-slate-500 text-[11px]">Navy blue tailored blazer with embroidered school crest.</p>
                <p className="font-extrabold text-slate-900 font-mono text-sm mt-2">₦22,000</p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('Blazer added to school store pre-order cart!');
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Pre-Order
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Sportswear</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Inter-House Sport Jersey (Emerald)</h4>
                <p className="text-slate-500 text-[11px]">Moisture-wicking athletic polo & shorts for Emerald House.</p>
                <p className="font-extrabold text-slate-900 font-mono text-sm mt-2">₦12,500</p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('Sport jersey added to pre-order cart!');
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Pre-Order
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">STEM Kit</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Arduino Robotics Companion Kit</h4>
                <p className="text-slate-500 text-[11px]">Microcontroller, sensors, and breadboard for coding practicals.</p>
                <p className="font-extrabold text-slate-900 font-mono text-sm mt-2">₦28,000</p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('STEM Robotics Kit added to pre-order cart!');
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Pre-Order
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Stationery</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Cambridge Mathematical Set</h4>
                <p className="text-slate-500 text-[11px]">Precision compass, protractor, rulers & metal storage case.</p>
                <p className="font-extrabold text-slate-900 font-mono text-sm mt-2">₦5,500</p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('Mathematical set added to pre-order cart!');
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Pre-Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: ACADEMIC CALENDAR */}
      {activeSection === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">2026/2027 Academic Session Calendar & Key Dates</h3>
              <p className="text-xs text-slate-500">Official Ministry of Education approved termly calendar.</p>
            </div>
            <button
              onClick={() => handleDownload('RGA_Academic_Calendar_2026_2027.pdf')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Calendar PDF</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">First Term Mid-Term Break</p>
                <p className="text-slate-500 text-[11px]">Thursday, 29th October – Friday, 30th October 2026</p>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10.5px]">Upcoming</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">PTA General Meeting & Open Day Exhibition</p>
                <p className="text-slate-500 text-[11px]">Saturday, 15th November 2026 (10:00 AM)</p>
              </div>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10.5px]">Scheduled</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">First Term Terminal Examinations</p>
                <p className="text-slate-500 text-[11px]">Monday, 24th November – Friday, 5th December 2026</p>
              </div>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10.5px]">Examinations</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Annual Christmas Carol & Festival of Nine Lessons</p>
                <p className="text-slate-500 text-[11px]">Thursday, 10th December 2026</p>
              </div>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold text-[10.5px]">Festival</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: PTA DOCUMENTS & MINUTES */}
      {activeSection === 'pta' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">PTA General Assembly Document Repository</h3>
            <p className="text-xs text-slate-500">Official minutes, project audits, and constitutional resolutions.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900">PTA AGM Minutes & STEM Lab Project Resolution 2026</h4>
                  <p className="text-slate-500 text-[11px]">Approved on 14th June 2026 • 1.8 MB PDF</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload('PTA_AGM_Minutes_June_2026.pdf')}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900">PTA Constitution & Welfare By-Laws</h4>
                  <p className="text-slate-500 text-[11px]">Revised Edition 2025 • 920 KB PDF</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload('PTA_Constitution_Revised_2025.pdf')}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: ACCOUNT & SECURITY */}
      {activeSection === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Parent Portal Security & Biometric Login</h3>
            <p className="text-xs text-slate-500">Manage PIN codes and security authentication for payments and results.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Portal Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New 4-Digit Bursary Payment PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Enable Biometric TouchID / FaceID Login</p>
                <p className="text-slate-500 text-[11px]">Quick biometric login without re-typing password on trusted devices.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
            </label>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  feedbackBus.success('Parent portal security credentials updated successfully!');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-indigo-200"
              >
                Save Security Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
