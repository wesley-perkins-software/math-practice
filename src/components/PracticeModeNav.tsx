interface ModeNavItem {
  id: string;
  label: React.ReactNode;
  href: string;
  /** Plain-text form used by the compact prototype header/popover (label may be a multi-line fragment for the classic tab tray). */
  menuLabel?: string;
}

interface Props {
  items: ModeNavItem[];
  activeId: string;
  ariaLabel: string;
  onItemClick?: (id: string) => void;
  extra?: React.ReactNode;
  /** 'prototype' opts into the redesigned surface (currently /addition/1-digit only). */
  variant?: 'classic' | 'prototype';
}

/**
 * Page-level mode/difficulty selector. Each item is a real page navigation
 * (distinct URL), so this is a labeled nav with aria-current="page" —
 * not a tablist, which implies a same-page panel-switching contract this
 * component doesn't implement.
 */
export default function PracticeModeNav({ items, activeId, ariaLabel, onItemClick, extra, variant = 'classic' }: Props) {
  const isPrototype = variant === 'prototype';

  if (isPrototype) {
    const active = items.find((i) => i.id === activeId);
    // Compact, in-surface header: current mode is stated plainly; sibling
    // modes are hidden behind "Change" until asked for, so they never
    // compete visually with the arithmetic below. Native <details> keeps
    // this keyboard/screen-reader operable without extra ARIA wiring, and
    // the panel is positioned absolutely so opening it never pushes the
    // practice surface's own layout (same spatial-stability principle as
    // the feedback region).
    return (
      <div className="font-practice flex items-center justify-between w-full">
        <span className="text-sm font-semibold text-[#211D4F]">{active?.menuLabel ?? active?.label}</span>
        <details className="relative">
          <summary className="list-none flex items-center gap-1 text-sm font-semibold text-[#4F46E5] cursor-pointer select-none px-2 py-1 -mr-2 rounded-lg hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1">
            Change
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <nav
            aria-label={ariaLabel}
            className="absolute right-0 top-full mt-1.5 z-20 w-56 bg-white border border-[#E4E1F5] rounded-xl shadow-[0_8px_24px_rgba(79,70,229,0.16)] py-1.5"
          >
            {items.map(({ id, href, menuLabel, label }) => {
              const isActive = id === activeId;
              return (
                <a
                  key={id}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onItemClick?.(id)}
                  className={`block px-3.5 py-2 text-sm transition-colors ${
                    isActive ? 'font-semibold text-[#4F46E5] bg-[#F5F3FF]' : 'text-[#43405C] hover:bg-[#FAF9FE]'
                  }`}
                >
                  {menuLabel ?? label}
                </a>
              );
            })}
          </nav>
        </details>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mb-3 max-w-lg">
      <nav aria-label={ariaLabel} className="flex gap-1 p-1 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF]">
        {items.map(({ id, label, href }) => {
          const isActive = id === activeId;
          return (
            <a
              key={id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onItemClick?.(id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center text-sm font-semibold rounded-lg transition-colors duration-150 leading-tight ${
                isActive
                  ? 'bg-white text-[#4F46E5] shadow-sm border-b-2 border-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#4338CA] hover:bg-white/60'
              }`}
            >
              {label}
            </a>
          );
        })}
      </nav>
      {extra}
    </div>
  );
}
