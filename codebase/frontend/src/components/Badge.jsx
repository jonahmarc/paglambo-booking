const COLOURS = {
  pending:          'bg-amber/15 text-amber',
  awaiting_payment: 'bg-terracotta/15 text-terracotta',
  confirmed:        'bg-green-500/15 text-green-600 dark:text-green-400',
  rejected:         'bg-terracotta/15 text-terracotta',
  scheduled:        'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80',
  cancelled:        'bg-navy/10 text-navy/50 dark:bg-cream/10 dark:text-cream/40',
  one_time:         'bg-amber/10 text-amber',
  recurring:        'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80',
  package:          'bg-terracotta/10 text-terracotta',
}

export default function Badge({ value }) {
  const colour = COLOURS[value] ?? 'bg-navy/10 text-navy/70 dark:bg-cream/10 dark:text-cream/70'
  const label = value?.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colour}`}>
      {label}
    </span>
  )
}
