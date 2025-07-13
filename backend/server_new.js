const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // React development ports
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for OTPs and user data (In production, use a database)
const otpStorage = new Map();
const userStorage = new Map();

// Note: In production, you would integrate SMS service like Twilio here
// For development, OTP will be logged to console and returned in response

// Utility function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AgriChain Backend is running!' });
});

// Generate and send OTP
app.post('/api/generate-otp', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and name are required' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (5 minutes)
    const otpData = {
      otp,
      phone,
      name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false
    };
    
    otpStorage.set(phone, otpData);

    // For development: Log OTP to console for testing
    console.log(`OTP generated for ${phone}: ${otp}`); // For development only

    res.json({ 
      success: true, 
      message: 'OTP generated successfully. Check your mobile for SMS.',
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate OTP' 
    });
  }
});

// Verify OTP and register user
app.post('/api/verify-otp', (req, res) => {
  try {
    const { phone, otp, role, name, location } = req.body;

    if (!phone || !otp || !role || !name || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const otpData = otpStorage.get(phone);

    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not found. Please generate a new OTP.' 
      });
    }

    if (otpData.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP already used. Please generate a new OTP.' 
      });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(phone);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired. Please generate a new OTP.' 
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.' 
      });
    }

    // Mark OTP as verified
    otpData.verified = true;
    otpStorage.set(phone, otpData);

    // Create user data
    const userData = {
      phone,
      name,
      location,
      role,
      createdAt: Date.now(),
      verified: true
    };

    // Store user data
    userStorage.set(phone, userData);

    // Generate JWT token
    const token = jwt.sign(
      { phone, role, name },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        phone,
        name,
        location,
        role
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    });
  }
});

// Resend OTP
app.post('/api/resend-otp', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and name are required' 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Store new OTP with expiration (5 minutes)
    const otpData = {
      otp,
      phone,
      name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false
    };
    
    otpStorage.set(phone, otpData);

    console.log(`OTP resent for ${phone}: ${otp}`); // For development only

    res.json({ 
      success: true, 
      message: 'OTP resent successfully. Check your mobile for SMS.',
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const userData = userStorage.get(req.user.phone);
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        phone: userData.phone,
        name: userData.name,
        location: userData.location,
        role: userData.role,
        createdAt: userData.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Get all users (for admin/debugging)
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const users = Array.from(userStorage.values()).map(user => ({
      phone: user.phone,
      name: user.name,
      location: user.location,
      role: user.role,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AgriChain Backend running on port ${PORT}`);
  console.log(`📱 SMS service: Development mode (OTP logged to console)`);
});
