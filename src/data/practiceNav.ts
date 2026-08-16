/**
 * Single source of truth for practice-switching link text, shared by the
 * global header's operation dropdowns and each page's below-widget
 * "Choose another ... practice" local chooser. Hand-authored rather than
 * derived from `engine/presets.ts` — preset `label`s are phrased for the
 * progress dashboard/engine config, not for nav copy (inconsistent
 * capitalization/parenthetical style), and presets mix in engine fields
 * irrelevant here. Hrefs below were cross-checked against presets.ts'
 * `path` fields and the actual page routes at write time; there is no
 * automated link-checker in this repo to catch future drift.
 */

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface NavLink {
  label: string;
  href: string;
}

export interface OperationMenu {
  /** The operation's canonical overview/hub page. */
  hub: NavLink;
  /** Flat practice-variant links (excludes number-parameterized grids below). */
  items: NavLink[];
  /** Present only for operations with a 1–12 parameterized picker. */
  grid?: {
    label: string;
    basePath: string;
    max: number;
  };
}

export const OPERATION_MENUS: Record<Operation, OperationMenu> = {
  addition: {
    hub: { label: 'Addition Practice', href: '/addition' },
    items: [
      { label: '1-Digit', href: '/addition/1-digit' },
      { label: '2-Digit Without Regrouping', href: '/addition/2-digit-without-regrouping' },
      { label: '2-Digit With Regrouping', href: '/addition/2-digit-with-regrouping' },
    ],
  },
  subtraction: {
    hub: { label: 'Subtraction Practice', href: '/subtraction' },
    items: [
      { label: '1-Digit', href: '/subtraction/1-digit' },
      { label: '2-Digit Without Regrouping', href: '/subtraction/2-digit-without-regrouping' },
      { label: '2-Digit With Regrouping', href: '/subtraction/2-digit-with-regrouping' },
    ],
  },
  multiplication: {
    hub: { label: 'Multiplication Practice', href: '/multiplication' },
    items: [
      { label: 'Multiplication Facts', href: '/multiplication/facts' },
    ],
    grid: { label: 'Times Tables', basePath: '/multiplication/times-tables', max: 12 },
  },
  division: {
    hub: { label: 'Division Practice', href: '/division' },
    items: [
      { label: 'Division Facts', href: '/division/facts' },
      { label: 'Division With Remainders', href: '/division/remainders' },
    ],
    grid: { label: 'Divide By', basePath: '/division/divide-by', max: 12 },
  },
};

/** Builds the 1..max number links for a parameterized picker (Times Tables, Divide By). */
export function numberGridLinks(basePath: string, max: number): { n: number; href: string }[] {
  return Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    return { n, href: `${basePath}/${n}` };
  });
}
