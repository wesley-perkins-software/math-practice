const LEVELS = [
  {
    href: '/addition-practice/1-digit',
    label: '1-Digit Addition',
    description: 'Single-digit facts, 1–9, no carrying',
    color: '#3B82F6',
  },
  {
    href: '/addition-practice/2-digit',
    label: '2-Digit Addition',
    description: 'Two-digit numbers, no carrying required',
    color: '#3B82F6',
  },
  {
    href: '/addition-practice/2-digit-carrying',
    label: 'Addition with Carrying',
    description: 'Every problem requires carrying and regrouping',
    color: '#3B82F6',
  },
];

export default function AdditionPracticeHub() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {LEVELS.map(({ href, label, description }) => (
        <a
          key={href}
          href={href}
          className="block bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#3B82F6] hover:shadow-md transition-all group"
        >
          <div className="font-semibold text-[#1E293B] group-hover:text-[#3B82F6] transition-colors">
            {label}
          </div>
          <div className="text-sm text-[#64748B] mt-1">{description}</div>
          <div className="mt-3 text-sm font-semibold text-[#3B82F6]">Practice →</div>
        </a>
      ))}
    </div>
  );
}
