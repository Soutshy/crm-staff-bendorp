import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}