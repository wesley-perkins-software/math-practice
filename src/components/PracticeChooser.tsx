import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChooserGroup, ChooserItem } from '@/config/practiceChoosers';

interface Props {
  items: ChooserItem[];
  /** id of the currently active root-level item (link or group). */
  currentId: string;
  /** When the active page is inside a group's 1–12 grid, the selected number. */
  currentNumber?: number;
}

const GRID_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const PANEL_WIDTH = 232;
const EDGE_MARGIN = 16;

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

/**
 * The shared "Change practice" control — a single trigger, opened from the
 * practice card's own top-right corner (see PracticeWidget's cornerAction),
 * supporting both flat choices (Subtraction) and hierarchical choices
 * (Times Tables/Divide By → a 1–12 grid, via a second view inside the same
 * panel). The card is `overflow-hidden` (rounded corners), so the panel is
 * portaled to <body> and positioned with fixed coordinates computed from
 * the trigger's own rect — otherwise it would be clipped by the card.
 * Because the panel lives outside the trigger's DOM subtree, it also isn't
 * in the trigger's natural tab order, so open() moves focus into it and a
 * small focus trap keeps Tab cycling inside while it's open (see the a11y
 * note in the keydown handler below).
 */
export default function PracticeChooser({ items, currentId, currentNumber }: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<ChooserGroup | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = (refocusTrigger = false) => {
    setOpen(false);
    setActiveGroup(null);
    if (refocusTrigger) triggerRef.current?.focus();
  };

  const positionPanel = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.max(EDGE_MARGIN, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - EDGE_MARGIN));
    setPanelStyle({ position: 'fixed', top: rect.bottom + 6, left, width: PANEL_WIDTH });
  };

  useEffect(() => {
    if (!open) return;
    positionPanel();

    // The panel is portaled to <body>, so it doesn't follow the trigger in
    // DOM/tab order — hand focus in explicitly and trap Tab while open.
    const first = panelRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus();

    const onResize = () => positionPanel();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a, button'));
        if (focusable.length === 0) return;
        const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (activeIndex === -1) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onResume = () => close();

    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    const instruments = document.querySelectorAll<HTMLElement>('[data-practice-instrument]');
    instruments.forEach((el) => {
      el.addEventListener('pointerdown', onResume);
      el.addEventListener('focusin', onResume);
    });

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      instruments.forEach((el) => {
        el.removeEventListener('pointerdown', onResume);
        el.removeEventListener('focusin', onResume);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const panel = (
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      className="z-20 w-56 max-w-[calc(100vw-2rem)] bg-white border border-[#E4E1F5] rounded-xl shadow-[0_8px_24px_rgba(79,70,229,0.16)] py-1.5 font-practice"
      style={panelStyle}
    >
      {activeGroup ? (
        <>
          <div className="flex items-center gap-1 px-2 pb-1.5 mb-1 border-b border-[#F1EFFB]">
            <button
              type="button"
              onClick={() => setActiveGroup(null)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#4F46E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            >
              <ChevronLeft />
              Back
            </button>
            <p className="flex-1 text-center text-xs font-semibold text-[#211D4F] pr-6">{activeGroup.gridTitle}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 px-2 pb-1">
            {GRID_NUMBERS.map((n) => {
              const isCurrent = currentId === activeGroup.id && currentNumber === n;
              return (
                <a
                  key={n}
                  role="menuitem"
                  href={activeGroup.hrefFor(n)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`py-2.5 rounded-lg text-sm font-bold text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 ${
                    isCurrent ? 'bg-[#4F46E5] text-white' : 'bg-[#F5F3FF] text-[#1E1B4B] hover:bg-[#EEF2FF]'
                  }`}
                >
                  {n}
                </a>
              );
            })}
          </div>
        </>
      ) : (
        items.map((item) => {
          const isCurrent = item.id === currentId;
          if (item.type === 'link') {
            return (
              <a
                key={item.id}
                role="menuitem"
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={`block px-3.5 py-2 text-sm rounded-lg mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
                  isCurrent ? 'font-semibold text-[#4F46E5] bg-[#F5F3FF]' : 'text-[#43405C] hover:bg-[#FAF9FE]'
                }`}
              >
                {item.label}
              </a>
            );
          }
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => setActiveGroup(item)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`w-[calc(100%-0.5rem)] mx-1 flex items-center justify-between px-3.5 py-2 text-sm rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
                isCurrent ? 'font-semibold text-[#4F46E5] bg-[#F5F3FF]' : 'text-[#43405C] hover:bg-[#FAF9FE]'
              }`}
            >
              {item.label}
              <ChevronRight />
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <nav aria-label="Change practice" className="font-practice">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex items-center gap-1 text-xs font-semibold text-[#4F46E5] bg-white/95 backdrop-blur-sm cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 shadow-sm border border-[#E4E1F5]"
      >
        Change practice
        <ChevronDown />
      </button>
      {open && createPortal(panel, document.body)}
    </nav>
  );
}
