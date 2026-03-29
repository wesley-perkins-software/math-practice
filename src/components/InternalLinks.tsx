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
      <h2 className="text-lg font-semibold text-[#1E293B] mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block bg-white border border-[#E2E8F0] rounded-xl p-4 hover:border-[#3B82F6] hover:shadow-sm transition-all group"
          >
            <div className="font-semibold text-sm text-[#1E293B] group-hover:text-[#3B82F6] transition-colors">
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
