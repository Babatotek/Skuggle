import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, X, Send, BookOpen, Lightbulb, MessageSquare, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiMutation } from '../lib/apiClient';

interface SkuggleAIBuddyProps {
  variant?: 'floating' | 'inline' | 'compact' | 'hero';
  contextHint?: string;
  onActionClick?: (actionType: string) => void;
}

export const SkuggleAIBuddy: React.FC<SkuggleAIBuddyProps> = ({
  variant = 'floating',
  contextHint,
  onActionClick,
}) => {
  const { currentRole, currentWorkspace } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'skuggle' | 'user'; text: string; time: string }>>([
    {
      sender: 'skuggle',
      text: `Hello there! I'm Skuggle, your AI school buddy. 🤖✨ I'm here to assist your ${currentRole} workspace with Nigerian curriculum planning, attendance summaries, and instant insights! What would you like to explore?`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const quickPromptsByRole: Record<string, string[]> = {
    'Teacher': [
      'Draft a 40-min JSS 2 Mathematics lesson plan on Factorisation',
      'Generate 5 diagnostic quiz questions for Basic Science',
      'Give me 3 practical group activities for English comprehension',
    ],
    'School Admin': [
      'Summarize key items remaining on the School Launch Checklist',
      'Draft a welcoming parent broadcast for the new term resumption',
      'How do I configure continuous assessment grading weights?',
    ],
    'Principal': [
      'Suggest academic intervention strategies for at-risk JSS 2 students',
      'Generate guidance for teacher lesson note submission deadlines',
      'What are best practices for term result approvals and lock rules?',
    ],
    'Parent': [
      'Explain how David is performing in Mathematics and English',
      'How can I help my child prepare for mid-term tests at home?',
      'Show me how to view and download my official fee receipts',
    ],
    'Student': [
      'Explain linear algebraic equations with easy everyday examples',
      'Give me a 3-question quick practice quiz for JSS 2 Science',
      'What are good study tips for my upcoming exams?',
    ],
    'Platform Owner': [
      'Show me system uptime and tenant sync health summary',
      'Summarize active school subscription metrics',
    ],
  };

  const currentPrompts = quickPromptsByRole[currentRole] || quickPromptsByRole['Teacher'];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { sender: 'user' as const, text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await apiMutation<{ success: true; data: { reply: string } }>('/ai/assistant', 'POST', {
          message: textToSend,
          persona: currentRole,
          context: {
            workspace: currentWorkspace.name,
            role: currentRole,
            hint: contextHint,
          },
      });
      const skuggleReply = data.data.reply || "I'm right here to help! Let me know if you want me to generate lesson plans, question banks, or class diagnostic notes.";

      setMessages((prev) => [
        ...prev,
        {
          sender: 'skuggle',
          text: skuggleReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'skuggle',
          text: "I'm currently ready in offline mode! You can continue planning lessons, recording attendance, and reviewing assessments securely.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Robot Avatar Graphic SVG
  const RobotGraphic = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const s = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';
    return (
      <div className={`${s} relative flex items-center justify-center`}>
        {/* Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-violet-400/30 animate-pulse blur-sm" />
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-md">
          {/* Robot Head Outer Helmet */}
          <rect x="25" y="20" width="70" height="60" rx="30" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          {/* Ear modules with purple illumination */}
          <circle cx="20" cy="50" r="10" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2" />
          <circle cx="20" cy="50" r="5" fill="#C4B5FD" />
          <circle cx="100" cy="50" r="10" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2" />
          <circle cx="100" cy="50" r="5" fill="#C4B5FD" />
          {/* Visor Screen */}
          <rect x="34" y="32" width="52" height="36" rx="18" fill="#1E1B4B" />
          {/* Glowing Purple Eyes */}
          <ellipse cx="48" cy="48" rx="6" ry="8" fill="#A78BFA" className="animate-pulse" />
          <circle cx="50" cy="46" r="2.5" fill="#FFFFFF" />
          <ellipse cx="72" cy="48" rx="6" ry="8" fill="#A78BFA" className="animate-pulse" />
          <circle cx="74" cy="46" r="2.5" fill="#FFFFFF" />
          {/* Friendly Visor Smile */}
          <path d="M53 58 Q60 64 67 58" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
          {/* Graduation Cap Badge on Head */}
          <polygon points="60,10 75,17 60,24 45,17" fill="#4338CA" />
          <polygon points="45,17 45,21 60,28 75,21 75,17" fill="#312E81" />
          <line x1="72" y1="18" x2="72" y2="28" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="72" cy="28" r="1.5" fill="#F59E0B" />
          {/* Robot Body Hoodie */}
          <path d="M35 80 L85 80 L92 110 L28 110 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
          {/* Chest Collar / Accent */}
          <path d="M48 80 L60 92 L72 80" fill="#7C3AED" />
          {/* Skuggle 'S' on Chest */}
          <circle cx="60" cy="98" r="5" fill="#4F46E5" />
          <path d="M58 97 Q60 95 62 97 Q60 100 58 100" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-amber-50 border border-violet-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <RobotGraphic size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-indigo-950 text-sm sm:text-base">Skuggle AI Buddy</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-800 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-600" />
                Contextual Assistant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
              {contextHint || `Ready to assist your ${currentRole} workspace with smart recommendations, Nigerian curriculum planning, and instant diagnostics.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentPrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => handleSendMessage(prompt), 300);
                  }}
                  className="text-xs px-3 py-1.5 bg-white hover:bg-violet-50 text-indigo-900 font-medium rounded-lg border border-violet-200 shadow-2xs transition-colors flex items-center gap-1.5 text-left"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[260px] sm:max-w-xs">{prompt}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              ))}
              <button
                onClick={() => setIsOpen(true)}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Skuggle AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-indigo-900 text-white rounded-full shadow-xl hover:shadow-indigo-900/30 border border-indigo-700 transition-all"
          aria-label="Open Skuggle AI Buddy"
        >
          <RobotGraphic size="sm" />
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              <span>Ask Skuggle</span>
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
            </span>
            <span className="text-[10px] text-indigo-200">AI Teaching & Learning</span>
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-indigo-900 rounded-full animate-ping" />
        </motion.button>
      </div>

      {/* Interactive AI Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end items-stretch sm:items-center sm:p-4 overflow-hidden pointer-events-auto">
            {/* Soft Backdrop with Fade Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Right Sliding Drawer with Soft Spring Bounce Effect */}
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 270,
                damping: 22,
                mass: 0.8,
                bounce: 0.24,
              }}
              className="relative z-10 w-full sm:w-[480px] max-w-full h-full sm:h-[92vh] max-h-[720px] bg-white sm:rounded-3xl shadow-2xl border-l sm:border border-slate-200/90 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-800">
                <div className="flex items-center gap-3">
                  <RobotGraphic size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base">Skuggle AI Buddy</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-indigo-950 rounded-full">
                        AI Active
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200">
                      Context: <span className="font-semibold text-white">{currentRole}</span> · {currentWorkspace.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFCF7]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'skuggle' && (
                      <div className="shrink-0 mt-0.5">
                        <RobotGraphic size="sm" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div
                        className={`text-[10px] mt-1.5 text-right ${
                          msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <RobotGraphic size="sm" />
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Skuggle is thinking and reviewing curriculum guidelines...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span>Suggested for {currentRole}:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {currentPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p)}
                      disabled={isLoading}
                      className="text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 rounded-full whitespace-nowrap transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Ask Skuggle anything about ${currentRole.toLowerCase()} tasks...`}
                    disabled={isLoading}
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  AI drafts & analyses. Consequential academic decisions remain human-approved.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
