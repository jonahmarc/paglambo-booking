export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-cream dark:bg-navy rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10 dark:border-cream/10">
          <h2 className="text-lg font-semibold text-navy dark:text-cream">{title}</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy dark:text-cream/40 dark:hover:text-cream text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1">{children}</div>
      </div>
    </div>
  )
}
