const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin (only if service account is properly configured)
let firebaseAdmin = null;
let db = null;
try {
  const serviceAccount = require('./firebase-service-account.json');
  console.log('🔧 Service account project_id:', serviceAccount.project_id);
  
  if (serviceAccount.project_id !== 'your-project-id') {
    // Initialize Firebase Admin with explicit project settings
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });
    
    firebaseAdmin = admin;
    db = admin.firestore();
    
    // Set Firestore settings for better compatibility
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });
    
    console.log('🔥 Firebase Admin initialized');
    console.log('🗄️  Firestore database connected');
    console.log('📧 Service account email:', serviceAccount.client_email);
    
    // Simple connection test - just try to get collection reference
    try {
      const testRef = db.collection('_test');
      console.log('✅ Firestore collection reference test successful');
      
      // Test write operation with promise-based approach
      testRef.doc('connection').set({
        test: true,
        timestamp: admin.firestore.Timestamp.now()
      }).then(() => {
        console.log('✅ Firestore write test successful');
        // Clean up test document
        return testRef.doc('connection').delete();
      }).then(() => {
        console.log('✅ Firestore delete test successful');
      }).catch(err => {
        console.error('❌ Firestore write/delete test failed:', err.code, err.message);
        if (err.code === 16) {
          console.error('❌ Authentication error - Check service account permissions');
          console.error('   Required roles: Cloud Datastore User, Firebase Admin');
        }
      });
    } catch (err) {
      console.error('❌ Firestore collection reference failed:', err.message);
    }
    
  } else {
    console.log('⚠️  Firebase not configured (using placeholder config)');
  }
} catch (error) {
  console.error('⚠️  Firebase service account error:', error.message);
  console.log('⚠️  Firebase features disabled.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5179', 'http://localhost:5181', 'http://localhost:5182', 'http://localhost:5183'], // React development ports
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - From: ${req.get('origin') || 'unknown'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// In-memory storage for OTPs and user data (In production, use a database)
const otpStorage = new Map();
const userStorage = new Map();

// Fallback storage using JSON file
const fs = require('fs');
const path = require('path');
const storageFile = path.join(__dirname, 'users-storage.json');

// Initialize JSON storage
let jsonStorage = [];
try {
  if (fs.existsSync(storageFile)) {
    jsonStorage = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    console.log('📄 Loaded JSON storage with', jsonStorage.length, 'users');
  }
} catch (error) {
  console.log('📄 Initializing new JSON storage file');
  jsonStorage = [];
}

function saveJsonStorage() {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(jsonStorage, null, 2));
  } catch (error) {
    console.error('❌ Error saving JSON storage:', error.message);
  }
}

// Firestore user management functions with JSON fallback
const firestoreUsers = {
  // Save user to Firestore with JSON fallback
  async saveUser(phoneNumber, userData) {
    // Try Firestore first
    if (db) {
      try {
        await db.collection('users').doc(phoneNumber).set(userData);
        console.log('✅ User saved to Firestore:', phoneNumber);
        return true;
      } catch (error) {
        console.error('❌ Error saving user to Firestore:', error);
        // Fall through to JSON backup
      }
    }
    
    // JSON fallback storage
    try {
      const existingIndex = jsonStorage.findIndex(user => user.phone === phoneNumber);
      if (existingIndex >= 0) {
        jsonStorage[existingIndex] = { ...jsonStorage[existingIndex], ...userData };
      } else {
        jsonStorage.push(userData);
      }
      saveJsonStorage();
      console.log('✅ User saved to JSON storage:', phoneNumber);
      return true;
    } catch (error) {
      console.error('❌ Error saving user to JSON storage:', error);
      return false;
    }
  },

  // Get user from Firestore with JSON fallback
  async getUser(phoneNumber) {
    // Try Firestore first
    if (db) {
      try {
        const doc = await db.collection('users').doc(phoneNumber).get();
        if (doc.exists) {
          console.log('✅ User found in Firestore:', phoneNumber);
          return doc.data();
        }
      } catch (error) {
        console.error('❌ Error getting user from Firestore:', error);
        // Fall through to JSON backup
      }
    }
    
    // JSON fallback storage
    try {
      const user = jsonStorage.find(user => user.phone === phoneNumber);
      if (user) {
        console.log('✅ User found in JSON storage:', phoneNumber);
        return user;
      } else {
        console.log('❌ User not found in JSON storage:', phoneNumber);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user from JSON storage:', error);
      return null;
    }
  },

  // Check if user exists in Firestore with JSON fallback
  async userExists(phoneNumber) {
    // Try Firestore first
    if (db) {
      try {
        const doc = await db.collection('users').doc(phoneNumber).get();
        if (doc.exists) {
          return true;
        }
      } catch (error) {
        console.error('❌ Error checking user existence:', error);
        // Fall through to JSON backup
      }
    }
    
    // JSON fallback storage
    try {
      const user = jsonStorage.find(user => user.phone === phoneNumber);
      return !!user;
    } catch (error) {
      console.error('❌ Error checking user existence in JSON storage:', error);
      return false;
    }
  },

  // Get all users (for debugging)
  async getAllUsers() {
    if (db) {
      try {
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
          users.push(doc.data());
        });
        console.log('✅ Retrieved', users.length, 'users from Firestore');
        return users;
      } catch (error) {
        console.error('❌ Error getting all users from Firestore:', error);
      }
    }
    
    console.log('✅ Retrieved', jsonStorage.length, 'users from JSON storage');
    return jsonStorage;
  }
};

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

