import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { User, Phone, MapPin, UserCheck } from 'lucide-react'

const RegistrationForm = ({ onLogin }) => {
  const navigate = useNavigate()
  const { sendRegistrationOTP, registerWithOTP } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    role: ''
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState('form') // 'form' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.location.trim()) {
      setError('Location is required')
      return false
    }
    if (!formData.role) {
      setError('Please select a role')
      return false
    }
    
    // Phone number validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const result = await sendRegistrationOTP(formData.phone.trim())
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Registration error:', error)
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
      const nextInput = document.getElementById(`reg-otp-${index + 1}`)
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
      const result = await registerWithOTP(otpCode, formData)
      if (result.success) {
        onLogin(result.user, result.token)
        navigate('/dashboard')
      } else {
        setError(result.message)
        setOtp(['', '', '', '', '', ''])
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registration failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        {step === 'form' ? (
          <>
            <h1 className="card-title">Join AgriChain</h1>
            <p className="card-subtitle">
              Register to connect with the agricultural community
            </p>
          </>
        ) : (
          <>
            <h1 className="card-title">Verify Your Number</h1>
            <p className="card-subtitle">
              Enter the 6-digit code sent to {formData.phone}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {step === 'form' ? (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">
              <User size={16} style={{ marginRight: '0.5rem' }} />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Phone size={16} style={{ marginRight: '0.5rem' }} />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="+1234567890"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={16} style={{ marginRight: '0.5rem' }} />
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your city/village"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <UserCheck size={16} style={{ marginRight: '0.5rem' }} />
              Select Your Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Choose your role</option>
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm" style={{ color: '#666' }}>
              Already have an account?{' '}
              <Link to="/login" className="text-link">
                Login here
              </Link>
            </p>
          </div>

          <div id="recaptcha-container"></div>
        </form>
      ) : (
        <form onSubmit={handleOTPSubmit} className="form">
          <div className="form-group">
            <label className="form-label text-center">
              Enter OTP Code
            </label>
            <div className="otp-input-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`reg-otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  className="otp-input-field"
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
            {loading ? 'Registering...' : 'Verify & Register'}
          </button>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="btn btn-secondary mt-3"
            disabled={loading}
          >
            Back to Form
          </button>
        </form>
      )}
    </div>
  )
}

export default RegistrationForm
