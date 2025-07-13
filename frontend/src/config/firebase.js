import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyD6CUNTdf7fa3v34XjxjdOFFopMbfQKv6Q",

  authDomain: "agrichain-74c2d.firebaseapp.com",

  projectId: "agrichain-74c2d",

  storageBucket: "agrichain-74c2d.firebasestorage.app",

  messagingSenderId: "296669423453",

  appId: "1:296669423453:web:2752c4fb72c02014e12ab4",

  measurementId: "G-PEH6ZEEQR6"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Export the app instance
export { app }

// Setup reCAPTCHA verifier with cleanup
export const setupRecaptcha = (buttonId) => {
  // Clear any existing recaptcha
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear()
    window.recaptchaVerifier = null
  }

  // Clear the container content
  const container = document.getElementById(buttonId)
  if (container) {
    container.innerHTML = ''
  }

  // Create new recaptcha verifier
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved')
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired')
        clearRecaptcha()
      },
      'error-callback': (error) => {
        console.log('reCAPTCHA error:', error)
        clearRecaptcha()
      }
    })
    
    // Add timeout protection
    window.recaptchaTimeout = setTimeout(() => {
      if (window.recaptchaVerifier) {
        console.log('reCAPTCHA timeout, clearing...')
        clearRecaptcha()
      }
    }, 30000) // 30 seconds timeout
    
  } catch (error) {
    console.error('Error setting up reCAPTCHA:', error)
    throw error
  }
}

// Clear reCAPTCHA
export const clearRecaptcha = () => {
  if (window.recaptchaTimeout) {
    clearTimeout(window.recaptchaTimeout)
    window.recaptchaTimeout = null
  }
  
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear()
    } catch (error) {
      console.log('Error clearing reCAPTCHA:', error)
    }
    window.recaptchaVerifier = null
  }
}

// Send OTP with retry mechanism
export const sendOTP = async (phoneNumber, retries = 2) => {
  try {
    const appVerifier = window.recaptchaVerifier
    if (!appVerifier) {
      throw new Error('reCAPTCHA not initialized')
    }
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    return confirmationResult
  } catch (error) {
    console.error('Error sending OTP:', error)
    
    // Clear and retry if we have retries left
    if (retries > 0 && (error.code === 'auth/timeout' || error.message.includes('timeout'))) {
      console.log(`Retrying OTP send... (${retries} retries left)`)
      clearRecaptcha()
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Setup reCAPTCHA again
      setupRecaptcha('recaptcha-container')
      
      // Retry
      return sendOTP(phoneNumber, retries - 1)
    }
    
    throw error
  }
}

// Verify OTP
export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp)
    return result.user
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error
  }
}

export default app