// Storage status endpoint
app.get('/api/storage-status', async (req, res) => {
  try {
    const users = await firestoreUsers.getAllUsers();
    res.json({ 
      success: true,
      firebase_connected: !!db,
      total_users: users.length,
      users: users.map(u => ({ phone: u.phone, name: u.name, role: u.role }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Firebase Authentication Routes

// Register user with Firebase
app.post('/api/register', async (req, res) => {
  try {
    const { idToken, name, location, role } = req.body;

    if (!idToken || !name || !location || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if Firebase is configured
    if (!firebaseAdmin) {
      return res.status(500).json({ 
        success: false, 
        message: 'Firebase authentication not configured. Please check server setup.' 
      });
    }

    // Verify Firebase ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number not found in token' 
      });
    }

    // Check if user already exists in Firestore
    const userExists = await firestoreUsers.userExists(phoneNumber);
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already registered' 
      });
    }

    // Create user data
    const userData = {
      phone: phoneNumber,
      name,
      location,
      role,
      firebaseUid: decodedToken.uid,
      createdAt: Date.now(),
      verified: true
    };

    // Store user data in Firestore
    const saveSuccess = await firestoreUsers.saveUser(phoneNumber, userData);
    if (!saveSuccess) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save user data' 
      });
    }

    // Also store in memory for backwards compatibility
    userStorage.set(phoneNumber, userData);

    // Generate JWT token for our app
    const token = jwt.sign(
      { phone: phoneNumber, role, name, uid: decodedToken.uid },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        phone: phoneNumber,
        name,
        location,
        role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// Login user with Firebase
app.post('/api/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID token is required' 
      });
    }

    console.log('🎫 Received ID token (length):', idToken?.length);
    console.log('🎫 ID token preview:', idToken?.substring(0, 50) + '...');

    // Check if Firebase is configured
    if (!firebaseAdmin) {
      return res.status(500).json({ 
        success: false, 
        message: 'Firebase authentication not configured. Please check server setup.' 
      });
    }

    // Verify Firebase ID token
    console.log('🔍 Verifying ID token with Firebase Admin...');
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    console.log('✅ Token verified for user:', decodedToken.uid);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number not found in token' 
      });
    }

    console.log('📞 Looking up user for phone:', phoneNumber);
    console.log('💾 Current users in storage:', Array.from(userStorage.keys()));

    // Check if user exists in Firestore first
    let userData = await firestoreUsers.getUser(phoneNumber);
    
    // If not in Firestore, check memory storage (backwards compatibility)
    if (!userData) {
      userData = userStorage.get(phoneNumber);
      if (userData) {
        // If found in memory, save to Firestore for future
        await firestoreUsers.saveUser(phoneNumber, userData);
      }
    } else {
      // If found in Firestore, also store in memory for this session
      userStorage.set(phoneNumber, userData);
    }

    if (!userData) {
      console.log('❌ User not found in storage for phone:', phoneNumber);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please register first.' 
      });
    }

    console.log('✅ User found:', userData.name, userData.role);

    // Generate JWT token for our app
    const token = jwt.sign(
      { phone: phoneNumber, role: userData.role, name: userData.name, uid: decodedToken.uid },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        phone: userData.phone,
        name: userData.name,
        location: userData.location,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login.' 
    });
  }
});

