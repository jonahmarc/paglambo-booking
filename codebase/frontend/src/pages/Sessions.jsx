import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'

function fmt(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function toLocalDatetime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'
const LABEL_CLS = 'block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1'

function ManualForm({ onSave, defaultCapacity }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { capacity: defaultCapacity } })
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label className={LABEL_CLS}>Start time</label>
        <input {...register('start_time', { required: true })} type="datetime-local"
          className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>End time (optional)</label>
        <input {...register('end_time')} type="datetime-local"
          className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Capacity</label>
        <input {...register('capacity', { required: true, min: 1 })} type="number"
          className={INPUT_CLS} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
      </div>
    </form>
  )
}

function EditSessionForm({ session, onSave }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      start_time: toLocalDatetime(session.start_time),
      end_time: toLocalDatetime(session.end_time),
      capacity: session.capacity,
    },
  })
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label className={LABEL_CLS}>Start time</label>
        <input {...register('start_time', { required: true })} type="datetime-local"
          className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>End time (optional)</label>
        <input {...register('end_time')} type="datetime-local"
          className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Capacity</label>
        <input {...register('capacity', { required: true, min: 1 })} type="number"
          className={INPUT_CLS} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function BulkForm({ onSave, defaultCapacity }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { capacity: defaultCapacity ?? 1, timezone: 'UTC', duration_minutes: 60 },
  })
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Start date</label>
          <input {...register('start_date', { required: true })} type="date"
            className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>End date</label>
          <input {...register('end_date', { required: true })} type="date"
            className={INPUT_CLS} />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Days of week</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={i} className="flex items-center gap-1 text-sm text-navy/80 dark:text-cream/80 cursor-pointer">
              <input {...register('days_of_week')} type="checkbox" value={i} className="rounded" />
              {d}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>Start time</label>
          <input {...register('start_time', { required: true })} type="time"
            className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Duration (min)</label>
          <input {...register('duration_minutes', { min: 1 })} type="number"
            className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Capacity</label>
          <input {...register('capacity', { required: true, min: 1 })} type="number"
            className={INPUT_CLS} />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Timezone</label>
        <input {...register('timezone')} placeholder="e.g. Asia/Manila"
          className={INPUT_CLS} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {isSubmitting ? 'Generating…' : 'Generate sessions'}
        </button>
      </div>
    </form>
  )
}

