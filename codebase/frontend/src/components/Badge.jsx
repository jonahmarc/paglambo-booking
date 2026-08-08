const COLOURS = {
  pending:          'bg-yellow-100 text-yellow-800',
  awaiting_payment: 'bg-orange-100 text-orange-800',
  confirmed:        'bg-green-100 text-green-800',
  rejected:         'bg-red-100 text-red-800',
  scheduled:        'bg-blue-100 text-blue-800',
  cancelled:        'bg-gray-100 text-gray-600',
  one_time:         'bg-purple-100 text-purple-800',
  recurring:        'bg-indigo-100 text-indigo-800',
  package:          'bg-teal-100 text-teal-800',
}

export default function Badge({ value }) {
  const colour = COLOURS[value] ?? 'bg-gray-100 text-gray-700'
  const label = value?.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colour}`}>
      {label}
    </span>
  )
}