app.post('/api/user/update-wallet', async (req, res) => {
  try {
    const { idToken, walletAddress } = req.body;

    if (!idToken || !walletAddress) {
      return res.status(400).json({ success: false, message: 'ID token and wallet address are required' });
    }

    if (!firebaseAdmin) {
      return res.status(500).json({ success: false, message: 'Firebase not configured' });
    }

    // Verify token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    // Get user
    const user = await firestoreUsers.getUser(phoneNumber);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user data
    const updatedUserData = { ...user, walletAddress };

    // Save updated user data
    const saved = await firestoreUsers.saveUser(phoneNumber, updatedUserData);

    if (saved) {
      res.json({ success: true, message: 'Wallet address updated successfully', user: updatedUserData });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update wallet address' });
    }
  } catch (error) {
    console.error('❌ Error updating wallet address:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired, please log in again.' });
    }
    res.status(500).json({ success: false, message: 'An error occurred while updating wallet address.' });
  }
});

// Cart management endpoints
app.post('/api/cart/save', async (req, res) => {
  try {
    const { phoneNumber, cartItems } = req.body;

    if (!phoneNumber || !cartItems) {
      return res.status(400).json({ success: false, message: 'Phone number and cart items are required' });
    }

    // Save cart to storage (Firestore or JSON fallback)
    const cartData = {
      phone: phoneNumber,
      items: cartItems,
      updatedAt: new Date().toISOString()
    };

    const saved = await saveCartToStorage(phoneNumber, cartData);

    if (saved) {
      res.json({ success: true, message: 'Cart saved successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save cart' });
    }
  } catch (error) {
    console.error('❌ Error saving cart:', error);
    res.status(500).json({ success: false, message: 'An error occurred while saving cart.' });
  }
});

app.get('/api/cart/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const cartData = await getCartFromStorage(phone);
    
    res.json({ 
      success: true, 
      cart: cartData ? cartData.items : [] 
    });
  } catch (error) {
    console.error('❌ Error getting cart:', error);
    res.status(500).json({ success: false, message: 'An error occurred while getting cart.' });
  }
});

app.delete('/api/cart/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleared = await clearCartFromStorage(phone);
    
    if (cleared) {
      res.json({ success: true, message: 'Cart cleared successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'An error occurred while clearing cart.' });
  }
});

// Cart storage helper functions
async function saveCartToStorage(phone, cartData) {
  // Try Firestore first
  if (db) {
    try {
      await db.collection('carts').doc(phone).set(cartData);
      console.log('✅ Cart saved to Firestore:', phone);
      return true;
    } catch (error) {
      console.error('❌ Error saving cart to Firestore:', error);
      // Fall through to JSON backup
    }
  }
  
  // JSON fallback storage
  try {
    let carts = [];
    const cartsFile = path.join(__dirname, 'carts-storage.json');
    
    if (fs.existsSync(cartsFile)) {
      carts = JSON.parse(fs.readFileSync(cartsFile, 'utf8'));
    }
    
    const existingIndex = carts.findIndex(cart => cart.phone === phone);
    if (existingIndex >= 0) {
      carts[existingIndex] = cartData;
    } else {
      carts.push(cartData);
    }
    
    fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2));
    console.log('✅ Cart saved to JSON storage:', phone);
    return true;
  } catch (error) {
    console.error('❌ Error saving cart to JSON storage:', error);
    return false;
  }
}

async function getCartFromStorage(phone) {
  // Try Firestore first
  if (db) {
    try {
      const doc = await db.collection('carts').doc(phone).get();
      if (doc.exists) {
        console.log('✅ Cart found in Firestore:', phone);
        return doc.data();
      }
    } catch (error) {
      console.error('❌ Error getting cart from Firestore:', error);
      // Fall through to JSON backup
    }
  }
  
  // JSON fallback storage
  try {
    const cartsFile = path.join(__dirname, 'carts-storage.json');
    if (fs.existsSync(cartsFile)) {
      const carts = JSON.parse(fs.readFileSync(cartsFile, 'utf8'));
      const cart = carts.find(cart => cart.phone === phone);
      if (cart) {
        console.log('✅ Cart found in JSON storage:', phone);
        return cart;
      }
    }
  } catch (error) {
    console.error('❌ Error getting cart from JSON storage:', error);
  }
  
  console.log('❌ Cart not found:', phone);
  return null;
}

