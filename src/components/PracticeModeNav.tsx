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
 */
export default function PracticeModeNav({ items, activeId, ariaLabel, onItemClick, extra }: Props) {
  return (
    <div className="w-full max-w-lg mx-auto mb-3">
      <nav aria-label={ariaLabel} className="flex gap-1 p-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl">
        {items.map(({ id, label, href }) => {
          const isActive = id === activeId;
          return (
            <a
              key={id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onItemClick?.(id)}
              className={`flex-1 py-2.5 flex flex-col items-center justify-center text-sm font-semibold rounded-lg transition-colors duration-150 leading-snug ${
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
