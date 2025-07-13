import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import RegistrationForm from './components/RegistrationForm'
import Login from './components/Login'
import FarmerDashboard from './components/dashboards/FarmerDashboard'
import BuyerDashboard from './components/dashboards/BuyerDashboard'
import AgentDashboard from './components/dashboards/AgentDashboard'
import LandingPage from './components/LandingPage'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('agrichain_token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      // Decode token to get user info (in production, verify with backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch (error) {
        console.error('Invalid token:', error)
        localStorage.removeItem('agrichain_token')
        setToken(null)
      }
    }
    setLoading(false)
  }, [token])

  const handleLogin = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('agrichain_token', userToken)
    
    // Navigate to appropriate dashboard
    const dashboardMap = {
      farmer: '/farmer-dashboard',
      buyer: '/buyer-dashboard',
      agent: '/agent-dashboard'
    }
    
    navigate(dashboardMap[userData.role] || '/dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('agrichain_token')
    navigate('/')
  }

  // Protected Route Component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />
    }

    return children
  }

  // Dashboard Redirect Component
  const DashboardRedirect = () => {
    if (!user) return <Navigate to="/login" replace />
    
    const dashboardMap = {
      farmer: '/farmer-dashboard',
      buyer: '/buyer-dashboard',
      agent: '/agent-dashboard'
    }
    
    return <Navigate to={dashboardMap[user.role] || '/'} replace />
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="main-content text-center">
          <div className="loading-spinner"></div>
          <p className="mt-2">Loading AgriChain...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Header user={user} onLogout={handleLogout} />
        
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegistrationForm onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />

            {/* Dashboard redirect */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } 
            />

            {/* Role-specific protected routes */}
            <Route 
              path="/farmer-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerDashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buyer-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <BuyerDashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agent-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentDashboard user={user} />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
