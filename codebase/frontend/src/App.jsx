import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Settings from './pages/Settings'
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
          <Route path="settings" element={<Settings />} />
          <Route path="event-types" element={<EventTypes />} />
          <Route path="event-types/:id/sessions" element={<Sessions />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AdminRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
