export interface AdditionNavItem {
  id: string;
  label: string;
  href: string;
}

// Addition-family "Change practice" menu — shared by all three /addition
// pages (see PracticeSwitcher.astro). Kept as data so the menu's contents
// live in exactly one place instead of being retyped per page.
export const ADDITION_NAV_ITEMS: AdditionNavItem[] = [
  { id: '1-digit', label: '1-Digit Addition', href: '/addition/1-digit' },
  { id: '2-digit-no-carrying', label: '2-Digit Addition (No Carry)', href: '/addition/2-digit-no-carrying' },
  { id: '2-digit-with-carrying', label: '2-Digit Addition (Carrying)', href: '/addition/2-digit-with-carrying' },
];