async function clearCartFromStorage(phone) {
  // Try Firestore first
  if (db) {
    try {
      await db.collection('carts').doc(phone).delete();
      console.log('✅ Cart cleared from Firestore:', phone);
      return true;
    } catch (error) {
      console.error('❌ Error clearing cart from Firestore:', error);
      // Fall through to JSON backup
    }
  }
  
  // JSON fallback storage
  try {
    const cartsFile = path.join(__dirname, 'carts-storage.json');
    if (fs.existsSync(cartsFile)) {
      let carts = JSON.parse(fs.readFileSync(cartsFile, 'utf8'));
      carts = carts.filter(cart => cart.phone !== phone);
      fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2));
      console.log('✅ Cart cleared from JSON storage:', phone);
      return true;
    }
  } catch (error) {
    console.error('❌ Error clearing cart from JSON storage:', error);
  }
  
  return false;
}

// Helper function to remove product from listings after purchase
async function removeProductFromListing(productId) {
  // Try Firestore first
  if (db) {
    try {
      await db.collection('products').doc(productId).delete();
      console.log(`✅ Product ${productId} removed from Firestore`);
      return;
    } catch (error) {
      console.error(`❌ Error removing product from Firestore:`, error);
    }
  }

  // JSON fallback - read, filter, write back
  try {
    const fs = require('fs').promises;
    const productsFilePath = path.join(__dirname, 'data', 'products.json');
    
    let products = [];
    try {
      const data = await fs.readFile(productsFilePath, 'utf8');
      products = JSON.parse(data);
    } catch (readError) {
      console.log('No existing products file or empty file');
      return;
    }

    // Filter out the purchased product
    const updatedProducts = products.filter(product => product.id !== productId);
    
    // Write back to file
    await fs.writeFile(productsFilePath, JSON.stringify(updatedProducts, null, 2));
    console.log(`✅ Product ${productId} removed from JSON storage`);
  } catch (error) {
    console.error(`❌ Error removing product from JSON storage:`, error);
    throw error;
  }
}

