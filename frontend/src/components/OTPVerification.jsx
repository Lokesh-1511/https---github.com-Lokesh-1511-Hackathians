import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react'

const OTPVerification = ({ onLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const inputRefs = useRef([])

  const { message, phone, devOTP } = location.state || {}
  const registrationData = JSON.parse(sessionStorage.getItem('registrationData') || '{}')

  useEffect(() => {
    // If no registration data, redirect to registration
    if (!registrationData.phone) {
      navigate('/register')
      return
    }
    
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [navigate, registrationData.phone])

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)
        if (digits.length === 6) {
          handleVerifyOTP(newOtp.join(''))
        }
      })
    }
  }

  const handleVerifyOTP = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiService.verifyOTP({
        phone: registrationData.phone,
        otp: otpCode,
        role: registrationData.role,
        name: registrationData.name,
        location: registrationData.location
      })

      if (response.data.success) {
        // Clear session storage
        sessionStorage.removeItem('registrationData')
        
        // Call login handler
        onLogin(response.data.user, response.data.token)
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError(
        error.response?.data?.message || 
        'Invalid OTP. Please try again.'
      )
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResending(true)
    setError('')

    try {
      const response = await apiService.generateOTP({
        name: registrationData.name,
        phone: registrationData.phone
      })

      if (response.data.success) {
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        // Show success message briefly
        setError('')
        alert('New OTP sent successfully!')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError(
        error.response?.data?.message || 
        'Failed to resend OTP. Please try again.'
      )
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleVerifyOTP()
  }

  if (!registrationData.phone) {
    return null
  }

  return (
    <div className="card">
      <div className="card-header">
        <Shield className="dashboard-card-icon" style={{ margin: '0 auto 1rem' }} />
        <h1 className="card-title">Verify Your Identity</h1>
        <p className="card-subtitle">
          Enter the 6-digit code sent to your mobile number
        </p>
        {phone && (
          <p className="text-sm mt-2" style={{ color: '#666' }}>
            Code sent to: {phone}
          </p>
        )}
      </div>

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {devOTP && (
        <div className="alert alert-info">
          <strong>Development Mode:</strong> Your OTP is <strong>{devOTP}</strong>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label text-center">
            Enter OTP Code
          </label>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.some(digit => !digit)}
          className="btn btn-primary btn-full"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              <span style={{ marginLeft: '0.5rem' }}>Verifying...</span>
            </>
          ) : (
            'Verify & Complete Registration'
          )}
        </button>

        <div className="flex justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending}
            className="btn btn-secondary"
          >
            {resending ? (
              <span className="loading-spinner"></span>
            ) : (
              <RefreshCw size={16} />
            )}
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </form>

      <div className="text-center mt-3">
        <p className="text-sm" style={{ color: '#666' }}>
          Didn't receive the code? Check your spam folder or try resending
        </p>
      </div>
    </div>
  )
}

export default OTPVerification
