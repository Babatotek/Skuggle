import React, { useState, useEffect, useId, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Maximize2, Minimize2, Check } from 'lucide-react';

// --- Types & Context for Grouping ---

export type CollapsibleCardVariant =
  | 'default'
  | 'elevated'
  | 'bordered'
  | 'subtle'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'dark';

export type CollapsibleCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CollapsibleCardProps {
  id?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'indigo' | 'amber' | 'emerald' | 'slate';
  headerActions?: React.ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  disabled?: boolean;
  variant?: CollapsibleCardVariant;
  padding?: CollapsibleCardPadding;
  headerSize?: 'sm' | 'md' | 'lg';
  hideChevron?: boolean;
  chevronPosition?: 'left' | 'right';
  persistKey?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

interface CollapsibleGroupContextValue {
  openCardIds: Set<string>;
  toggleCard: (id: string) => void;
  isAccordion: boolean;
}

const CollapsibleGroupContext = createContext<CollapsibleGroupContextValue | null>(null);

// --- Badge Style Helper ---

const getBadgeStyles = (variant: string = 'default') => {
  switch (variant) {
    case 'success':
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'warning':
    case 'amber':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'danger':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'info':
    case 'purple':
    case 'indigo':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'slate':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'default':
    default:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
};

// --- Variant Style Helper ---

const getVariantStyles = (variant: CollapsibleCardVariant | string = 'default', isOpen: boolean) => {
  switch (variant) {
    case 'elevated':
      return 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200';
    case 'bordered':
      return isOpen
        ? 'bg-white border-2 border-indigo-200/90 shadow-xs'
        : 'bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-white';
    case 'subtle':
      return 'bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50';
    case 'indigo':
      return isOpen
        ? 'bg-indigo-50/40 border border-indigo-200 shadow-xs'
        : 'bg-white border border-indigo-100 hover:border-indigo-200';
    case 'emerald':
      return isOpen
        ? 'bg-emerald-50/40 border border-emerald-200 shadow-xs'
        : 'bg-white border border-emerald-100 hover:border-emerald-200';
    case 'amber':
      return isOpen
        ? 'bg-amber-50/40 border border-amber-200 shadow-xs'
        : 'bg-white border border-amber-100 hover:border-amber-200';
    case 'dark':
      return 'bg-slate-900 text-white border border-slate-800 shadow-md';
    case 'default':
    default:
      return 'bg-white border border-slate-200 shadow-xs hover:border-slate-300';
  }
};

// --- Content Padding Helper ---

const getContentPaddingStyles = (padding: CollapsibleCardPadding | string = 'md') => {
  switch (padding) {
    case 'none':
      return 'p-0';
    case 'sm':
      return 'p-3 sm:p-4';
    case 'lg':
      return 'p-6 sm:p-8';
    case 'md':
    default:
      return 'p-4 sm:p-6';
  }
};

/**
 * CollapsibleCard: A versatile, accessible, and beautifully animated collapsible card component.
 * Supports standalone usage, nested cards, multiple cards inside CollapsibleCardGroup,
 * header actions, custom badges, persistent storage, and diverse visual styles.
 */
export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id: explicitId,
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'default',
  headerActions,
  isOpen: controlledIsOpen,
  defaultOpen = true,
  onToggle,
  disabled = false,
  variant = 'default',
  padding = 'md',
  headerSize = 'md',
  hideChevron = false,
  chevronPosition = 'right',
  persistKey,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footer,
  children,
}) => {
  const generatedId = useId();
  const cardId = explicitId || `collapsible-card-${generatedId.replace(/:/g, '')}`;
  const contentId = `${cardId}-content`;
  const headerId = `${cardId}-header`;

  const group = useContext(CollapsibleGroupContext);

  // Determine initial state
  const [internalOpen, setInternalOpen] = useState<boolean>(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`collapsible_card_${persistKey}`);
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch {
        // Fallback to defaultOpen on error
      }
    }
    return defaultOpen;
  });

  // Calculate actual open state
  const isControlled = controlledIsOpen !== undefined;
  const isGroupControlled = group !== null;

  let currentIsOpen = internalOpen;
  if (isGroupControlled) {
    currentIsOpen = group.openCardIds.has(cardId);
  } else if (isControlled) {
    currentIsOpen = controlledIsOpen;
  }

  const handleToggle = () => {
    if (disabled) return;

    if (isGroupControlled) {
      group.toggleCard(cardId);
    } else {
      const nextOpen = !currentIsOpen;
      if (!isControlled) {
        setInternalOpen(nextOpen);
        if (persistKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`collapsible_card_${persistKey}`, JSON.stringify(nextOpen));
          } catch {
            // Ignore storage write errors
          }
        }
      }
      onToggle?.(nextOpen);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Header size spacing
  const headerPaddingClass =
    headerSize === 'sm'
      ? 'p-3 sm:p-4'
      : headerSize === 'lg'
      ? 'p-5 sm:p-6'
      : 'p-4 sm:p-5';

  const titleSizeClass =
    headerSize === 'sm'
      ? 'text-xs sm:text-sm'
      : headerSize === 'lg'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  const isDark = variant === 'dark';

  return (
    <div
      id={cardId}
      className={`rounded-3xl transition-all overflow-hidden ${getVariantStyles(
        variant,
        currentIsOpen
      )} ${className}`}
    >
      {/* Card Header (Accessible Toggle Button) */}
      <div
        id={headerId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={currentIsOpen}
        aria-controls={contentId}
        aria-disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        className={`w-full flex items-center justify-between gap-3 text-left transition-colors select-none ${
          disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        } ${headerPaddingClass} ${
          currentIsOpen && (variant === 'default' || variant === 'elevated' || variant === 'bordered')
            ? 'border-b border-slate-100/90'
            : ''
        } ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Left Chevron (if configured) */}
          {!hideChevron && chevronPosition === 'left' && (
            <motion.div
              animate={{ rotate: currentIsOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={`p-1.5 rounded-xl shrink-0 ${
                isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}

          {/* Optional Icon */}
          {icon && (
            <div
              className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
                isDark
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100/60'
              }`}
            >
              {icon}
            </div>
          )}

          {/* Title & Subtitle / Metadata */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-display font-bold tracking-tight ${titleSizeClass} ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {title}
              </h3>

              {/* Optional Badge */}
              {badge && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${getBadgeStyles(
                    badgeVariant
                  )}`}
                >
                  {badge}
                </div>
              )}
            </div>

            {subtitle && (
              <div
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                } leading-relaxed line-clamp-2`}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right Header Actions & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom Action Buttons (prevent toggle bubbling) */}
          {headerActions && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              {headerActions}
            </div>
          )}

          {/* Right Chevron (default position) */}
          {!hideChevron && chevronPosition === 'right' && (
            <motion.div
              animate={{ rotate: currentIsOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={currentIsOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Card Content Body with Motion Collapse Animation */}
      <AnimatePresence initial={false}>
        {currentIsOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.2, delay: 0.05 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden"
          >
            <div className={`${getContentPaddingStyles(padding)} ${contentClassName}`}>
              {children}
            </div>

            {/* Optional Card Footer */}
            {footer && (
              <div
                className={`p-4 border-t ${
                  isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Multi-Card Group / Accordion Container ---

export interface CollapsibleCardGroupProps {
  id?: string;
  accordion?: boolean;
  allowMultiple?: boolean;
  openIds?: string[];
  defaultOpenIds?: string[];
  onChange?: (openIds: string[]) => void;
  showGroupControls?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/**
 * CollapsibleCardGroup: Wraps multiple CollapsibleCards to manage synchronized states,
 * single-item accordion behavior, or collective Expand All / Collapse All controls.
 */
export const CollapsibleCardGroup: React.FC<CollapsibleCardGroupProps> = ({
  id: explicitId,
  accordion = false,
  allowMultiple = true,
  openIds: controlledOpenIds,
  defaultOpenIds = [],
  onChange,
  showGroupControls = false,
  title,
  description,
  spacing = 'md',
  className = '',
  children,
}) => {
  const generatedId = useId();
  const groupId = explicitId || `collapsible-group-${generatedId.replace(/:/g, '')}`;

  const isControlled = controlledOpenIds !== undefined;

  const [internalOpenIds, setInternalOpenIds] = useState<Set<string>>(
    () => new Set(defaultOpenIds)
  );

  const activeOpenSet = isControlled ? new Set(controlledOpenIds) : internalOpenIds;

  const toggleCard = (cardId: string) => {
    const nextSet = new Set(activeOpenSet);

    if (accordion) {
      if (nextSet.has(cardId)) {
        nextSet.clear();
      } else {
        nextSet.clear();
        nextSet.add(cardId);
      }
    } else {
      if (nextSet.has(cardId)) {
        nextSet.delete(cardId);
      } else {
        if (!allowMultiple) {
          nextSet.clear();
        }
        nextSet.add(cardId);
      }
    }

    if (!isControlled) {
      setInternalOpenIds(nextSet);
    }
    onChange?.(Array.from(nextSet));
  };

  const handleExpandAll = () => {
    // Collect all child IDs if possible, or set a sentinel
    const allCards = document.querySelectorAll(`#${groupId} [id^="collapsible-card-"]`);
    const allIds: string[] = [];
    allCards.forEach((el) => {
      if (el.id) allIds.push(el.id);
    });

    const nextSet = new Set(allIds);
    if (!isControlled) {
      setInternalOpenIds(nextSet);
    }
    onChange?.(allIds);
  };

  const handleCollapseAll = () => {
    const nextSet = new Set<string>();
    if (!isControlled) {
      setInternalOpenIds(nextSet);
    }
    onChange?.([]);
  };

  const spacingClass =
    spacing === 'sm' ? 'space-y-2.5' : spacing === 'lg' ? 'space-y-6' : 'space-y-4';

  return (
    <CollapsibleGroupContext.Provider
      value={{
        openCardIds: activeOpenSet,
        toggleCard,
        isAccordion: accordion,
      }}
    >
      <div id={groupId} className={`space-y-4 ${className}`}>
        {/* Optional Group Title and Global Expand/Collapse Controls */}
        {(title || showGroupControls) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            {title && (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                    {title}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-full">
                    {activeOpenSet.size} Open
                  </span>
                </div>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
              </div>
            )}

            {showGroupControls && !accordion && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  id={`${groupId}-expand-all`}
                  onClick={handleExpandAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Expand All</span>
                </button>

                <button
                  type="button"
                  id={`${groupId}-collapse-all`}
                  onClick={handleCollapseAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Collapse All</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Stack Container */}
        <div className={spacingClass}>{children}</div>
      </div>
    </CollapsibleGroupContext.Provider>
  );
};
