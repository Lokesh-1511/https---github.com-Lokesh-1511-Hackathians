import { db } from '../config/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import api from '../api/index.js'
import authService from './authService.js'

class ConsumerService {
  constructor() {
    this.ordersCollection = 'orders'
    this.cartsCollection = 'carts'
    this.bidsCollection = 'bids'
    this.savedFarmersCollection = 'savedFarmers'
    this.paymentsCollection = 'payments'
  }

  // Cart Management
  async saveCartToFirestore(consumerPhone, cartItems) {
    try {
      const cartRef = doc(db, this.cartsCollection, consumerPhone)
      await updateDoc(cartRef, {
        items: cartItems,
        updatedAt: serverTimestamp()
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(cartRef, {
            items: cartItems,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
      })
      console.log('Cart saved to Firestore')
      return true
    } catch (error) {
      console.error('Firestore cart save failed, using API fallback:', error)
      try {
        const response = await api.post('/api/cart/save', {
          phoneNumber: consumerPhone,
          cartItems
        })
        console.log('Cart saved via API')
        return true
      } catch (apiError) {
        console.error('API cart save also failed:', apiError)
        return false
      }
    }
  }

  async getCartFromFirestore(consumerPhone) {
    try {
      const cartRef = doc(db, this.cartsCollection, consumerPhone)
      const cartDoc = await getDoc(cartRef)
      if (cartDoc.exists()) {
        console.log('Cart retrieved from Firestore')
        return cartDoc.data().items || []
      }
      return []
    } catch (error) {
      console.error('Firestore cart retrieval failed, using API fallback:', error)
      try {
        const response = await api.get(`/api/cart/${consumerPhone}`)
        console.log('Cart retrieved via API')
        return response.data.items || []
      } catch (apiError) {
        console.error('API cart retrieval also failed:', apiError)
        return []
      }
    }
  }

  async clearCart(consumerPhone) {
    try {
      const cartRef = doc(db, this.cartsCollection, consumerPhone)
      await updateDoc(cartRef, {
        items: [],
        updatedAt: serverTimestamp()
      })
      console.log('Cart cleared from Firestore')
      return true
    } catch (error) {
      console.error('Firestore cart clear failed, using API fallback:', error)
      try {
        await api.delete(`/api/cart/${consumerPhone}`)
        console.log('Cart cleared via API')
        return true
      } catch (apiError) {
        console.error('API cart clear also failed:', apiError)
        return false
      }
    }
  }

  // Order Management
  async createOrder(orderData) {
    try {
      const order = {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const docRef = await addDoc(collection(db, this.ordersCollection), order)
      return { success: true, orderId: docRef.id }
    } catch (error) {
      console.error('Error creating order:', error)
      return { success: false, error: error.message }
    }
  }

  async getOrdersByConsumer(consumerPhone) {
    try {
      const q = query(
        collection(db, this.ordersCollection),
        where('consumerPhone', '==', consumerPhone)
      )
      const querySnapshot = await getDocs(q)
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      
      // Sort by createdAt in JavaScript instead of Firestore
      return orders.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()))
    } catch (error) {
      console.error('Error getting orders:', error)
      return []
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = doc(db, this.ordersCollection, orderId)
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error updating order status:', error)
      return false
    }
  }

  // Bid Management
  async placeBid(bidData) {
    try {
      const bid = {
        ...bidData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const docRef = await addDoc(collection(db, this.bidsCollection), bid)
      return { success: true, bidId: docRef.id }
    } catch (error) {
      console.error('Error placing bid:', error)
      return { success: false, error: error.message }
    }
  }

  async createBid(bidData) {
    try {
      const bid = {
        ...bidData,
        status: bidData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const docRef = await addDoc(collection(db, this.bidsCollection), bid)
      return { success: true, bidId: docRef.id }
    } catch (error) {
      console.error('Error creating bid:', error)
      return { success: false, error: error.message }
    }
  }

  async getBidsByConsumer(consumerPhone) {
    try {
      const q = query(
        collection(db, this.bidsCollection),
        where('consumerPhone', '==', consumerPhone)
      )
      const querySnapshot = await getDocs(q)
      const bids = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      
      // Sort by createdAt in JavaScript instead of Firestore
      return bids.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()))
    } catch (error) {
      console.error('Error getting bids:', error)
      return []
    }
  }

  // Saved Farmers Management
  async saveFarmer(consumerPhone, farmerData) {
    try {
      const savedFarmersRef = doc(db, this.savedFarmersCollection, consumerPhone)
      
      // Get current document
      const docSnap = await getDoc(savedFarmersRef)
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(savedFarmersRef, {
          farmers: arrayUnion(farmerData),
          updatedAt: serverTimestamp()
        })
      } else {
        // Create new document
        await setDoc(savedFarmersRef, {
          consumerPhone,
          farmers: [farmerData],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      return true
    } catch (error) {
      console.error('Error saving farmer:', error)
      return false
    }
  }

  async unsaveFarmer(consumerPhone, farmerData) {
    try {
      const savedFarmersRef = doc(db, this.savedFarmersCollection, consumerPhone)
      await updateDoc(savedFarmersRef, {
        farmers: arrayRemove(farmerData),
        updatedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Error unsaving farmer:', error)
      return false
    }
  }

  async getSavedFarmers(consumerPhone) {
    try {
      const savedFarmersRef = doc(db, this.savedFarmersCollection, consumerPhone)
      const savedFarmersDoc = await getDoc(savedFarmersRef)
      if (savedFarmersDoc.exists()) {
        return savedFarmersDoc.data().farmers || []
      }
      return []
    } catch (error) {
      console.error('Error getting saved farmers:', error)
      return []
    }
  }

  // Payment Management
  async savePayment(paymentData) {
    try {
      const payment = {
        ...paymentData,
        createdAt: serverTimestamp()
      }
      const docRef = await addDoc(collection(db, this.paymentsCollection), payment)
      return { success: true, paymentId: docRef.id }
    } catch (error) {
      console.error('Error saving payment:', error)
      return { success: false, error: error.message }
    }
  }

  // Statistics
  async getConsumerStats(consumerPhone) {
    try {
      const [orders, bids, savedFarmers] = await Promise.all([
        this.getOrdersByConsumer(consumerPhone),
        this.getBidsByConsumer(consumerPhone),
        this.getSavedFarmers(consumerPhone)
      ])

      const completedOrders = orders.filter(order => order.status === 'completed')
      const activeBids = bids.filter(bid => bid.status === 'active')
      
      const totalSpent = completedOrders.reduce((sum, order) => {
        return sum + (order.totalAmount || 0)
      }, 0)

      const totalPurchases = completedOrders.length
      const totalProducts = completedOrders.reduce((sum, order) => {
        return sum + (order.items?.length || 0)
      }, 0)

      return {
        totalPurchases,
        totalProducts,
        activeBids: activeBids.length,
        savedFarmers: savedFarmers.length,
        totalSpent,
        recentOrders: orders.slice(0, 5),
        pendingOrders: orders.filter(order => order.status === 'pending').length
      }
    } catch (error) {
      console.error('Error getting consumer stats:', error)
      return {
        totalPurchases: 0,
        totalProducts: 0,
        activeBids: 0,
        savedFarmers: 0,
        totalSpent: 0,
        recentOrders: [],
        pendingOrders: 0
      }
    }
  }
}

export const consumerService = new ConsumerService()
