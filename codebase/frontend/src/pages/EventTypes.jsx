import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-navy/40 dark:text-cream/40">
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

const KIND_OPTIONS = ['one_time', 'recurring', 'package']

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'

function EventTypeForm({ onSave, defaultValues }) {
  const isEditing = !!defaultValues
  const editKind = defaultValues?.kind

  const formDefaults = defaultValues
    ? { ...defaultValues, sessions_per_booking: defaultValues.package?.required_session_count ?? '' }
    : { kind: 'one_time', default_capacity: 1, requires_payment: true, visibility: 'public', location: '' }

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
        location: data.location?.trim() || null,
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
        <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Name</label>
        <input {...register('name', { required: true })}
          className={INPUT_CLS} />
        {errors.name && <p className="text-xs text-terracotta mt-1">Required</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Description</label>
        <textarea {...register('description')} rows={3}
          className={INPUT_CLS} />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Location</label>
        <input {...register('location')} placeholder="e.g. Studio A, 2nd Floor · 123 Main St"
          className={INPUT_CLS} />
        <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">Shown on the booking page event card (optional)</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Kind</label>
          {isEditing ? (
            <p className="text-sm text-navy dark:text-cream py-2 capitalize">{editKind.replace(/_/g, ' ')}</p>
          ) : (
            <select {...register('kind', { required: true })}
              className={INPUT_CLS}>
              {KIND_OPTIONS.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Default capacity</label>
          <input {...register('default_capacity', { required: true, min: 1 })} type="number" min={1}
            className={INPUT_CLS} />
        </div>
      </div>
      {isPackage && (
        <div>
          <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Sessions per booking</label>
          <input {...register('sessions_per_booking', { required: !isEditing, min: 1 })} type="number" min={1}
            className={INPUT_CLS} />
          <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">How many sessions a customer picks in one booking</p>
          {errors.sessions_per_booking && <p className="text-xs text-terracotta mt-1">Required</p>}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
          Base price
          {!requiresPayment && <span className="text-navy/40 dark:text-cream/40 font-normal ml-1">(optional — RSVP event)</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-sm text-navy/40 dark:text-cream/40">$</span>
          <input {...register('base_price', { required: requiresPayment, min: 0 })} type="number" step="0.01"
            className="w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Visibility</label>
          <select {...register('visibility')}
            className={INPUT_CLS}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">Private events only accessible via direct link</p>
        </div>
        <div className="flex flex-col justify-center pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('requires_payment')} type="checkbox" className="rounded" />
            <span className="text-sm font-medium text-navy/80 dark:text-cream/80">Requires payment</span>
          </label>
          <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">Uncheck for RSVP-only (no receipt needed)</p>
        </div>
      </div>
      {formError && <p className="text-sm text-terracotta">{formError}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isSubmitting}
          className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function PhotoGallery({ eventTypeId, bookingKey }) {
  const [photos, setPhotos] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function loadPhotos() {
    api.get(`/api/event-types/${eventTypeId}/photos`).then(setPhotos).catch(() => setPhotos([]))
  }
  useEffect(loadPhotos, [eventTypeId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.postForm(`/api/event-types/${eventTypeId}/photos`, fd)
      loadPhotos()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(photoId) {
    try {
      await api.delete(`/api/event-types/${eventTypeId}/photos/${photoId}`)
      loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleMove(photo, direction) {
    const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(p => p.id === photo.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swap = sorted[swapIdx]
    await api.patch(`/api/event-types/${eventTypeId}/photos/${photo.id}`, { sort_order: swap.sort_order })
    await api.patch(`/api/event-types/${eventTypeId}/photos/${swap.id}`, { sort_order: photo.sort_order })
    loadPhotos()
  }

  if (photos === null) return <Spinner />

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="border-t border-navy/10 dark:border-cream/10 pt-5 mt-2">
      <p className="text-sm font-medium text-navy/80 dark:text-cream/80 mb-3">Photos</p>

      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {sorted.map((photo, idx) => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-navy/10 dark:border-cream/10 aspect-video bg-navy/5 dark:bg-cream/5">
              <img
                src={`/api/public/${bookingKey}/event-types/${eventTypeId}/photos/${photo.id}`}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(photo, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 text-white text-xs"
                  title="Move left"
                >←</button>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="p-1 rounded bg-terracotta/80 hover:bg-terracotta text-white text-xs"
                  title="Delete"
                >✕</button>
                <button
                  type="button"
                  onClick={() => handleMove(photo, 'down')}
                  disabled={idx === sorted.length - 1}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 text-white text-xs"
                  title="Move right"
                >→</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className={`cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${uploading ? 'opacity-50 cursor-not-allowed border-navy/10 dark:border-cream/10 text-navy/40 dark:text-cream/40' : 'border-navy/20 dark:border-cream/20 text-navy dark:text-cream hover:border-amber hover:text-amber'}`}>
          {uploading ? 'Uploading…' : '+ Add photo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        <span className="text-xs text-navy/40 dark:text-cream/40">JPEG, PNG or WEBP · max 10 MB</span>
      </div>
      {error && <p className="text-xs text-terracotta mt-2">{error}</p>}
    </div>
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
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream">Event Types</h1>
        <button onClick={() => setModal('create')}
          className="bg-amber hover:bg-amber/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New event type
        </button>
      </div>

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm divide-y divide-navy/10 dark:divide-cream/10">
        {loading && <Spinner />}
        {!loading && eventTypes.length === 0 && (
          <p className="px-6 py-8 text-sm text-navy/40 dark:text-cream/40 text-center">No event types yet. Create one to get started.</p>
        )}
        {eventTypes.map(et => (
          <div key={et.id}
            className="flex items-center gap-4 px-6 py-4 hover:bg-navy/5 dark:hover:bg-cream/5 cursor-pointer transition-colors"
            onClick={() => navigate(`/event-types/${et.id}/sessions`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${et.is_active ? 'text-navy dark:text-cream' : 'text-navy/30 dark:text-cream/30 line-through'}`}>{et.name}</p>
                <Badge value={et.kind} />
                {!et.is_active && <Badge value="cancelled" />}
                {!et.requires_payment && (
                  <span className="text-xs font-medium bg-terracotta/10 text-terracotta px-2 py-0.5 rounded">RSVP</span>
                )}
                {et.visibility === 'private' && <LockIcon />}
              </div>
              {et.description && <p className="text-xs text-navy/40 dark:text-cream/40 mt-0.5 truncate">{et.description}</p>}
              {et.kind === 'package' && et.package && (
                <p className="text-xs text-navy/40 dark:text-cream/40 mt-0.5">{et.package.required_session_count} sessions/booking</p>
              )}
            </div>
            <p className="text-sm font-semibold text-navy dark:text-cream w-20 text-right">${Number(et.base_price).toFixed(2)}</p>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {et.visibility === 'private' && (
                <button onClick={() => copyLink(et)}
                  className="text-xs text-amber hover:text-amber/70 font-medium">
                  {copiedId === et.id ? 'Copied!' : 'Copy link'}
                </button>
              )}
              <button onClick={() => setModal({ edit: et })}
                className="text-xs text-navy/50 hover:text-navy dark:text-cream/50 dark:hover:text-cream font-medium">Edit</button>
              <button onClick={() => handleToggle(et)}
                className="text-xs text-navy/50 hover:text-navy dark:text-cream/50 dark:hover:text-cream font-medium">
                {et.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(et)}
                className="text-xs text-terracotta hover:text-terracotta/70 font-medium">Delete</button>
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
          {business?.booking_key && (
            <PhotoGallery eventTypeId={modal.edit.id} bookingKey={business.booking_key} />
          )}
        </Modal>
      )}
    </div>
  )
}
