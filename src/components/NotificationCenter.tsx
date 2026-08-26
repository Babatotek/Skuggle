import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Server,
  Filter,
  Search,
  ChevronRight,
  Send,
  X,
  Clock,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  ShieldAlert,
  Volume2,
  VolumeX
} from 'lucide-react';
import { NotificationItem, NotificationCategory } from '../types';
import { useFeedbackOptional } from '../shared/ui';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onActionClick: (actionType?: string, targetId?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onActionClick,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const feedback = useFeedbackOptional();
  const soundEnabled = feedback?.soundEnabled ?? true;
  const toggleSound = () => feedback?.setSoundEnabled(!soundEnabled);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_parents');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Counts
  const counts = useMemo(() => {
    const totalUnread = notifications.filter((n) => !(n.isRead ?? n.read)).length;
    const alerts = notifications.filter((n) => (n.category || 'alert') === 'alert').length;
    const payments = notifications.filter((n) => n.category === 'payment').length;
    const studentUpdates = notifications.filter((n) => n.category === 'student_update').length;
    return { totalUnread, alerts, payments, studentUpdates };
  }, [notifications]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const isItemRead = item.isRead ?? item.read ?? false;
      const itemCategory = item.category || 'alert';
      if (activeCategory !== 'all' && itemCategory !== activeCategory) {
        return false;
      }
      if (unreadOnly && isItemRead) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchMessage = (item.message || item.subtitle || '').toLowerCase().includes(query);
        const matchStudent = item.metadata?.studentName?.toLowerCase().includes(query);
        const matchClass = item.metadata?.studentClass?.toLowerCase().includes(query);
        if (!matchTitle && !matchMessage && !matchStudent && !matchClass) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, activeCategory, unreadOnly, searchQuery]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setShowBroadcastModal(false);
      setBroadcastMessage('');
    }, 1500);
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'student_update':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'system':
      default:
        return <Server className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBg = (category: NotificationCategory) => {
    switch (category) {
      case 'alert':
        return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'payment':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'student_update':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case 'system':
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  return (
    <div
      ref={containerRef}
      id="notification-center-panel"
      className="absolute right-0 sm:right-2 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[440px] max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Notification Center</h3>
              {counts.totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                  {counts.totalUnread} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">Alerts, Fee Reminders & Student Updates</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={soundEnabled ? 'Mute action sounds' : 'Unmute action sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Toolbar & Search */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-2.5">
        {/* Search input and unread toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts, students, receipts..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              unreadOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Show unread only"
          >
            <Filter className="w-3 h-3" />
            <span className="hidden sm:inline">Unread</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveCategory('alert')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'alert'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Alerts</span>
            {counts.alerts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                {counts.alerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('payment')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'payment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>Payments</span>
            {counts.payments > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {counts.payments}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('student_update')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'student_update'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Students</span>
            {counts.studentUpdates > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                {counts.studentUpdates}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[50vh]">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-800">You're all caught up!</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
              No notifications match your current filter. New reminders and alerts will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isItemRead = item.isRead ?? item.read ?? false;
            const itemCategory = (item.category || 'alert') as NotificationCategory;
            const itemMessage = item.message || item.subtitle || '';

            return (
              <div
                key={item.id}
                id={`notification-item-${item.id}`}
                className={`p-3.5 transition-colors relative group ${
                  isItemRead ? 'bg-white hover:bg-slate-50/80' : 'bg-indigo-50/30 hover:bg-indigo-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category Badge Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-xs ${getCategoryBg(
                      itemCategory
                    )}`}
                  >
                    {getCategoryIcon(itemCategory)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isItemRead ? 'text-slate-800' : 'text-slate-900 font-bold'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!isItemRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {itemMessage}
                    </p>

                    {/* Metadata chips */}
                    {item.metadata && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {item.metadata.amount && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            ₦{item.metadata.amount.toLocaleString()}
                          </span>
                        )}
                        {item.metadata.studentClass && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {item.metadata.studentClass}
                          </span>
                        )}
                        {item.metadata.studentName && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                            {item.metadata.studentName}
                          </span>
                        )}
                        {item.metadata.badgeText && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                            {item.metadata.badgeText}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                      <div>
                        {item.actionLabel && (
                          <button
                            onClick={() => {
                              onMarkAsRead(item.id);
                              onActionClick(item.actionType, item.targetId);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <span>{item.actionLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onMarkAsRead(item.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 text-[11px] transition-colors"
                          title={isItemRead ? 'Mark as unread' : 'Mark as read'}
                        >
                          {isItemRead ? (
                            <span className="text-[10px] font-medium text-slate-500">Unread</span>
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onDismiss(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllAsRead}
            disabled={counts.totalUnread === 0}
            className="text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mark all read</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-rose-600 hover:text-rose-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear all
          </button>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all"
        >
          <Send className="w-3 h-3" />
          <span>Quick Broadcast</span>
        </button>
      </div>

      {/* Quick Broadcast Modal */}
      {showBroadcastModal && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xs p-4 z-50 flex flex-col justify-between animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Send Instant Alert / Reminder</h4>
            </div>
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {broadcastSuccess ? (
            <div className="my-auto text-center py-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900">Broadcast Dispatched!</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sent via SMS & Parent Portal notification queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendBroadcast} className="space-y-3 my-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Audience
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all_parents">All Guardians / Parents (1,248)</option>
                  <option value="overdue_fees">Parents with Outstanding Fees (78)</option>
                  <option value="teachers">All Teaching Staff (46)</option>
                  <option value="jss3_parents">JSS 3 Parents (BECE Cohort)</option>
                  <option value="sss3_parents">SSS 3 Parents (WAEC Cohort)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Broadcast Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Friendly reminder: Term 1 fee verification deadline is this Friday. Please submit bank proofs via portal."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Dispatch Alert</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
