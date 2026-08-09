import { Navigate } from 'react-router-dom'
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext'

export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, loading } = useSuperAdminAuth()

  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/superadmin/login" replace />

  return children
}
