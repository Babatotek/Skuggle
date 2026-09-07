import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
  priority?: 'primary' | 'secondary' | 'optional';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  pageSize?: number;
  onRowClick?: (row: T) => void;
  className?: string;
  tableClassName?: string;
  rowClassName?: (row: T, index: number) => string;
  error?: React.ReactNode;
  onRetry?: () => void;
  mobileRenderer?: (row: T) => React.ReactNode;
  /** Viewport below which `mobileRenderer` replaces the table. Defaults to `sm` (640px). */
  cardBreakpoint?: 'sm' | 'md' | 'lg';
  page?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  caption?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search query or filters.',
  emptyAction,
  pageSize = 10,
  onRowClick,
  className = '',
  tableClassName = '',
  rowClassName,
  error,
  onRetry,
  mobileRenderer,
  cardBreakpoint = 'sm',
  page,
  totalItems,
  onPageChange,
  caption,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    if (sortKey === column.key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(column.key);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      let valA = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey];
      let valB = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder, columns]);

  const activePage = page ?? currentPage;
  const itemCount = totalItems ?? sortedData.length;
  const totalPages = Math.ceil(itemCount / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (page !== undefined) return sortedData;
    const start = (activePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, activePage, pageSize, page]);
  const changePage = (nextPage: number) => onPageChange ? onPageChange(nextPage) : setCurrentPage(nextPage);

  return (
    <div className={`ds-surface w-full overflow-hidden ${className}`} data-density="compact">
      {isLoading && <span className="sr-only" role="status" aria-label="Loading records">Loading records</span>}
      {mobileRenderer && !isLoading && !error && <ul className={`divide-y divide-[var(--color-border-default)] ${cardBreakpoint === 'lg' ? 'lg:hidden' : cardBreakpoint === 'md' ? 'md:hidden' : 'sm:hidden'}`}>{paginatedData.map((row, index) => <li key={keyExtractor(row, index)}>{mobileRenderer(row)}</li>)}</ul>}
      <div className={`w-full overflow-x-auto ${mobileRenderer ? (cardBreakpoint === 'lg' ? 'hidden lg:block' : cardBreakpoint === 'md' ? 'hidden md:block' : 'hidden sm:block') : ''}`}>
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75">
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={sortKey === column.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : column.sortable ? 'none' : undefined}
                  className={`py-3.5 px-4 text-xs font-semibold text-[var(--color-text-secondary)] select-none ${
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${column.className || ''}`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      column.align === 'center'
                        ? 'justify-center'
                        : column.align === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    {column.sortable ? <button type="button" onClick={() => handleSort(column)} className="ds-focus-ring inline-flex items-center gap-1.5 rounded-sm hover:text-[var(--color-text-primary)]"><span>{column.header}</span>
                      <span aria-hidden="true" className="text-[var(--color-text-muted)] shrink-0">
                        {sortKey === column.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                        )}
                      </span></button> : <span>{column.header}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
            {error ? <tr><td colSpan={columns.length} className="p-8 text-center"><div role="alert" className="text-sm text-[var(--color-status-negative-text)]">{error}</div>{onRetry && <Button className="mt-3" variant="secondary" onClick={onRetry}>Try again</Button>}</td></tr> : isLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  {columns.map((col, cIndex) => (
                    <td key={`skeleton-cell-${cIndex}`} className="py-4 px-4">
                      <div className="h-4 bg-slate-200/70 rounded-md w-3/4 max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(row); } }}
                  className={`transition-colors duration-100 ${
                    onRowClick ? 'cursor-pointer hover:bg-indigo-50/30' : 'hover:bg-slate-50/60'
                  } ${rowClassName ? rowClassName(row, index) : ''}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`py-3.5 px-4 align-middle ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      } ${column.className || ''}`}
                    >
                      {column.accessor
                        ? column.accessor(row)
                        : (row as Record<string, unknown>)[column.key] !== undefined
                        ? String((row as Record<string, unknown>)[column.key])
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && itemCount > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="font-medium">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {Math.min((activePage - 1) * pageSize + 1, itemCount)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(activePage * pageSize, itemCount)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{itemCount}</span> results
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={activePage === 1}
                onClick={() => changePage(Math.max(activePage - 1, 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-700">
                {activePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={activePage === totalPages}
                onClick={() => changePage(Math.min(activePage + 1, totalPages))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
