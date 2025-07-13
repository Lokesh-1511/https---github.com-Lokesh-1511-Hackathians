import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTION_NAME = 'products'

// Test Firestore connection
const testFirestoreConnection = async () => {
  try {
    console.log('🔥 Testing Firestore connection...')
    console.log('Database instance:', db)
    const testCollection = collection(db, 'test')
    console.log('✅ Firestore connection successful')
    return true
  } catch (error) {
    console.error('❌ Firestore connection failed:', error)
    return false
  }
}

export const productService = {
  // Add a new product
  async addProduct(productData) {
    try {
      console.log('🔥 Adding product to Firestore:', productData)
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('✅ Product added with ID:', docRef.id)
      return { id: docRef.id, ...productData }
    } catch (error) {
      console.error('❌ Error adding product to Firestore:', error)
      throw error
    }
  },

  // Get all products
  async getAllProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
      const products = []
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort manually by createdAt (newest first)
      products.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime
      })
      
      return products
    } catch (error) {
      console.error('Error getting products:', error)
      throw error
    }
  },

  // Get products by farmer phone
  async getProductsByFarmer(farmerPhone) {
    try {
      console.log('🔍 Getting products for farmer:', farmerPhone)
      
      // Simple query without orderBy to avoid index requirement
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('farmerPhone', '==', farmerPhone)
      )
      
      const querySnapshot = await getDocs(q)
      const products = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        products.push({ 
          id: doc.id, 
          ...data,
          // Ensure we have a createdAt field for sorting
          createdAt: data.createdAt || { seconds: Date.now() / 1000 }
        })
      })
      
      // Sort manually by createdAt (newest first)
      products.sort((a, b) => {
        const aTime = a.createdAt?.seconds || Date.now() / 1000
        const bTime = b.createdAt?.seconds || Date.now() / 1000
        return bTime - aTime
      })
      
      console.log('📦 Found products:', products)
      return products
    } catch (error) {
      console.error('❌ Error getting farmer products:', error)
      
      // Fallback: try to get all products and filter client-side
      try {
        console.log('🔄 Trying fallback method...')
        const allProducts = await this.getAllProducts()
        const farmerProducts = allProducts.filter(product => product.farmerPhone === farmerPhone)
        console.log('📦 Fallback found products:', farmerProducts)
        return farmerProducts
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        throw error
      }
    }
  },

  // Update a product
  async updateProduct(productId, updates) {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId)
      await updateDoc(productRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      return { id: productId, ...updates }
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, productId))
      return productId
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }
}
