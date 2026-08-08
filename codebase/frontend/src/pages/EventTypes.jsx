import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

const KIND_OPTIONS = ['one_time', 'recurring', 'package']

function EventTypeForm({ onSave, defaultValues }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({ defaultValues })

  async function onSubmit(data) {
    await onSave({ ...data, base_price: data.base_price, default_capacity: Number(data.default_capacity) })
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
          <select {...register('kind', { required: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!!defaultValues}>
            {KIND_OPTIONS.map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default capacity</label>
          <input {...register('default_capacity', { required: true, min: 1 })} type="number" defaultValue={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Base price</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
          <input {...register('base_price', { required: true, min: 0 })} type="number" step="0.01"
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
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
  const [eventTypes, setEventTypes] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | {edit: et}
  const [error, setError] = useState('')

  function load() {
    api.get('/api/event-types?include_inactive=true').then(setEventTypes).catch(() => setError('Failed to load'))
  }
  useEffect(load, [])

  async function handleCreate(data) {
    await api.post('/api/event-types', data)
    setModal(null); load()
  }

  async function handleEdit(et, data) {
    await api.patch(`/api/event-types/${et.id}`, data)
    setModal(null); load()
  }

  async function handleToggle(et) {
    await api.patch(`/api/event-types/${et.id}`, { is_active: !et.is_active })
    load()
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
        {eventTypes.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No event types yet. Create one to get started.</p>
        )}
        {eventTypes.map(et => (
          <div key={et.id} className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${et.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{et.name}</p>
                <Badge value={et.kind} />
                {!et.is_active && <Badge value="cancelled" />}
              </div>
              {et.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{et.description}</p>}
            </div>
            <p className="text-sm font-semibold text-gray-700 w-20 text-right">${Number(et.base_price).toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <Link to={`/event-types/${et.id}/sessions`}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Sessions
              </Link>
              <button onClick={() => setModal({ edit: et })}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium">Edit</button>
              <button onClick={() => handleToggle(et)}
                className="text-xs text-gray-400 hover:text-red-600 font-medium">
                {et.is_active ? 'Deactivate' : 'Activate'}
              </button>
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
          <EventTypeForm onSave={(data) => handleEdit(modal.edit, data)} defaultValues={modal.edit} />
        </Modal>
      )}
    </div>
  )
}
