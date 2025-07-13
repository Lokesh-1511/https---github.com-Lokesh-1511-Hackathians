import { db } from '../config/firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import api from '../api/index.js'
import authService from './authService.js'

class UserService {
  // Get user data by ID
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  }

  // Get user by wallet address
  async getUserByWalletAddress(walletAddress) {
    try {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef, 
        where('walletAddress', '==', walletAddress.toLowerCase())
      )
      
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        return { id: userDoc.id, ...userDoc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting user by wallet address:', error)
      throw error
    }
  }

  // Update user wallet address
  async updateUserWalletAddress(userId, walletAddress) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        walletAddress: walletAddress.toLowerCase(),
        updatedAt: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error updating wallet address:', error)
      throw error
    }
  }

  // Check if wallet address exists for any user
  async isWalletAddressRegistered(walletAddress) {
    try {
      const user = await this.getUserByWalletAddress(walletAddress)
      return user !== null
    } catch (error) {
      console.error('Error checking wallet address registration:', error)
      return false
    }
  }

  // Get all farmers
  async getFarmers() {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'farmer'))
      
      const querySnapshot = await getDocs(q)
      const farmers = []
      
      querySnapshot.forEach((doc) => {
        farmers.push({ id: doc.id, ...doc.data() })
      })
      
      return farmers
    } catch (error) {
      console.error('Error getting farmers:', error)
      throw error
    }
  }

  // Get all buyers
  async getBuyers() {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'buyer'))
      
      const querySnapshot = await getDocs(q)
      const buyers = []
      
      querySnapshot.forEach((doc) => {
        buyers.push({ id: doc.id, ...doc.data() })
      })
      
      return buyers
    } catch (error) {
      console.error('Error getting buyers:', error)
      throw error
    }
  }

  // Verify user credentials and return user data
  async verifyUser(phoneNumber, password) {
    try {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef, 
        where('phoneNumber', '==', phoneNumber),
        where('password', '==', password)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        return { id: userDoc.id, ...userDoc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error verifying user:', error)
      throw error
    }
  }

  // Function to update user's wallet address
  async updateUserWallet(walletAddress) {
    try {
      // Get fresh ID token from authService
      const idToken = await authService.getIdToken(true); // Force refresh
      
      const response = await api.post('/user/update-wallet', { idToken, walletAddress });
      
      if (response.data.success) {
        console.log('Wallet address updated successfully:', response.data.user);
        
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error updating wallet address:', error.response ? error.response.data : error.message);
      
      // If it's an authentication error, try to refresh token and retry once
      if (error.response?.status === 401 || error.message.includes('not authenticated')) {
        try {
          console.log('Attempting to refresh authentication token...');
          const freshToken = await authService.getIdToken(true);
          
          const retryResponse = await api.post('/user/update-wallet', { 
            idToken: freshToken, 
            walletAddress 
          });
          
          if (retryResponse.data.success) {
            console.log('Wallet address updated successfully after token refresh:', retryResponse.data.user);
            localStorage.setItem('user', JSON.stringify(retryResponse.data.user));
            return retryResponse.data.user;
          }
        } catch (retryError) {
          console.error('Failed to update wallet address after token refresh:', retryError);
        }
      }
      
      return null;
    }
  }

  // Login function
  async login(idToken) {
    try {
      const response = await api.post('/login', { idToken });
      
      if (response.data.success) {
        console.log('Login successful:', response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error during login:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Register function
  async register(userData) {
    try {
      const response = await api.post('/register', userData);
      
      if (response.data.success) {
        console.log('Registration successful:', response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error during registration:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(phone) {
    try {
      const response = await api.get(`/user/${phone}`);
      
      if (response.data.success) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error.response ? error.response.data : error.message);
      return null;
    }
  }
}

export default new UserService()
