import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Paperclip,
  Image as ImageIcon,
  Bell,
  Users,
  Building,
  User,
  Check,
  X,
  Phone,
  Video,
  MoreVertical,
  Radio,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentMessagesViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface ChatContact {
  id: string;
  name: string;
  role: string;
  wardContext: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  online: boolean;
  category: 'teachers' | 'school_office' | 'pta';
}

interface ChatMessage {
  id: string;
  sender: 'parent' | 'contact';
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    type: string;
    size: string;
  };
}

const CHAT_CONTACTS: ChatContact[] = [
  {
    id: 'c_1',
    name: 'Mrs. Chioma Okafor',
    role: 'Class Teacher (JSS 2A)',
    wardContext: 'Regarding Nathan Bello',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Nathan did exceptionally well in today\'s robotics presentation! Here is his worksheet.',
    lastTime: '10:45 AM',
    unreadCount: 2,
    online: true,
    category: 'teachers'
  },
  {
    id: 'c_2',
    name: 'Mr. Emmanuel Adeleke',
    role: 'Class Teacher (Primary 4B)',
    wardContext: 'Regarding Chidera Bello',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Chidera has been selected for the Inter-School Spelling Bee team next month.',
    lastTime: 'Yesterday',
    unreadCount: 0,
    online: false,
    category: 'teachers'
  },
  {
    id: 'c_3',
    name: 'Miss Angela Lawson',
    role: 'Nursery Tutor (Nursery 2A)',
    wardContext: 'Regarding Somto Bello',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Somto enjoyed his sensory art play session today. Please remember his costume on Friday.',
    lastTime: 'Yesterday',
    unreadCount: 1,
    online: true,
    category: 'teachers'
  },
  {
    id: 'c_4',
    name: 'Bursary & Accounts Desk',
    role: 'School Financial Office',
    wardContext: 'School Fee Reconciliations',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Your payment of ₦450,000 via Paystack has been reconciled and cleared.',
    lastTime: '18 Oct',
    unreadCount: 0,
    online: true,
    category: 'school_office'
  },
  {
    id: 'c_5',
    name: 'Principal\'s Office (Official Broadcast)',
    role: 'Executive Circulars',
    wardContext: 'All Parents & Guardians',
    avatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Mid-Term Break Announcement & Remedial Clinic Schedule for Term 1.',
    lastTime: '14 Oct',
    unreadCount: 1,
    online: true,
    category: 'school_office'
  },
  {
    id: 'c_6',
    name: 'PTA Executive Committee Forum',
    role: 'Parent Association',
    wardContext: 'Community Noticeboard',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Agenda for the upcoming PTA General Assembly scheduled for Saturday, 15th November.',
    lastTime: '12 Oct',
    unreadCount: 0,
    online: false,
    category: 'pta'
  }
];

const INITIAL_CONVERSATIONS: Record<string, ChatMessage[]> = {
  c_1: [
    {
      id: 'm_1',
      sender: 'contact',
      text: 'Good morning Mrs. Bello. I wanted to commend Nathan\'s enthusiasm in our Science and Robotics practicals this week.',
      timestamp: '09:30 AM'
    },
    {
      id: 'm_2',
      sender: 'parent',
      text: 'Good morning Mrs. Okafor! Thank you so much for the feedback. He has been practicing with his robotics kit at home.',
      timestamp: '09:42 AM'
    },
    {
      id: 'm_3',
      sender: 'contact',
      text: 'Nathan did exceptionally well in today\'s robotics presentation! Here is his worksheet.',
      timestamp: '10:45 AM',
      attachment: {
        name: 'Nathan_Robotics_Circuits_Worksheet.pdf',
        type: 'PDF Document',
        size: '1.2 MB'
      }
    }
  ],
  c_2: [
    {
      id: 'm_4',
      sender: 'contact',
      text: 'Good day Mrs. Bello, Chidera has been selected for the Inter-School Spelling Bee team next month.',
      timestamp: 'Yesterday, 03:15 PM'
    }
  ],
  c_3: [
    {
      id: 'm_5',
      sender: 'contact',
      text: 'Somto enjoyed his sensory art play session today. Please remember his costume on Friday for the cultural rhyme parade.',
      timestamp: 'Yesterday, 01:20 PM'
    }
  ],
  c_4: [
    {
      id: 'm_6',
      sender: 'contact',
      text: 'Dear Mrs. Bello, Your payment of ₦450,000 via Paystack has been reconciled and cleared on the school bursary ledger.',
      timestamp: '18 Oct 2026, 11:35 AM'
    }
  ],
  c_5: [
    {
      id: 'm_7',
      sender: 'contact',
      text: 'OFFICIAL NOTICE: Mid-Term Break Announcement & Remedial Clinic Schedule for First Term 2026/2027.',
      timestamp: '14 Oct 2026, 09:00 AM'
    }
  ],
  c_6: [
    {
      id: 'm_8',
      sender: 'contact',
      text: 'PTA Notice: Agenda for the upcoming PTA General Assembly scheduled for Saturday, 15th November at 10:00 AM.',
      timestamp: '12 Oct 2026, 04:30 PM'
    }
  ]
};

