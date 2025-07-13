import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Phone, Shield, ArrowLeft } from 'lucide-react'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const { sendLoginOTP, loginWithOTP } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    
    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    // Phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await sendLoginOTP(phone)
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await loginWithOTP(otpCode)
      if (result.success) {
        onLogin(result.user, result.token)
        navigate('/dashboard')
      } else {
        setError(result.message)
        setOtp(['', '', '', '', '', ''])
      }
    } catch (error) {
      setError('Login failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone')
      setOtp(['', '', '', '', '', ''])
    } else {
      navigate('/')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        {step === 'phone' ? (
          <>
            <Phone className="dashboard-card-icon" style={{ margin: '0 auto 1rem' }} />
            <h1 className="card-title">Welcome Back</h1>
            <p className="card-subtitle">
              Enter your phone number to sign in to AgriChain
            </p>
          </>
        ) : (
          <>
            <Shield className="dashboard-card-icon" style={{ margin: '0 auto 1rem' }} />
            <h1 className="card-title">Verify Your Number</h1>
            <p className="card-subtitle">
              Enter the 6-digit code sent to {phone}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="form">
          <div className="form-group">
            <label className="form-label">
              <Phone size={16} style={{ marginRight: '0.5rem' }} />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              placeholder="+1234567890"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm" style={{ color: '#666' }}>
              Don't have an account?{' '}
              <Link to="/register" className="text-link">
                Register here
              </Link>
            </p>
          </div>

          <div id="recaptcha-container-login"></div>
        </form>
      ) : (
        <form onSubmit={handleOTPSubmit} className="form">
          <div className="form-group">
            <label className="form-label text-center">
              Enter OTP Code
            </label>
            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  className="otp-input"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary mt-3"
            disabled={loading}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
            Back
          </button>
        </form>
      )}
    </div>
  )
}

export default Login
