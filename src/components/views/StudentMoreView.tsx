import React, { useState } from 'react';
import {
  Calendar,
  Users,
  BookOpen,
  Trophy,
  Shield,
  Clock,
  MapPin,
  Sparkles,
  Download,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  QrCode,
  RotateCcw,
  Bookmark,
  Award,
  Video,
  FileText,
  CreditCard,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentMoreViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentMoreView: React.FC<StudentMoreViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [activeSection, setActiveSection] = useState<'timetable' | 'clubs' | 'library' | 'house_points' | 'id_card'>('timetable');
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');

  // Library books state
  const [borrowedBooks, setBorrowedBooks] = useState([
    {
      id: 'b1',
      title: 'New General Mathematics for Junior Secondary 2',
      author: 'M.F. Macrae et al.',
      dueDate: '27 Feb 2026',
      dueInDays: 5,
      coverColor: 'bg-blue-600',
      category: 'Mathematics',
    },
    {
      id: 'b2',
      title: 'The Concubine (African Writers Series)',
      author: 'Elechi Amadi',
      dueDate: '06 Mar 2026',
      dueInDays: 12,
      coverColor: 'bg-amber-600',
      category: 'Literature in English',
    },
  ]);

  const timetableSchedule = {
    Monday: [
      { time: '08:00 - 08:30 AM', subject: 'Morning Assembly & Devotion', venue: 'School Auditorium', teacher: 'All Staff' },
      { time: '08:30 - 09:15 AM', subject: 'Mathematics (Algebra)', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '09:15 - 10:00 AM', subject: 'English Studies (Grammar)', venue: 'Room 204 (JSS 2A)', teacher: 'Mrs. Folake Johnson' },
      { time: '10:00 - 10:45 AM', subject: 'Basic Science & Tech', venue: 'Science Lab 2', teacher: 'Dr. (Mrs.) Alabi' },
      { time: '10:45 - 11:15 AM', subject: 'Short Break & Snacks', venue: 'School Cafeteria', isBreak: true },
      { time: '11:15 - 12:00 PM', subject: 'Computer Studies / Coding', venue: 'ICT Center Lab 1', teacher: 'Engr. Kenneth Obi' },
      { time: '12:00 - 12:45 PM', subject: 'Civic & Social Studies', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Babatunde Musa' },
      { time: '12:45 - 01:30 PM', subject: 'Long Lunch Break', venue: 'Dining Hall / Quadrangle', isBreak: true },
      { time: '01:30 - 02:15 PM', subject: 'French Language', venue: 'Language Studio', teacher: 'Mme. Chantal Dubois' },
      { time: '02:15 - 03:30 PM', subject: 'Robotics & Coding Society', venue: 'Innovation Hub', teacher: 'Club Activity' },
    ],
    Tuesday: [
      { time: '08:00 - 08:30 AM', subject: 'Form Roll-Call & Inspection', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '08:30 - 09:15 AM', subject: 'Agricultural Science', venue: 'School Farm / Demo Plot', teacher: 'Mr. Dennis Eze' },
      { time: '09:15 - 10:00 AM', subject: 'Mathematics (Geometry)', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '10:00 - 10:45 AM', subject: 'Business Studies', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Austin Bassey' },
      { time: '10:45 - 11:15 AM', subject: 'Short Break', venue: 'Cafeteria', isBreak: true },
      { time: '11:15 - 12:00 PM', subject: 'English Studies (Literature)', venue: 'Room 204 (JSS 2A)', teacher: 'Mrs. Folake Johnson' },
      { time: '12:00 - 12:45 PM', subject: 'Physical & Health Education', venue: 'Sports Pavilion', teacher: 'Coach Ibrahim' },
      { time: '12:45 - 01:30 PM', subject: 'Long Lunch Break', venue: 'Dining Hall', isBreak: true },
      { time: '01:30 - 03:00 PM', subject: 'Science Practical Workshop', venue: 'Science Lab 2', teacher: 'Dr. (Mrs.) Alabi' },
    ],
    Wednesday: [
      { time: '08:00 - 08:30 AM', subject: 'Mid-Week Assembly', venue: 'School Auditorium', teacher: 'Principal' },
      { time: '08:30 - 09:15 AM', subject: 'Mathematics (Statistics)', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '09:15 - 10:00 AM', subject: 'Basic Technology (Drawings)', venue: 'Tech Drawing Studio', teacher: 'Engr. Kenneth Obi' },
      { time: '10:00 - 10:45 AM', subject: 'French (Oral & Dialogue)', venue: 'Language Studio', teacher: 'Mme. Chantal Dubois' },
      { time: '10:45 - 11:15 AM', subject: 'Short Break', venue: 'Cafeteria', isBreak: true },
      { time: '11:15 - 12:00 PM', subject: 'English Studies (Composition)', venue: 'Room 204 (JSS 2A)', teacher: 'Mrs. Folake Johnson' },
      { time: '12:00 - 12:45 PM', subject: 'Christian Religious Studies', venue: 'Room 204 (JSS 2A)', teacher: 'Pastor Emmanuel' },
      { time: '12:45 - 01:30 PM', subject: 'Long Lunch Break', venue: 'Dining Hall', isBreak: true },
      { time: '01:30 - 03:30 PM', subject: 'Inter-House Sports Training', venue: 'Athletics Track', teacher: 'House Masters' },
    ],
    Thursday: [
      { time: '08:00 - 08:30 AM', subject: 'Form Roll-Call & Inspection', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '08:30 - 09:15 AM', subject: 'Computer Studies (Python Lab)', venue: 'ICT Center Lab 1', teacher: 'Engr. Kenneth Obi' },
      { time: '09:15 - 10:00 AM', subject: 'Mathematics (Problem Solving)', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '10:00 - 10:45 AM', subject: 'Civic Education', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Babatunde Musa' },
      { time: '10:45 - 11:15 AM', subject: 'Short Break', venue: 'Cafeteria', isBreak: true },
      { time: '11:15 - 12:00 PM', subject: 'Agricultural Science', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Dennis Eze' },
      { time: '12:00 - 12:45 PM', subject: 'Music & Cultural Arts', venue: 'Creative Arts Studio', teacher: 'Mr. David Adeleke' },
      { time: '12:45 - 01:30 PM', subject: 'Long Lunch Break', venue: 'Dining Hall', isBreak: true },
      { time: '01:30 - 03:30 PM', subject: 'Literary & Debating Society', venue: 'Auditorium Hall', teacher: 'Society Activity' },
    ],
    Friday: [
      { time: '08:00 - 08:30 AM', subject: 'Friday Morning Briefing', venue: 'Auditorium', teacher: 'Vice Principal' },
      { time: '08:30 - 09:15 AM', subject: 'Mathematics Weekly CA Test', venue: 'CBT Lab / Room 204', teacher: 'Mr. Adewale Olawale' },
      { time: '09:15 - 10:00 AM', subject: 'English Studies (Reading Club)', venue: 'School Library', teacher: 'Mrs. Folake Johnson' },
      { time: '10:00 - 10:45 AM', subject: 'Basic Science Quiz', venue: 'Room 204 (JSS 2A)', teacher: 'Dr. (Mrs.) Alabi' },
      { time: '10:45 - 11:15 AM', subject: 'Short Break', venue: 'Cafeteria', isBreak: true },
      { time: '11:15 - 12:15 PM', subject: 'Class Teacher Form Period & Goal Review', venue: 'Room 204 (JSS 2A)', teacher: 'Mr. Adewale Olawale' },
      { time: '12:15 - 01:00 PM', subject: 'Early Friday Dismissal & Bus Boarding', venue: 'Main Gate Terminal', isBreak: true },
    ],
  };

  const handleRenewBook = (id: string, title: string) => {
    feedbackBus.success(`Loan renewed for 14 days: "${title}"`);
    setBorrowedBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, dueInDays: b.dueInDays + 14, dueDate: '13 Mar 2026' } : b))
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 overflow-x-hidden">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
              Student Life & Ancillary Services
            </span>
            <span className="text-xs text-slate-400 font-medium">{workspace.contextLine}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Timetable, Clubs, Library & Digital ID
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {workspace.isLive && workspace.isPersonal
              ? 'Personal workspace tools. School timetable, clubs, and ID appear after you join with an invitation.'
              : 'Manage your daily class periods, societies, library e-books, and digital student identity card.'}
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSection('timetable')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'timetable'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Timetable</span>
        </button>

        <button
          onClick={() => setActiveSection('clubs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'clubs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clubs & Societies</span>
        </button>

        <button
          onClick={() => setActiveSection('library')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'library'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Library & E-Books</span>
        </button>

        <button
          onClick={() => setActiveSection('house_points')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'house_points'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>House Points & Sports</span>
        </button>

        <button
          onClick={() => setActiveSection('id_card')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'id_card'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Digital Student ID</span>
        </button>
      </div>

      {/* SECTION 1: CLASS TIMETABLE */}
      {activeSection === 'timetable' && (
        <div className="space-y-6">
          {workspace.isLive ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Calendar className="mx-auto mb-3 h-9 w-9 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No timetable published yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {workspace.isPersonal
                  ? 'School timetables appear after you join a school with an invitation code.'
                  : `${workspace.schoolLabel} hasn't published a timetable for your account yet.`}
              </p>
            </div>
          ) : (
            <>
              {/* Day Selector */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedDay === day
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                  Class: JSS 2A (Room 204)
                </span>
              </div>

              {/* Schedule Timeline */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  {selectedDay}'s Daily Academic Schedule
                </h3>
                <div className="space-y-3">
                  {timetableSchedule[selectedDay].map((period, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        period.isBreak
                          ? 'bg-amber-50/50 border-amber-200/60'
                          : 'bg-white border-slate-200/80 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                          {period.time}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{period.subject}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{period.venue}</span>
                            {period.teacher && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{period.teacher}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {!period.isBreak && (
                        <button
                          onClick={() => onNavigateTab('learning')}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          View Subject Hub
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 2: CLUBS & SOCIETIES */}
      {activeSection === 'clubs' && (
        <div className="space-y-6">
          {workspace.isLive ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No clubs or societies yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {workspace.isPersonal
                  ? 'School clubs and societies appear after you join a school with an invitation code.'
                  : `${workspace.schoolLabel} hasn't added any clubs to your profile yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Robotics Club */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase">President</span>
                    <span className="text-xs font-semibold text-slate-400">Mondays 2:15 - 3:30 PM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-xl">🤖</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Robotics & Innovation Society</h3>
                      <p className="text-xs text-slate-500">Patron: Engr. Kenneth Obi • 24 Members</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">Building autonomous line-follower robots and Arduino micro-controllers for the upcoming Lagos State Inter-School STEM Fair 2026.</p>
                  <div className="mt-4 p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1 text-xs">
                    <p className="font-bold text-purple-900">Current Sprint Project:</p>
                    <p className="text-purple-950">Solar-powered automated greenhouse moisture sensor prototype.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Next Meeting: Monday</span>
                  <button onClick={() => feedbackBus.success('Society project portfolio exported!')} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors">View Club Portfolio</button>
                </div>
              </div>
              {/* Debating Society */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">Active Debater</span>
                    <span className="text-xs font-semibold text-slate-400">Thursdays 1:30 - 3:30 PM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xl">🎙️</div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Junior Literary & Debating Society</h3>
                      <p className="text-xs text-slate-500">Patron: Mrs. Folake Johnson • 32 Members</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">Fostering eloquent oratory, persuasive speech construction, parliamentary debate motions, and creative prose writing.</p>
                  <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1 text-xs">
                    <p className="font-bold text-blue-900">Next Debate Motion:</p>
                    <p className="text-blue-950">"Artificial Intelligence in Education empowers rather than hinders student critical thinking."</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-bold flex items-center gap-1"><Award className="w-3.5 h-3.5" /> 1st Speaker (Proposer)</span>
                  <button onClick={() => feedbackBus.success('Debate speech notes opened!')} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors">View Motion Notes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: SCHOOL LIBRARY & E-BOOKS */}
      {activeSection === 'library' && (
        <div className="space-y-6">
          {workspace.isLive ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <BookOpen className="mx-auto mb-3 h-9 w-9 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No borrowed books</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {workspace.isPersonal
                  ? 'Physical library loan tracking appears after you join a school. You can still upload and manage your own resources in the Digital Library.'
                  : `${workspace.schoolLabel} hasn't linked any library loans to your account yet.`}
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('learning')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Go to Digital Library
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Currently Borrowed Physical Textbooks ({borrowedBooks.length})
                  </h3>
                  <p className="text-xs text-slate-500">Track return deadlines and renew library books online</p>
                </div>
                <button
                  onClick={() => feedbackBus.info('Opening digital library catalog (2,450 titles)...')}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  Browse Digital Library Catalog
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {borrowedBooks.map((book) => (
                  <div key={book.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-16 rounded-xl ${book.coverColor} text-white flex items-center justify-center font-bold text-xs p-1 text-center shadow-xs`}>
                        {book.category.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{book.title}</h4>
                        <p className="text-xs text-slate-500">By {book.author}</p>
                        <span className="text-[11px] font-semibold text-indigo-600 mt-1 inline-block">
                          Due Date: {book.dueDate} ({book.dueInDays} days left)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRenewBook(book.id, book.title)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Renew Loan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: HOUSE POINTS & SPORTS */}
      {activeSection === 'house_points' && (
        <div className="space-y-6">
          {workspace.isLive ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Trophy className="mx-auto mb-3 h-9 w-9 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No house or sports data yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {workspace.isPersonal
                  ? 'Inter-house standings and sports results appear after you join a school with an invitation code.'
                  : `${workspace.schoolLabel} hasn't published house points or sports results for your account yet.`}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-blue-200 border border-white/10">House Affiliation</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Aquila House (Blue House) • Rank #1</h2>
                  <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
                    House Motto: "Fly Higher with Integrity". Nathan has contributed <strong className="text-amber-300">145 points</strong> towards Aquila's lead in the 2026 Inter-House Championship!
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center min-w-[200px]">
                  <span className="text-3xl font-extrabold text-amber-300">1,420 pts</span>
                  <p className="text-xs text-blue-200 font-semibold mt-0.5">Total House Standing</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Inter-House Championship Leaderboard</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Aquila (Blue)', pts: 1420, rank: '1st', color: 'border-blue-500 bg-blue-50/50', badge: 'bg-blue-600 text-white' },
                    { name: 'Phoenix (Red)', pts: 1340, rank: '2nd', color: 'border-red-500 bg-red-50/50', badge: 'bg-red-600 text-white' },
                    { name: 'Emerald (Green)', pts: 1285, rank: '3rd', color: 'border-emerald-500 bg-emerald-50/50', badge: 'bg-emerald-600 text-white' },
                    { name: 'Sol (Yellow)', pts: 1210, rank: '4th', color: 'border-amber-500 bg-amber-50/50', badge: 'bg-amber-600 text-white' },
                  ].map((h, i) => (
                    <div key={i} className={`p-4 rounded-2xl border-2 ${h.color} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{h.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${h.badge}`}>{h.rank}</span>
                      </div>
                      <div className="text-xl font-extrabold text-slate-900">{h.pts} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 5: DIGITAL STUDENT ID CARD */}
      {activeSection === 'id_card' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 max-w-xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Student Identity Card</h3>
                <p className="text-xs text-slate-500">
                  {workspace.schoolLabel} • {workspace.isLive ? 'Your workspace ID' : 'Valid for 2025/2026'}
                </p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.info('Downloading Digital Student ID PDF...');
                }}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                title="Download ID"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Physical ID Card Simulation */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 shadow-xl space-y-5 border border-white/20 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-bold text-sm">
                    🎓
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-wide uppercase">
                      {workspace.schoolLabel}
                    </h4>
                    <p className="text-[9px] text-indigo-200">
                      {workspace.isPersonal ? 'Personal Learning Space' : 'Excellence, Integrity and Wisdom'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                  STUDENT
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-2xl bg-indigo-800/40 border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-sm">
                  {workspace.avatarUrl ? (
                    <img
                      src={workspace.avatarUrl}
                      alt={workspace.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-white/60">
                      {workspace.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <h3 className="text-base font-extrabold text-white">{workspace.displayName}</h3>
                  <p className="text-indigo-200">
                    Class:{' '}
                    <strong className="text-white">
                      {workspace.classLabel || (workspace.isPersonal ? 'Personal' : '—')}
                    </strong>
                  </p>
                  {workspace.isLive ? (
                    <p className="text-indigo-200">
                      Workspace:{' '}
                      <strong className="font-mono text-white">{workspace.userId.slice(0, 12)}…</strong>
                    </p>
                  ) : (
                    <>
                      <p className="text-indigo-200">
                        Adm No: <strong className="font-mono text-white">RGA/2023/JSS/042</strong>
                      </p>
                      <p className="text-indigo-200">
                        House: <strong className="text-blue-300">Aquila (Blue House)</strong>
                      </p>
                      <p className="text-indigo-200">
                        Blood Group: <strong className="text-white">O+ (Genotype: AA)</strong>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-indigo-200">
                {workspace.isLive ? (
                  <span>ID issued by {workspace.schoolLabel}</span>
                ) : (
                  <span>Emergency: +234 803 456 7890</span>
                )}
                {!workspace.isLive && (
                  <span className="font-mono font-bold text-amber-300">RFID: 884-291-K9</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
