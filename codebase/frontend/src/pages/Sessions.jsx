import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

function fmt(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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

function BulkForm({ onSave }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { capacity: 1, timezone: 'UTC', duration_minutes: 60 },
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

export default function Sessions() {
  const { id } = useParams()
  const [eventType, setEventType] = useState(null)
  const [sessions, setSessions] = useState([])
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.get(`/api/event-types/${id}`).then(setEventType).catch(() => setError('Event type not found'))
    api.get(`/api/sessions?event_type_id=${id}`).then(setSessions).catch(() => setError('Failed to load sessions'))
  }
  useEffect(load, [id])

  async function handleManual(data) {
    const payload = {
      start_time: new Date(data.start_time).toISOString(),
      end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      capacity: Number(data.capacity),
    }
    await api.post(`/api/sessions?event_type_id=${id}`, payload)
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
    await api.post(`/api/sessions/generate?event_type_id=${id}`, payload)
    setModal(null); load()
  }

  async function handleCancel(session) {
    if (!confirm('Cancel this session?')) return
    await api.delete(`/api/sessions/${session.id}?event_type_id=${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link to="/event-types" className="text-sm text-blue-600 hover:text-blue-800">← Event Types</Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Sessions{eventType ? ` — ${eventType.name}` : ''}
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setModal('bulk')}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg">
            Bulk generate
          </button>
          <button onClick={() => setModal('manual')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add session
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {sessions.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No sessions yet.</p>
        )}
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-4 px-6 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{fmt(s.start_time)}</p>
              {s.end_time && <p className="text-xs text-gray-400">ends {fmt(s.end_time)}</p>}
            </div>
            <p className="text-sm text-gray-600 w-24 text-center">Cap: {s.capacity}</p>
            <Badge value={s.status} />
            {s.status === 'scheduled' && (
              <button onClick={() => handleCancel(s)}
                className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
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
          <BulkForm onSave={handleBulk} />
        </Modal>
      )}
    </div>
  )
}
