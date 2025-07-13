import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../config/firebase';

const auth = getAuth(app);

class AuthService {
  constructor() {
    this.currentUser = null;
    this.idToken = null;
  }

  // Initialize auth listener
  init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          try {
            this.idToken = await user.getIdToken();
            localStorage.setItem('firebaseIdToken', this.idToken);
          } catch (error) {
            console.error('Error getting ID token:', error);
            this.idToken = null;
          }
        } else {
          this.idToken = null;
          localStorage.removeItem('firebaseIdToken');
        }
        resolve(user);
      });
    });
  }

  // Get current Firebase user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current ID token (refresh if needed)
  async getIdToken(forceRefresh = false) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      this.idToken = await this.currentUser.getIdToken(forceRefresh);
      localStorage.setItem('firebaseIdToken', this.idToken);
      return this.idToken;
    } catch (error) {
      console.error('Error getting ID token:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.idToken;
  }

  // Sign out
  async signOut() {
    try {
      await auth.signOut();
      this.currentUser = null;
      this.idToken = null;
      localStorage.removeItem('firebaseIdToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}

export default new AuthService();