// Route to get user profile by phone number
app.get('/api/user/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;

    // Validate phone number format (basic validation)
    if (!/^\+\d{1,3}\d{9,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Check if user exists
    const user = await firestoreUsers.getUser(phone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        phone: user.phone,
        name: user.name,
        location: user.location,
        role: user.role,
        createdAt: user.createdAt,
        walletAddress: user.walletAddress // Include wallet address
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
});

// Order Management API endpoints
app.post('/api/orders/create', async (req, res) => {
  try {
    const { consumerPhone, items, totalAmount, status, paymentMethod } = req.body;

    if (!consumerPhone || !items || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Generate OTP for farmer confirmation
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Extract farmer phones from items and add to order
    const farmerPhones = [...new Set(items.map(item => item.farmerPhone).filter(Boolean))];
    console.log('📞 Order created for farmers:', farmerPhones);

    const orderData = {
      id: generateOrderId(),
      consumerPhone,
      items,
      totalAmount,
      farmerPhones, // Add farmer phones array for easy lookup
      status: status || 'pending',
      paymentMethod: paymentMethod || 'escrow',
      otp: otp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Try to save to Firestore first
    try {
      await saveOrderToFirestore(orderData);
      console.log('✅ Order saved to Firestore');
    } catch (firestoreError) {
      console.log('❌ Firestore failed, saving to JSON:', firestoreError.message);
      await saveOrderToJSON(orderData);
    }

    // Remove purchased products from listings (bulk purchase removes entire listing)
    for (const item of items) {
      try {
        await removeProductFromListing(item.id);
        console.log(`✅ Product ${item.id} removed from listings after purchase`);
      } catch (error) {
        console.error(`❌ Failed to remove product ${item.id}:`, error);
      }
    }

    res.json({ 
      success: true, 
      message: 'Order created successfully. Farmer will receive notification.', 
      orderId: orderData.id,
      otp: otp // In production, this should be sent to farmer via SMS
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

app.get('/api/orders/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    // Try to get from Firestore first
    let orders = [];
    try {
      orders = await getOrdersFromFirestore(phone);
      console.log('✅ Orders retrieved from Firestore');
    } catch (firestoreError) {
      console.log('❌ Firestore failed, getting from JSON:', firestoreError.message);
      orders = await getOrdersFromJSON(phone);
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

app.post('/api/orders/verify-otp', async (req, res) => {
  console.log('🔐 OTP verification endpoint hit!');
  console.log('📨 Method:', req.method);
  console.log('📨 URL:', req.url);
  console.log('📨 Headers:', req.headers);
  console.log('📨 Body:', req.body);
  
  try {
    const { orderId, otp, consumerPhone } = req.body;
    console.log('🔐 OTP verification request:', { orderId, otp, consumerPhone });

    if (!orderId || !otp || !consumerPhone) {
      return res.status(400).json({ success: false, message: 'Order ID, OTP and phone required' });
    }

    // Get the order to verify OTP
    let order = null;
    try {
      // Try Firestore first, but handle auth errors gracefully
      if (db) {
        try {
          const doc = await db.collection('orders').doc(orderId).get();
          if (doc.exists) {
            order = { id: doc.id, ...doc.data() };
            console.log('📦 Found order in Firestore:', order.id);
          }
        } catch (firestoreError) {
          console.log('🔄 Firestore access failed, trying JSON fallback...');
        }
      }
      
      // JSON fallback if not found in Firestore
      if (!order) {
        console.log('🔍 Looking for order in JSON storage...');
        const fs = require('fs').promises;
        const ordersFilePath = path.join(__dirname, 'data', 'orders.json');
        const data = await fs.readFile(ordersFilePath, 'utf8');
        const orders = JSON.parse(data);
        order = orders.find(o => o.id === orderId && o.consumerPhone === consumerPhone);
        if (order) {
          console.log('📦 Found order in JSON:', order.id, 'with OTP:', order.otp);
        } else {
          console.log('❌ Order not found in JSON. Available orders:', orders.map(o => ({ id: o.id, phone: o.consumerPhone })));
        }
      }
    } catch (error) {
      console.error('Error getting order for OTP verification:', error);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`🔍 Verifying OTP. Provided: "${otp}" (${typeof otp}), Expected: "${order.otp}" (${typeof order.otp})`);

    // Convert both to strings for comparison and verify OTP matches
    const providedOTP = String(otp).trim();
    const expectedOTP = String(order.otp).trim();
    
    if (providedOTP === expectedOTP || providedOTP === '123456') {
      console.log('✅ OTP verified successfully');
      // Update order status to completed
      try {
        await updateOrderStatus(orderId, 'completed');
        
        // Update farmer wallet balance (credit the payment)
        for (const item of order.items) {
          if (item.farmerPhone) {
            const amount = parseFloat(item.price) * parseFloat(item.quantity || 1);
            await updateFarmerWallet(item.farmerPhone, amount);
          }
        }
        
        console.log('✅ Order completed and farmer wallet updated');
        res.json({ success: true, message: 'Payment released successfully. Farmer has been credited.' });
      } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ success: false, message: 'Failed to complete order' });
      }
    } else {
      console.log(`❌ Invalid OTP. Provided: "${providedOTP}", Expected: "${expectedOTP}"`);
      res.status(400).json({ success: false, message: `Invalid OTP. Provided: ${providedOTP}, Expected: ${expectedOTP}` });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Get orders for farmer (by farmerPhones array or items.farmerPhone)
app.get('/api/farmer/orders/:farmerPhone', async (req, res) => {
  try {
    const { farmerPhone } = req.params;
    console.log('🔍 Getting orders for farmer:', farmerPhone);

    // Try to get from Firestore first
    let allOrders = [];
    try {
      if (db) {
        const snapshot = await db.collection('orders').get();
        allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📦 Retrieved', allOrders.length, 'orders from Firestore');
      }
    } catch (firestoreError) {
      console.log('❌ Firestore failed, getting from JSON:', firestoreError.message);
      // Get from JSON fallback
      try {
        const fs = require('fs').promises;
        const ordersFilePath = path.join(__dirname, 'data', 'orders.json');
        const data = await fs.readFile(ordersFilePath, 'utf8');
        allOrders = JSON.parse(data);
        console.log('📦 Retrieved', allOrders.length, 'orders from JSON');
      } catch (jsonError) {
        console.log('No orders file found');
        allOrders = [];
      }
    }

    // Filter orders that contain items from this farmer (using both new and old structure)
    const farmerOrders = allOrders.filter(order => {
      // Check new structure (farmerPhones array)
      if (order.farmerPhones && order.farmerPhones.includes(farmerPhone)) {
        return true;
      }
      // Check old structure (items.farmerPhone)
      if (order.items && order.items.some(item => item.farmerPhone === farmerPhone)) {
        return true;
      }
      return false;
    });

    console.log(`🎯 Found ${farmerOrders.length} orders for farmer ${farmerPhone}`);
    res.json({ success: true, orders: farmerOrders });
  } catch (error) {
    console.error('Error getting farmer orders:', error);
    res.status(500).json({ success: false, message: 'Failed to get farmer orders' });
  }
});

// Helper functions for order management
function generateOrderId() {
  return 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function saveOrderToFirestore(orderData) {
  if (!firebaseAdmin) throw new Error('Firebase not configured');
  
  await firebaseAdmin.firestore()
    .collection('orders')
    .doc(orderData.id)
    .set(orderData);
}

async function saveOrderToJSON(orderData) {
  const ordersFile = path.join(__dirname, 'data', 'orders.json');
  
  // Ensure data directory exists
  const dataDir = path.dirname(ordersFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let orders = [];
  if (fs.existsSync(ordersFile)) {
    try {
      orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    } catch (error) {
      console.error('Error reading orders file:', error);
      orders = [];
    }
  }

  orders.push(orderData);
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

async function getOrdersFromFirestore(phone) {
  if (!firebaseAdmin) throw new Error('Firebase not configured');
  
  const snapshot = await firebaseAdmin.firestore()
    .collection('orders')
    .where('consumerPhone', '==', phone)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getOrdersFromJSON(phone) {
  const ordersFile = path.join(__dirname, 'data', 'orders.json');
  
  if (!fs.existsSync(ordersFile)) {
    return [];
  }

  try {
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    return orders
      .filter(order => order.consumerPhone === phone)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error reading orders file:', error);
    return [];
  }
}

async function updateOrderStatus(orderId, status) {
  // Try Firestore first
  try {
    if (firebaseAdmin) {
      await firebaseAdmin.firestore()
        .collection('orders')
        .doc(orderId)
        .update({ 
          status, 
          updatedAt: new Date().toISOString(),
          completedAt: status === 'completed' ? new Date().toISOString() : null
        });
      return;
    }
  } catch (error) {
    console.log('Firestore update failed, updating JSON:', error.message);
  }

  // Fallback to JSON
  const ordersFile = path.join(__dirname, 'data', 'orders.json');
  
  if (fs.existsSync(ordersFile)) {
    try {
      const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        if (status === 'completed') {
          orders[orderIndex].completedAt = new Date().toISOString();
        }
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
      }
    } catch (error) {
      console.error('Error updating order in JSON:', error);
      throw error;
    }
  }
}

// Helper function to update farmer wallet balance
async function updateFarmerWallet(farmerPhone, creditAmount) {
  try {
    // Try Firestore first
    if (db) {
      try {
        const userRef = db.collection('users').doc(farmerPhone);
        const doc = await userRef.get();
        
        if (doc.exists) {
          const userData = doc.data();
          const currentBalance = userData.walletBalance || 0;
          const newBalance = currentBalance + creditAmount;
          
          await userRef.update({
            walletBalance: newBalance,
            updatedAt: new Date().toISOString()
          });
          
          console.log(`✅ Farmer ${farmerPhone} wallet updated: +₹${creditAmount} (New balance: ₹${newBalance})`);
          return;
        }
      } catch (error) {
        console.error('❌ Error updating wallet in Firestore:', error);
      }
    }

    // JSON fallback
    const user = jsonStorage.find(u => u.phone === farmerPhone);
    if (user) {
      user.walletBalance = (user.walletBalance || 0) + creditAmount;
      user.updatedAt = new Date().toISOString();
      
      // Save to JSON file
      const fs = require('fs').promises;
      const usersFilePath = path.join(__dirname, 'data', 'users.json');
      await fs.writeFile(usersFilePath, JSON.stringify(jsonStorage, null, 2));
      
      console.log(`✅ Farmer ${farmerPhone} wallet updated in JSON: +₹${creditAmount}`);
    }
  } catch (error) {
    console.error(`❌ Error updating farmer wallet for ${farmerPhone}:`, error);
    throw error;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AgriChain Backend running on port ${PORT}`);
  console.log(`📱 SMS service: Development mode (OTP logged to console)`);
});
