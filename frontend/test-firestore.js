import { db } from './src/config/firebase.js'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'

// Simple test to verify Firestore is working
async function testFirestore() {
  try {
    console.log('🔥 Testing Firestore connection...')
    
    // Test adding a document
    const testProduct = {
      name: 'Test Tomato',
      price: '₹50/kg',
      quantity: '100 kg',
      category: 'vegetables',
      farmerPhone: '+919999999999',
      farmerName: 'Test Farmer',
      status: 'Available',
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'products'), testProduct)
    console.log('✅ Test product added with ID:', docRef.id)
    
    // Test reading documents
    const querySnapshot = await getDocs(collection(db, 'products'))
    const products = []
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() })
    })
    
    console.log('📦 All products:', products)
    console.log('🎉 Firestore test completed successfully!')
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error)
  }
}

testFirestore()
