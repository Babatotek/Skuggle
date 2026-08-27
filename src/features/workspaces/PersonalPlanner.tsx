import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Check, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import type { UserRole } from '@/types';
import { appConfig } from '@/app/config';
import { personalPlanService } from './personalPlanService';

export interface PersonalPlanItem {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
}

const suggestions: Partial<Record<UserRole, string[]>> = {
  teacher: ['Prepare tomorrow’s lesson', 'Review teaching resources', 'Record a professional reflection'],
  parent: ['Review this week’s homework', 'Plan family reading time', 'Set a reminder for an activity'],
  student: ['Revise a difficult topic', 'Complete independent practice', 'Organise today’s notes'],
};

function storageKey(userId: string) {
  return `skuggle:personal-planner:${userId}`;
}

function readItems(userId: string): PersonalPlanItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.title === 'string') : [];
  } catch {
    return [];
  }
}

interface PersonalPlannerProps {
  userId: string;
  role: UserRole;
}

export function PersonalPlanner({ userId, role }: PersonalPlannerProps) {
  const [items, setItems] = useState<PersonalPlanItem[]>(() => readItems(userId));
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'offline'>('idle');

  useEffect(() => {
    setItems(readItems(userId));
  }, [userId]);

  useEffect(() => {
    if (!appConfig.liveApi) return;
    const controller = new AbortController();
    setSyncState('syncing');
    void personalPlanService.list(controller.signal).then((serverItems) => {
      setItems(serverItems);
      setSyncState('idle');
    }).catch((error: unknown) => {
      if ((error as { name?: string }).name !== 'AbortError') setSyncState('offline');
    });
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const openItems = useMemo(() => items.filter((item) => !item.completed).length, [items]);
  const roleSuggestions = suggestions[role] ?? suggestions.student!;

  const addItem = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const temporaryId = `local-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    const optimisticItem = { id: temporaryId, title: cleanTitle, dueDate, completed: false, createdAt: new Date().toISOString() };
    setItems((current) => [...current, optimisticItem]);
    setTitle('');
    setDueDate('');
    if (appConfig.liveApi) {
      setSyncState('syncing');
      void personalPlanService.create({ title: cleanTitle, dueDate: dueDate || null }).then((saved) => {
        setItems((current) => current.map((item) => item.id === temporaryId ? saved : item));
        setSyncState('idle');
      }).catch(() => setSyncState('offline'));
    }
  };

  const toggleItem = (item: PersonalPlanItem) => {
    const completed = !item.completed;
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, completed } : candidate));
    if (appConfig.liveApi && !item.id.startsWith('local-')) {
      setSyncState('syncing');
      void personalPlanService.update(item.id, { completed }).then((saved) => {
        setItems((current) => current.map((candidate) => candidate.id === item.id ? saved : candidate));
        setSyncState('idle');
      }).catch(() => setSyncState('offline'));
    }
  };

  const removeItem = (item: PersonalPlanItem) => {
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    if (appConfig.liveApi && !item.id.startsWith('local-')) {
      void personalPlanService.remove(item.id).catch(() => {
        setItems((current) => current.some((candidate) => candidate.id === item.id) ? current : [...current, item]);
        setSyncState('offline');
      });
    }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div>
        <form onSubmit={addItem} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label htmlFor="personal-plan-title" className="text-sm font-extrabold text-slate-900">What do you want to accomplish?</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input id="personal-plan-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Add a private task or reminder" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
            <button type="submit" disabled={!title.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button>
          </div>
        </form>

        <div className="mt-5 flex items-center justify-between"><h2 className="font-black text-slate-950">My plan</h2><span className="text-xs font-bold text-slate-500">{openItems} open{syncState === 'syncing' ? ' · syncing…' : syncState === 'offline' ? ' · saved offline' : ''}</span></div>
        {items.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><CalendarDays className="mx-auto h-7 w-7 text-indigo-500" /><p className="mt-3 font-bold text-slate-900">Start with one useful next action</p><p className="mt-1 text-sm text-slate-500">Your plan is stored privately on this device for this account.</p></div>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <button type="button" aria-label={`${item.completed ? 'Reopen' : 'Complete'} ${item.title}`} onClick={() => toggleItem(item)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${item.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-4 w-4" /></button>
                <div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</p>{item.dueDate && <p className="mt-0.5 text-xs text-slate-500">Due {item.dueDate}</p>}</div>
                <button type="button" aria-label={`Delete ${item.title}`} onClick={() => removeItem(item)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5"><div className="flex items-center gap-2 text-sm font-black text-indigo-950"><LockKeyhole className="h-4 w-4" /> Personal ownership</div><p className="mt-2 text-xs leading-5 text-indigo-900/70">Planner items never appear in a school workspace or become an official school record.</p></div>
        <h2 className="mt-5 text-sm font-black text-slate-900">Useful starting points</h2>
        <div className="mt-2 space-y-2">{roleSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setTitle(suggestion)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50">{suggestion}</button>)}</div>
      </aside>
    </div>
  );
}
