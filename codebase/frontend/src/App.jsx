import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SuperAdminAuthProvider } from './context/SuperAdminAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SuperAdminRoute from './components/SuperAdminRoute'
import Layout from './components/Layout'
import SuperAdminLayout from './components/SuperAdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminApprovals from './pages/SuperAdminApprovals'
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions'
import SuperAdminSettings from './pages/SuperAdminSettings'
import Settings from './pages/Settings'
import Subscription from './pages/Subscription'
import EventTypes from './pages/EventTypes'
import Sessions from './pages/Sessions'
import Bookings from './pages/Bookings'
import BookingDetail from './pages/BookingDetail'

function AdminRoutes() {
  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route index element={<Navigate to="/bookings" replace />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="event-types" element={<EventTypes />} />
          <Route path="event-types/:id/sessions" element={<Sessions />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  )
}

function SuperAdminRoutes() {
  return (
    <SuperAdminRoute>
      <SuperAdminLayout>
        <Routes>
          <Route index element={<Navigate to="/superadmin/businesses" replace />} />
          <Route path="businesses" element={<SuperAdminDashboard />} />
          <Route path="approvals" element={<SuperAdminApprovals />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Routes>
      </SuperAdminLayout>
    </SuperAdminRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SuperAdminAuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
            <Route path="/*" element={<AdminRoutes />} />
          </Routes>
        </SuperAdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
