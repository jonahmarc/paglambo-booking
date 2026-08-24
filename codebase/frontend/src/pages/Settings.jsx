import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { api } from '../api/client'

const BOOKING_BASE = `${window.location.origin}/book/`

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'

function HeaderImageUploader({ bookingKey, hasImage: initialHasImage }) {
  const [hasImage, setHasImage] = useState(initialHasImage)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.postForm('/api/business/header-image', fd)
      setHasImage(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemove() {
    setUploading(true); setError('')
    try {
      await api.delete('/api/business/header-image')
      setHasImage(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start border-t border-navy/10 dark:border-cream/10">
      <div>
        <p className="text-sm font-medium text-navy dark:text-cream">Booking page header</p>
        <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">Banner image shown at the top of your public booking page</p>
      </div>
      <div className="col-span-2 space-y-3">
        {hasImage && bookingKey && (
          <div className="space-y-2">
            <img
              src={`/api/public/${bookingKey}/header-image`}
              alt="Booking page header"
              className="w-full max-h-36 object-cover border border-navy/10 dark:border-cream/10 rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs text-terracotta hover:text-terracotta/70 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className={`cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${uploading ? 'opacity-50 cursor-not-allowed border-navy/10 dark:border-cream/10 text-navy/40 dark:text-cream/40' : 'border-navy/20 dark:border-cream/20 text-navy dark:text-cream hover:border-amber hover:text-amber'}`}>
            {uploading ? 'Uploading…' : hasImage ? 'Replace image' : 'Upload image'}
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
        {error && <p className="text-xs text-terracotta">{error}</p>}
      </div>
    </div>
  )
}

function QrUploader({ method, label, bookingKey, hasQr: initialHasQr }) {
  const [hasQr, setHasQr] = useState(initialHasQr)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.postForm(`/api/business/qr/${method}`, fd)
      setHasQr(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemove() {
    setUploading(true); setError('')
    try {
      await api.delete(`/api/business/qr/${method}`)
      setHasQr(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start border-t border-navy/10 dark:border-cream/10">
      <div>
        <p className="text-sm font-medium text-navy dark:text-cream">{label} QR code</p>
        <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">Shown to customers at checkout alongside account details</p>
      </div>
      <div className="col-span-2 space-y-3">
        {hasQr && bookingKey && (
          <div className="flex items-start gap-4">
            <img
              src={`/api/public/${bookingKey}/qr/${method}`}
              alt={`${label} QR code`}
              className="w-32 h-32 object-contain border border-navy/10 dark:border-cream/10 rounded-lg bg-cream dark:bg-navy p-1"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs text-terracotta hover:text-terracotta/70 disabled:opacity-50 mt-1"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className={`cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${uploading ? 'opacity-50 cursor-not-allowed border-navy/10 dark:border-cream/10 text-navy/40 dark:text-cream/40' : 'border-navy/20 dark:border-cream/20 text-navy dark:text-cream hover:border-amber hover:text-amber'}`}>
            {uploading ? 'Uploading…' : hasQr ? 'Replace QR image' : 'Upload QR image'}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
          <span className="text-xs text-navy/40 dark:text-cream/40">JPEG, PNG, WEBP or GIF · max 5 MB</span>
        </div>
        {error && <p className="text-xs text-terracotta">{error}</p>}
      </div>
    </div>
  )
}

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [business, setBusiness] = useState(null)
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm()

  const slugValue = useWatch({ control, name: 'slug', defaultValue: '' })

  useEffect(() => {
    api.get('/api/business').then(data => {
      setBusiness(data)
      reset(data)
    }).catch(() => setError('Failed to load settings'))
  }, [reset])

  async function onSubmit(data) {
    setError(''); setSaved(false)
    try {
      const updated = await api.patch('/api/business', {
        name: data.name,
        slug: data.slug?.trim() || null,
        paypal_username: data.paypal_username || null,
        wise_username: data.wise_username || null,
      })
      setBusiness(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-display text-navy dark:text-cream mb-6">Business Settings</h1>

      <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-navy/10 dark:divide-cream/10">
          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream">Business name</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('name')}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream">Booking page URL</p>
              <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">
                Your public booking link. Lowercase letters, numbers and hyphens only.
              </p>
            </div>
            <div className="col-span-2 space-y-2">
              <div className="flex items-center rounded-lg border border-navy/20 dark:border-cream/20 overflow-hidden focus-within:ring-2 focus-within:ring-amber">
                <span className="px-3 py-2 bg-navy/5 dark:bg-cream/5 border-r border-navy/20 dark:border-cream/20 text-sm text-navy/40 dark:text-cream/40 whitespace-nowrap select-none">
                  {BOOKING_BASE}
                </span>
                <input
                  {...register('slug')}
                  placeholder="your-business-name"
                  className="flex-1 px-3 py-2 text-sm bg-cream dark:bg-navy/50 text-navy dark:text-cream focus:outline-none placeholder:text-navy/30 dark:placeholder:text-cream/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const name = document.querySelector('input[name="name"]')?.value || ''
                    if (name) setValue('slug', slugify(name))
                  }}
                  className="text-xs text-amber hover:text-amber/70"
                >
                  Generate from business name
                </button>
                {slugValue && (
                  <a
                    href={`/book/${slugValue}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-navy/40 dark:text-cream/40 hover:text-navy/60 dark:hover:text-cream/60 underline"
                  >
                    Preview ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream">PayPal username</p>
              <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">Shown to customers at checkout</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('paypal_username')}
                placeholder="e.g. yourbusiness@paypal.com"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream">Wise username</p>
              <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">Shown to customers at checkout</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('wise_username')}
                placeholder="e.g. @yourbusiness"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-3 gap-4 items-start">
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream">Booking key</p>
              <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">Embed this in your booking widget</p>
            </div>
            <div className="col-span-2">
              <input
                {...register('booking_key')}
                readOnly
                className="w-full border border-navy/10 dark:border-cream/10 bg-navy/5 dark:bg-cream/5 rounded-lg px-3 py-2 text-sm text-navy/50 dark:text-cream/50 cursor-default"
              />
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between bg-navy/5 dark:bg-cream/5 rounded-b-xl">
            {error && <p className="text-sm text-terracotta">{error}</p>}
            {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved</p>}
            {!error && !saved && <span />}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Image uploads — outside the JSON form, submitted independently */}
        {business && (
          <>
            <HeaderImageUploader
              bookingKey={business.booking_key}
              hasImage={business.has_header_image}
            />
            <QrUploader
              method="paypal"
              label="PayPal"
              bookingKey={business.booking_key}
              hasQr={business.has_paypal_qr}
            />
            <QrUploader
              method="wise"
              label="Wise"
              bookingKey={business.booking_key}
              hasQr={business.has_wise_qr}
            />
          </>
        )}
      </div>
    </div>
  )
}
