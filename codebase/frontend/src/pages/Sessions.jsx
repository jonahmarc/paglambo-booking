import { useEffect, useState } from 'react'
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

function ManualForm({ onSave, defaultCapacity }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { capacity: defaultCapacity } })
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
        <input {...register('start_time', { required: true })} type="datetime-local"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End time (optional)</label>
        <input {...register('end_time')} type="datetime-local"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input {...register('capacity', { required: true, min: 1 })} type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
        <input {...register('start_time', { required: true })} type="datetime-local"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End time (optional)</label>
        <input {...register('end_time')} type="datetime-local"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input {...register('capacity', { required: true, min: 1 })} type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <input {...register('start_date', { required: true })} type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <input {...register('end_date', { required: true })} type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Days of week</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={i} className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
              <input {...register('days_of_week')} type="checkbox" value={i} className="rounded" />
              {d}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
          <input {...register('start_time', { required: true })} type="time"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
          <input {...register('duration_minutes', { min: 1 })} type="number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <input {...register('capacity', { required: true, min: 1 })} type="number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
        <input {...register('timezone')} placeholder="e.g. Asia/Manila"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Sessions per booking</label>
        <input {...register('required_session_count', { required: true, min: 1, valueAsNumber: true })} type="number" min={1}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-400 mt-1">How many sessions a customer picks in one booking</p>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
  const [modal, setModal] = useState(null) // null | 'manual' | 'bulk' | 'package-config'
  const [editSession, setEditSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        <Link to="/event-types" className="text-sm text-blue-600 hover:text-blue-800">← Event Types</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Sessions{eventType ? ` — ${eventType.name}` : ''}
        </h1>
        <div className="flex items-center gap-2">
          {showBulkGenerate && (
            <button onClick={() => setModal('bulk')}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg">
              Bulk generate
            </button>
          )}
          {canAddSession ? (
            <button onClick={() => setModal('manual')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              + Add session
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">Session already set</span>
          )}
        </div>
      </div>

      {kind === 'package' && eventType?.package && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Customers pick <strong>{eventType.package.required_session_count}</strong> session{eventType.package.required_session_count !== 1 ? 's' : ''} per booking
          </p>
          <button onClick={() => setModal('package-config')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Edit
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {loading && <Spinner />}
        {!loading && sessions.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No sessions yet.</p>
        )}
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-4 px-6 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{fmt(s.start_time)}</p>
              {s.end_time && <p className="text-xs text-gray-400">ends {fmt(s.end_time)}</p>}
            </div>
            <p className="text-sm text-gray-600 w-28 text-center">{s.booked_count}/{s.capacity} booked</p>
            <Badge value={s.status} />
            {s.status === 'scheduled' && (
              <>
                <button onClick={() => setEditSession(s)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium">Edit</button>
                <button onClick={() => handleDeactivate(s)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium">Deactivate</button>
              </>
            )}
            {s.status === 'cancelled' && (
              <button onClick={() => handleReactivate(s)}
                className="text-xs text-green-600 hover:text-green-800 font-medium">Reactivate</button>
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
