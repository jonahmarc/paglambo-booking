import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../api/client'

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    api.get('/api/business').then(reset).catch(() => setError('Failed to load settings'))
  }, [reset])

  async function onSubmit(data) {
    setError(''); setSaved(false)
    try {
      await api.patch('/api/business', {
        name: data.name,
        paypal_username: data.paypal_username || null,
        wise_username: data.wise_username || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-100">
          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">Business name</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">PayPal username</p>
              <p className="text-xs text-gray-500 mt-0.5">Shown to customers at checkout</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('paypal_username')}
                placeholder="e.g. yourbusiness@paypal.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">Wise username</p>
              <p className="text-xs text-gray-500 mt-0.5">Shown to customers at checkout</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('wise_username')}
                placeholder="e.g. @yourbusiness"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">Booking key</p>
              <p className="text-xs text-gray-500 mt-0.5">Embed this in your booking widget</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('booking_key')}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-default"
              />
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-xl">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Saved</p>}
            {!error && !saved && <span />}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
