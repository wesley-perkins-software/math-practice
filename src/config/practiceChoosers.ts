/**
 * Compact nav data for the shared PracticeChooser — deliberately separate
 * from src/engine/presets.ts, whose `label` strings are full page titles
 * (e.g. "2-Digit Subtraction (Without Regrouping)") meant for the H1/SEO
 * surface, not a dropdown. Chooser labels are short and avoid repeating the
 * operation name, per the design brief.
 */

export interface ChooserLink {
  type: 'link';
  id: string;
  label: string;
  href: string;
}

export interface ChooserGroup {
  type: 'group';
  id: string;
  label: string;
  gridTitle: string;
  hrefFor: (n: number) => string;
}

export type ChooserItem = ChooserLink | ChooserGroup;

export const SUBTRACTION_CHOOSER_ITEMS: ChooserItem[] = [
  { type: 'link', id: '1-digit', label: '1-Digit', href: '/subtraction/1-digit' },
  { type: 'link', id: '2-digit-without-regrouping', label: '2-Digit Without Regrouping', href: '/subtraction/2-digit-without-regrouping' },
  { type: 'link', id: '2-digit-with-regrouping', label: '2-Digit With Regrouping', href: '/subtraction/2-digit-with-regrouping' },
];

export const MULTIPLICATION_CHOOSER_ITEMS: ChooserItem[] = [
  { type: 'link', id: 'facts', label: 'Multiplication Facts', href: '/multiplication/facts' },
  { type: 'group', id: 'times-tables', label: 'Times Tables', gridTitle: 'Choose a times table', hrefFor: (n) => `/multiplication/times-tables/${n}` },
];

export const DIVISION_CHOOSER_ITEMS: ChooserItem[] = [
  { type: 'link', id: 'facts', label: 'Division Facts', href: '/division/facts' },
  { type: 'group', id: 'divide-by', label: 'Divide By', gridTitle: 'Choose a divisor', hrefFor: (n) => `/division/divide-by/${n}` },
  { type: 'link', id: 'remainders', label: 'With Remainders', href: '/division/remainders' },
];
