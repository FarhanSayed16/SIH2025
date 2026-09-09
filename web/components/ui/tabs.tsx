/**
 * Accessible tablist helper for feature pages (WB2).
 */

'use client';

import { useId, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  panel: ReactNode;
}

interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  listLabel?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
  listLabel = 'Sections',
}: TabsProps<T>) {
  const baseId = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((t) => t.id === value);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      next = (index + 1) % items.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      next = (index - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      next = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      next = items.length - 1;
    } else {
      return;
    }
    onChange(items[next].id);
    const btn = document.getElementById(`${baseId}-tab-${items[next].id}`);
    btn?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={listLabel}
        className="flex flex-wrap gap-1 border-b border-gray-200"
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={`min-h-11 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                selected
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${baseId}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== value}
          className="pt-4"
        >
          {item.id === value ? item.panel : null}
        </div>
      ))}
    </div>
  );
}