export const ParentMessagesView: React.FC<ParentMessagesViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>('c_1');
  const [activeCategory, setActiveCategory] = useState<'all' | 'teachers' | 'school_office' | 'pta'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

  const selectedContact = CHAT_CONTACTS.find(c => c.id === selectedContactId) || CHAT_CONTACTS[0];
  const currentMessages = conversations[selectedContactId] || [];

  const filteredContacts = CHAT_CONTACTS.filter(contact => {
    if (activeCategory !== 'all' && contact.category !== activeCategory) return false;
    if (searchQuery.trim() === '') return true;
    return (
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.wardContext.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'parent',
      text: inputText.trim(),
      timestamp: 'Just now'
    };

    const updated = {
      ...conversations,
      [selectedContactId]: [...(conversations[selectedContactId] || []), newMsg]
    };

    setConversations(updated);
    setInputText('');

    // Trigger simulated quick acknowledgment
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        sender: 'contact',
        text: `Thank you for your message, Mrs. Bello. Noted with thanks!`,
        timestamp: 'Just now'
      };
      setConversations(prev => ({
        ...prev,
        [selectedContactId]: [...(prev[selectedContactId] || []), replyMsg]
      }));
    }, 2000);
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Your message threads with teachers, the bursary desk, and the principal's office will appear here once your school is set up.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No messages yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Once the school links your account and launches the parent portal, you can message teachers and staff here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
              Parent-School Communication Command
            </span>
            <span className="text-xs text-slate-400 font-medium">Instant Real-Time Messaging</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Teacher & School Communication Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directly communicate with class tutors, school administration, bursary officials, and PTA executive representatives.
          </p>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left 4 Cols: Contact List & Category Filters */}
        <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/40">
          
          {/* Search Box */}
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search teachers, offices, PTA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('teachers')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCategory === 'teachers'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Teachers (3)
              </button>
              <button
                onClick={() => setActiveCategory('school_office')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCategory === 'school_office'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Office / Bursary
              </button>
              <button
                onClick={() => setActiveCategory('pta')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCategory === 'pta'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                PTA Forum
              </button>
            </div>
          </div>

          {/* Contact Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContactId === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-l-4 border-indigo-600 shadow-xs'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                    />
                    {contact.online && (
                      <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{contact.name}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{contact.lastTime}</span>
                    </div>

                    <p className="text-[10.5px] text-indigo-600 font-semibold truncate">{contact.role}</p>
                    <p className="text-[10px] text-slate-400 truncate">{contact.wardContext}</p>
                    
                    <p className="text-[11px] text-slate-600 truncate mt-1">
                      {contact.lastMessage}
                    </p>
                  </div>

                  {contact.unreadCount > 0 && (
                    <span className="w-4.5 h-4.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shrink-0">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right 8 Cols: Active Chat Conversation Thread */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedContact.avatar}
                alt={selectedContact.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{selectedContact.name}</span>
                  {selectedContact.online && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                      Online
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedContact.role} • <strong className="text-indigo-600">{selectedContact.wardContext}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  feedbackBus.info(`Initiating voice call with ${selectedContact.name}...`);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  feedbackBus.info(`Initiating video conference with ${selectedContact.name}...`);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Video Conference"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Thread Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10.5px]">
                End-to-End Encrypted School Communication
              </span>
            </div>

            {currentMessages.map((msg) => {
              const isMe = msg.sender === 'parent';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs space-y-2 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>

                    {msg.attachment && (
                      <div className={`p-2 rounded-xl flex items-center justify-between gap-3 text-xs ${
                        isMe ? 'bg-indigo-700/80 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800'
                      }`}>
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="truncate font-semibold">{msg.attachment.name}</span>
                        </div>
                        <span className="text-[10px] opacity-80 shrink-0">{msg.attachment.size}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
          </div>

          {/* Composer Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                feedbackBus.info('Attachment options opened.');
              }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Reply to ${selectedContact.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-xs shadow-indigo-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