function PackageConfigForm({ pkg, onSave }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { required_session_count: pkg.required_session_count },
  })
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label className={LABEL_CLS}>Sessions per booking</label>
        <input {...register('required_session_count', { required: true, min: 1, valueAsNumber: true })} type="number" min={1}
          className={INPUT_CLS} />
        <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">How many sessions a customer picks in one booking</p>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function Sessions() {
  const { id } = useParams()
  const [eventType, setEventType] = useState(null)
  const [sessions, setSessions] = useState([])
  const [timeFilter, setTimeFilter] = useState('active')
  const [modal, setModal] = useState(null) // null | 'manual' | 'bulk' | 'package-config'
  const [editSession, setEditSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const now = useMemo(() => new Date(), [])
  const filteredSessions = sessions.filter(s =>
    timeFilter === 'active' ? new Date(s.start_time) >= now : new Date(s.start_time) < now
  )

  function load() {
    setLoading(true)
    Promise.all([
      api.get(`/api/event-types/${id}`),
      api.get(`/api/event-types/${id}/sessions`),
    ]).then(([et, sess]) => {
      setEventType(et)
      setSessions(sess)
      if (et.kind === 'package') {
        api.post(`/api/event-types/${id}/sessions/sync-pool`, {}).catch(() => {})
      }
    }).catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const kind = eventType?.kind
  const scheduledCount = sessions.filter(s => s.status === 'scheduled').length
  const canAddSession = kind !== 'one_time' || scheduledCount === 0
  const showBulkGenerate = kind !== 'one_time'

  async function handleManual(data) {
    const payload = {
      start_time: new Date(data.start_time).toISOString(),
      end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      capacity: Number(data.capacity),
    }
    await api.post(`/api/event-types/${id}/sessions`, payload)
    setModal(null); load()
  }

  async function handleBulk(data) {
    const days = Array.isArray(data.days_of_week)
      ? data.days_of_week.map(Number)
      : [Number(data.days_of_week)]
    const payload = {
      ...data,
      days_of_week: days,
      capacity: Number(data.capacity),
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : null,
    }
    await api.post(`/api/event-types/${id}/sessions/generate`, payload)
    setModal(null); load()
  }

  async function handleEditSession(session, data) {
    const payload = {
      start_time: new Date(data.start_time).toISOString(),
      end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      capacity: Number(data.capacity),
    }
    await api.patch(`/api/event-types/${id}/sessions/${session.id}`, payload)
    setEditSession(null); load()
  }

  async function handleEditPackage(data) {
    await api.patch(`/api/packages/${eventType.package.id}`, data)
    setModal(null); load()
  }

  async function handleDeactivate(session) {
    if (!confirm('Deactivate this session?')) return
    await api.delete(`/api/event-types/${id}/sessions/${session.id}`)
    load()
  }

  async function handleReactivate(session) {
    await api.post(`/api/event-types/${id}/sessions/${session.id}/reactivate`, {})
    load()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link to="/event-types" className="text-sm text-amber hover:text-amber/70">← Event Types</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream">
          Sessions{eventType ? ` — ${eventType.name}` : ''}
        </h1>
        <div className="flex items-center gap-2">
          {showBulkGenerate && (
            <button onClick={() => setModal('bulk')}
              className="border border-navy/20 dark:border-cream/20 hover:bg-navy/5 dark:hover:bg-cream/5 text-navy dark:text-cream text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              Bulk generate
            </button>
          )}
          {canAddSession ? (
            <button onClick={() => setModal('manual')}
              className="bg-amber hover:bg-amber/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + Add session
            </button>
          ) : (
            <span className="text-xs text-navy/40 dark:text-cream/40 italic">Session already set</span>
          )}
        </div>
      </div>

      {kind === 'package' && eventType?.package && (
        <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-navy dark:text-cream">
            Customers pick <strong>{eventType.package.required_session_count}</strong> session{eventType.package.required_session_count !== 1 ? 's' : ''} per booking
          </p>
          <button onClick={() => setModal('package-config')}
            className="text-xs text-amber hover:text-amber/70 font-medium">
            Edit
          </button>
        </div>
      )}

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      <div className="flex gap-2 mb-3">
        {['active', 'past'].map(f => (
          <button key={f}
            onClick={() => setTimeFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              timeFilter === f
                ? 'bg-amber text-white'
                : 'bg-cream border border-navy/20 text-navy/60 hover:bg-navy/5 dark:bg-navy dark:border-cream/20 dark:text-cream/60 dark:hover:bg-cream/5'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm divide-y divide-navy/10 dark:divide-cream/10">
        {loading && <Spinner />}
        {!loading && filteredSessions.length === 0 && (
          <p className="px-6 py-8 text-sm text-navy/40 dark:text-cream/40 text-center">
            No {timeFilter} sessions.
          </p>
        )}
        {filteredSessions.map(s => (
          <div key={s.id} className="flex items-center gap-4 px-6 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-navy dark:text-cream">{fmt(s.start_time)}</p>
              {s.end_time && <p className="text-xs text-navy/40 dark:text-cream/40">ends {fmt(s.end_time)}</p>}
            </div>
            <p className="text-sm text-navy/50 dark:text-cream/50 w-28 text-center">{s.booked_count}/{s.capacity} booked</p>
            <Badge value={s.status} />
            <Link to={`/event-types/${id}/sessions/${s.id}/attendees`}
              className="text-xs text-amber hover:text-amber/70 font-medium">
              Attendees
            </Link>
            {s.status === 'scheduled' && (
              <>
                <button onClick={() => setEditSession(s)}
                  className="text-xs text-navy/50 hover:text-navy dark:text-cream/50 dark:hover:text-cream font-medium">Edit</button>
                <button onClick={() => handleDeactivate(s)}
                  className="text-xs text-terracotta hover:text-terracotta/70 font-medium">Deactivate</button>
              </>
            )}
            {s.status === 'cancelled' && (
              <button onClick={() => handleReactivate(s)}
                className="text-xs text-navy/50 hover:text-navy dark:text-cream/50 dark:hover:text-cream font-medium">Reactivate</button>
            )}
          </div>
        ))}
      </div>

      {modal === 'manual' && (
        <Modal title="Add session" onClose={() => setModal(null)}>
          <ManualForm onSave={handleManual} defaultCapacity={eventType?.default_capacity ?? 1} />
        </Modal>
      )}
      {modal === 'bulk' && (
        <Modal title="Bulk generate sessions" onClose={() => setModal(null)}>
          <BulkForm onSave={handleBulk} defaultCapacity={eventType?.default_capacity ?? 1} />
        </Modal>
      )}
      {editSession && (
        <Modal title="Edit session" onClose={() => setEditSession(null)}>
          <EditSessionForm session={editSession} onSave={(data) => handleEditSession(editSession, data)} />
        </Modal>
      )}
      {modal === 'package-config' && eventType?.package && (
        <Modal title="Package settings" onClose={() => setModal(null)}>
          <PackageConfigForm pkg={eventType.package} onSave={handleEditPackage} />
        </Modal>
      )}
    </div>
  )
}
