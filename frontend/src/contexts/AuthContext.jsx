import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, setupRecaptcha, sendOTP, verifyOTP, clearRecaptcha } from '../config/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { apiService } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmationResult, setConfirmationResult] = useState(null)

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    // Cleanup function
    return () => {
      unsubscribe()
      clearRecaptcha() // Clean up reCAPTCHA when component unmounts
    }
  }, [])

  // Send OTP for registration
  const sendRegistrationOTP = async (phoneNumber) => {
    try {
      // Clear any existing reCAPTCHA first
      clearRecaptcha()
      
      // Setup new reCAPTCHA
      setupRecaptcha('recaptcha-container')
      
      const confirmation = await sendOTP(phoneNumber)
      setConfirmationResult(confirmation)
      return { success: true, message: 'OTP sent successfully' }
    } catch (error) {
      console.error('Error sending OTP:', error)
      clearRecaptcha() // Clean up on error
      return { success: false, message: error.message }
    }
  }

  // Send OTP for login
  const sendLoginOTP = async (phoneNumber) => {
    try {
      // Clear any existing reCAPTCHA first
      clearRecaptcha()
      
      // Setup new reCAPTCHA
      setupRecaptcha('recaptcha-container-login')
      
      const confirmation = await sendOTP(phoneNumber)
      setConfirmationResult(confirmation)
      return { success: true, message: 'OTP sent successfully' }
    } catch (error) {
      console.error('Error sending OTP:', error)
      clearRecaptcha() // Clean up on error
      return { success: false, message: error.message }
    }
  }

  // Verify OTP and register
  const registerWithOTP = async (otp, userData) => {
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result found')
      }

      // Verify OTP with Firebase
      console.log('🔐 Verifying OTP for registration...')
      const user = await verifyOTP(confirmationResult, otp)
      console.log('✅ Firebase user verified for registration:', user.uid)
      
      // Get Firebase ID token
      console.log('🎫 Getting Firebase ID token for registration...')
      const idToken = await user.getIdToken()
      console.log('🎫 ID Token received for registration (length):', idToken?.length)

      // Register with our backend
      console.log('📝 Registering user with backend...')
      const response = await apiService.register({
        idToken,
        ...userData
      })
      console.log('📝 Registration response:', response.data)

      if (response.data.success) {
        // Store token
        localStorage.setItem('agrichain_token', response.data.token)
        return { success: true, user: response.data.user, token: response.data.token }
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle specific error types
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check the code and try again.'
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, message: errorMessage }
    }
  }

  // Verify OTP and login
  const loginWithOTP = async (otp) => {
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result found')
      }

      // Verify OTP with Firebase
      console.log('🔐 Verifying OTP with Firebase...')
      const user = await verifyOTP(confirmationResult, otp)
      console.log('✅ Firebase user verified:', user.uid)
      
      // Get Firebase ID token
      console.log('🎫 Getting Firebase ID token...')
      const idToken = await user.getIdToken()
      console.log('🎫 ID Token received (length):', idToken?.length)
      console.log('🎫 ID Token preview:', idToken?.substring(0, 50) + '...')

      // Login with our backend
      console.log('🔑 Attempting login with backend...')
      const response = await apiService.login({ idToken })
      console.log('📝 Backend login response:', response.data)

      if (response.data.success) {
        // Store token
        localStorage.setItem('agrichain_token', response.data.token)
        return { success: true, user: response.data.user, token: response.data.token }
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle specific error types
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check the code and try again.'
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.'
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please register first.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Connection error. Please check your internet and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, message: errorMessage }
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('agrichain_token')
      setCurrentUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, message: error.message }
    }
  }

  const value = {
    currentUser,
    sendRegistrationOTP,
    sendLoginOTP,
    registerWithOTP,
    loginWithOTP,
    logout,
    confirmationResult
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
