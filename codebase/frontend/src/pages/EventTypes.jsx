import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-gray-400">
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

const KIND_OPTIONS = ['one_time', 'recurring', 'package']

function EventTypeForm({ onSave, defaultValues }) {
  const isEditing = !!defaultValues
  const editKind = defaultValues?.kind

  const formDefaults = defaultValues
    ? { ...defaultValues, sessions_per_booking: defaultValues.package?.required_session_count ?? '' }
    : { kind: 'one_time', default_capacity: 1, requires_payment: true, visibility: 'public' }

  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm({ defaultValues: formDefaults })
  const [formError, setFormError] = useState('')

  const selectedKind = isEditing ? editKind : watch('kind')
  const isPackage = selectedKind === 'package'
  const requiresPayment = watch('requires_payment') !== false

  async function onSubmit(data) {
    setFormError('')
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        default_capacity: Number(data.default_capacity),
        base_price: data.base_price || 0,
        requires_payment: data.requires_payment !== false && data.requires_payment !== 'false',
        visibility: data.visibility || 'public',
        ...(isEditing ? {} : { kind: data.kind }),
      }
      const sessionsPerBooking = isPackage && data.sessions_per_booking
        ? Number(data.sessions_per_booking)
        : null
      await onSave(payload, sessionsPerBooking)
    } catch (e) {
      setFormError(e?.message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input {...register('name', { required: true })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register('description')} rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
          {isEditing ? (
            <p className="text-sm text-gray-700 py-2 capitalize">{editKind.replace(/_/g, ' ')}</p>
          ) : (
            <select {...register('kind', { required: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {KIND_OPTIONS.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default capacity</label>
          <input {...register('default_capacity', { required: true, min: 1 })} type="number" min={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {isPackage && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sessions per booking</label>
          <input {...register('sessions_per_booking', { required: !isEditing, min: 1 })} type="number" min={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">How many sessions a customer picks in one booking</p>
          {errors.sessions_per_booking && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base price
          {!requiresPayment && <span className="text-gray-400 font-normal ml-1">(optional — RSVP event)</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
          <input {...register('base_price', { required: requiresPayment, min: 0 })} type="number" step="0.01"
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
          <select {...register('visibility')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Private events only accessible via direct link</p>
        </div>
        <div className="flex flex-col justify-center pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('requires_payment')} type="checkbox" className="rounded" />
            <span className="text-sm font-medium text-gray-700">Requires payment</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">Uncheck for RSVP-only (no receipt needed)</p>
        </div>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function EventTypes() {
  const navigate = useNavigate()
  const { business } = useAuth()
  const [eventTypes, setEventTypes] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | {edit: et}
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  function copyLink(et) {
    if (!business?.slug) {
      console.log("slug: ", business?.slug);
      alert('Set a booking URL slug in Settings before sharing private event links.')
      return
    }
    const url = `${window.location.origin}/book/${business.slug}/event/${et.id}`
    navigator.clipboard.writeText(url)
    setCopiedId(et.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function load() {
    setLoading(true)
    api.get('/api/event-types?include_inactive=true')
      .then(setEventTypes)
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate(data, sessionsPerBooking) {
    const et = await api.post('/api/event-types', data)
    if (data.kind === 'package' && sessionsPerBooking) {
      await api.post('/api/packages', {
        event_type_id: et.id,
        date_mode: 'customer_picks',
        required_session_count: sessionsPerBooking,
      })
    }
    setModal(null); load()
  }

  async function handleEdit(et, data, sessionsPerBooking) {
    await api.patch(`/api/event-types/${et.id}`, data)
    if (et.kind === 'package') {
      if (et.package?.id && sessionsPerBooking) {
        await api.patch(`/api/packages/${et.package.id}`, { required_session_count: sessionsPerBooking })
      } else if (!et.package && sessionsPerBooking) {
        await api.post('/api/packages', {
          event_type_id: et.id,
          date_mode: 'customer_picks',
          required_session_count: sessionsPerBooking,
        })
      }
    }
    setModal(null); load()
  }

  async function handleToggle(et) {
    await api.patch(`/api/event-types/${et.id}`, { is_active: !et.is_active })
    load()
  }

  async function handleDelete(et) {
    if (!confirm(`Delete "${et.name}" and all its sessions? This cannot be undone.`)) return
    try {
      await api.delete(`/api/event-types/${et.id}`)
      load()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
        <button onClick={() => setModal('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New event type
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {loading && <Spinner />}
        {!loading && eventTypes.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No event types yet. Create one to get started.</p>
        )}
        {eventTypes.map(et => (
          <div key={et.id}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/event-types/${et.id}/sessions`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${et.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{et.name}</p>
                <Badge value={et.kind} />
                {!et.is_active && <Badge value="cancelled" />}
                {!et.requires_payment && (
                  <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">RSVP</span>
                )}
                {et.visibility === 'private' && <LockIcon />}
              </div>
              {et.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{et.description}</p>}
              {et.kind === 'package' && et.package && (
                <p className="text-xs text-gray-400 mt-0.5">{et.package.required_session_count} sessions/booking</p>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-700 w-20 text-right">${Number(et.base_price).toFixed(2)}</p>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {et.visibility === 'private' && (
                <button onClick={() => copyLink(et)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                  {copiedId === et.id ? 'Copied!' : 'Copy link'}
                </button>
              )}
              <button onClick={() => setModal({ edit: et })}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium">Edit</button>
              <button onClick={() => handleToggle(et)}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium">
                {et.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(et)}
                className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal === 'create' && (
        <Modal title="New event type" onClose={() => setModal(null)}>
          <EventTypeForm onSave={handleCreate} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Edit event type" onClose={() => setModal(null)}>
          <EventTypeForm onSave={(data, spb) => handleEdit(modal.edit, data, spb)} defaultValues={modal.edit} />
        </Modal>
      )}
    </div>
  )
}
