interface ModeNavItem {
  id: string;
  label: React.ReactNode;
  href: string;
}

interface Props {
  items: ModeNavItem[];
  activeId: string;
  ariaLabel: string;
  onItemClick?: (id: string) => void;
  extra?: React.ReactNode;
}

/**
 * Page-level mode/difficulty selector. Each item is a real page navigation
 * (distinct URL), so this is a labeled nav with aria-current="page" —
 * not a tablist, which implies a same-page panel-switching contract this
 * component doesn't implement.
 *
 * The /addition/1-digit prototype no longer uses this component — its mode
 * switcher moved to a plain static H1-row pattern in the .astro page itself
 * (see addition/1-digit.astro), since the goal there is a per-page pattern
 * other pages can copy without needing a React component at all. This stays
 * as the classic tab tray used by every other practice page.
 */
export default function PracticeModeNav({ items, activeId, ariaLabel, onItemClick, extra }: Props) {
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
