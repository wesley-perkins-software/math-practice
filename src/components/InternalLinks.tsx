interface LinkItem {
  href: string;
  label: string;
  description?: string;
}

interface Props {
  title?: string;
  links: LinkItem[];
  /**
   * Pilot-scope-only override (see [table].astro / [divisor].astro's
   * `bodyTextClass`/`listTextClass`): renders card descriptions in black
   * instead of the default `text-[#64748B]`. Defaults to false so every
   * other page using this component is unchanged. NOT the intended
   * long-term mechanism for sitewide typography — see the flag in
   * [table].astro for the planned shared-typography follow-up.
   */
  darkText?: boolean;
}

export default function InternalLinks({ title = 'Related Practice', links, darkText = false }: Props) {
  if (links.length === 0) return null;

  return (
    <nav aria-label={title} className="mt-10">
      <h2 className="text-lg font-semibold text-[#1E1B4B] mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block bg-white border border-[#E0E7FF] rounded-xl p-4 hover:border-[#4F46E5] hover:shadow-[0_2px_12px_rgba(79,70,229,0.12)] transition-all group"
          >
            <div className="font-semibold text-sm text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors">
              {link.label}
            </div>
            {link.description && (
              <div className={`text-xs mt-1 ${darkText ? 'text-black' : 'text-[#64748B]'}`}>{link.description}</div>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
