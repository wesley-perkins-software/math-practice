interface LinkItem {
  href: string;
  label: string;
  description?: string;
}

interface Props {
  title?: string;
  links: LinkItem[];
}

export default function InternalLinks({ title = 'Related Practice', links }: Props) {
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
              <div className="text-xs text-[#64748B] mt-1">{link.description}</div>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
