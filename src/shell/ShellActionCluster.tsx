import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  CheckCheck,
  ChevronDown,
  HelpCircle,
  LogOut,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../lib/apiClient';
import { notificationSoundEnabled, setNotificationSoundEnabled } from '../lib/notificationAudio';
import { buildRoute } from '../routing/builders';
import { readShellDensity, writeShellDensity } from './preferences';
import type { ShellDensity, ShellFamily } from './types';

interface HeaderNotification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'error' | 'failed' | 'info';
  createdAt: string;
  read?: boolean;
  persisted?: boolean;
}

interface NotificationInboxResponse { success: true; data: { unreadCount: number; data: HeaderNotification[] } }

export const ShellActionCluster: React.FC<{
  family: ShellFamily;
  onOpenSearch: () => void;
  onLogout: () => void;
  showSearch: boolean;
}> = ({ family, onOpenSearch, onLogout, showSearch }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [myWorkOpen, setMyWorkOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(notificationSoundEnabled);
  const [density, setDensity] = useState<ShellDensity>(readShellDensity);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const receive = (event: Event) => {
      const item = (event as CustomEvent<HeaderNotification>).detail;
      setNotifications((current) => [{ ...item, read: false, persisted: false }, ...current].slice(0, 50));
    };
    window.addEventListener('skuggle:notification', receive);
    return () => window.removeEventListener('skuggle:notification', receive);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<NotificationInboxResponse>('/notifications', { suppressErrorNotification: true })
      .then((response) => { if (active) setNotifications((local) => [...local, ...response.data.data.map((item) => ({ ...item, persisted: true }))].slice(0, 50)); })
      .catch(() => { /* Inbox failure must not prevent the workspace from loading. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setUserOpen(false);
        setMyWorkOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const showMyWork = family === 'school-staff';

  const markAll = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    try { await apiRequest('/notifications/read-all', { method: 'PATCH', headers: { 'Idempotency-Key': crypto.randomUUID() } }); } catch { /* existing global error path */ }
  };

  return (
    <div ref={rootRef} className="flex items-center gap-1 sm:gap-2">
      {showSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          className="ds-focus-ring hidden min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-muted)] lg:flex"
          aria-label="Search workspace destinations"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Search</span>
          <kbd className="rounded border border-[var(--color-border-default)] bg-[var(--color-surface)] px-1.5 text-[10px]">⌘K</kbd>
        </button>
      )}
      {showMyWork && (
        <div className="relative">
          <button
            type="button"
            className="ds-focus-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            aria-label="My Work"
            aria-expanded={myWorkOpen}
            onClick={() => { setMyWorkOpen((open) => !open); setNotificationsOpen(false); setUserOpen(false); }}
          >
            <Briefcase className="h-4 w-4" aria-hidden="true" />
          </button>
          {myWorkOpen && (
            <div className="absolute right-0 z-[var(--z-popover)] mt-2 w-[min(92vw,20rem)] rounded-[var(--radius-dialog)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-overlay)]" role="dialog" aria-label="My Work">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">My Work</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Actionable items such as approvals and marking will appear here when the work queue is available. This is not a notifications inbox.</p>
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          className="ds-focus-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
          aria-label={`${unreadCount} unread notifications`}
          aria-expanded={notificationsOpen}
          onClick={() => { setNotificationsOpen((open) => !open); setMyWorkOpen(false); setUserOpen(false); }}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--color-status-negative-text)] px-1 text-[10px] font-bold text-[var(--color-action-on-primary)]">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
        {notificationsOpen && (
          <div className="absolute right-0 z-[var(--z-popover)] mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-[var(--radius-dialog)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-overlay)]" role="dialog" aria-label="Notifications">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              <div className="flex gap-1">
                <button type="button" className="ds-focus-ring rounded-md p-2" aria-label={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'} onClick={() => { const next = !soundEnabled; setSoundEnabled(next); setNotificationSoundEnabled(next); }}>{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
                <button type="button" className="ds-focus-ring rounded-md p-2" aria-label="Mark all as read" onClick={() => void markAll()}><CheckCheck className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">You are all caught up.</p> : notifications.map((item) => (
                <p key={item.id} className={`border-b border-[var(--color-border-default)] p-3 text-xs ${item.read ? 'opacity-70' : ''}`}>
                  <span className="block font-semibold text-[var(--color-text-primary)]">{item.title}</span>
                  {item.description && <span className="mt-0.5 block text-[var(--color-text-secondary)]">{item.description}</span>}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      <span data-shell-slot="activity" hidden />
      <div className="relative">
        <button
          type="button"
          className="ds-focus-ring flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-1.5 hover:bg-[var(--color-surface-muted)]"
          aria-expanded={userOpen}
          aria-haspopup="menu"
          onClick={() => { setUserOpen((open) => !open); setNotificationsOpen(false); setMyWorkOpen(false); }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primitive-neutral-800)] text-[10px] font-bold text-[var(--color-action-on-primary)]">{currentUser.fullName.slice(0, 2).toUpperCase()}</span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-[var(--color-text-primary)]">{currentUser.fullName.split(' ')[0]}</span>
          </span>
          <ChevronDown className="hidden h-3 w-3 text-[var(--color-text-muted)] sm:block" aria-hidden="true" />
        </button>
        {userOpen && (
          <div className="absolute right-0 z-[var(--z-popover)] mt-2 w-72 rounded-[var(--radius-dialog)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] py-2 shadow-[var(--shadow-overlay)]" role="menu" aria-label="Account">
            <div className="border-b border-[var(--color-border-default)] px-4 py-3">
              <p className="text-sm font-semibold">{currentUser.fullName}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{currentUser.email}</p>
            </div>
            <div className="p-1.5">
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Density</p>
              {(['comfortable', 'compact'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={density === value}
                  className="ds-focus-ring flex min-h-11 w-full items-center rounded-[var(--radius-control)] px-3 text-sm capitalize text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                  onClick={() => { setDensity(value); writeShellDensity(value); document.documentElement.dataset.density = value; }}
                >
                  {value}
                </button>
              ))}
              <button type="button" role="menuitem" className="ds-focus-ring flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm hover:bg-[var(--color-surface-muted)]" onClick={() => { setUserOpen(false); navigate(buildRoute(family === 'platform' ? 'platform.help' : family === 'personal' ? 'personal.help' : 'school.help')); }}>
                <HelpCircle className="h-4 w-4" aria-hidden="true" /> Help
              </button>
              <button type="button" role="menuitem" className="ds-focus-ring flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm text-[var(--color-status-negative-text)] hover:bg-[var(--color-status-negative-bg)]" onClick={() => { setUserOpen(false); onLogout(); }}>
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
