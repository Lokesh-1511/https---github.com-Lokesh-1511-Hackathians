// Test data utility for populating the app with sample data
import { productService } from '../services/productService'

export const sampleProducts = [
  {
    id: 'p1',
    name: 'Fresh Tomatoes',
    category: 'vegetables',
    quantity: 50,
    unit: 'kg',
    price: 40,
    description: 'Fresh organic tomatoes from our farm',
    location: 'Chennai',
    farmer: 'Karthi Farm',
    farmerId: 'farmer1',
    harvestDate: '2024-01-10',
    qualityGrade: 'A',
    imageUrl: '',
    status: 'available'
  },
  {
    id: 'p2',
    name: 'Organic Rice',
    category: 'grains',
    quantity: 100,
    unit: 'kg',
    price: 60,
    description: 'Premium quality organic basmati rice',
    location: 'Thanjavur',
    farmer: 'Raman Farm',
    farmerId: 'farmer2',
    harvestDate: '2024-01-05',
    qualityGrade: 'Premium',
    imageUrl: '',
    status: 'available'
  },
  {
    id: 'p3',
    name: 'Fresh Bananas',
    category: 'fruits',
    quantity: 30,
    unit: 'dozen',
    price: 25,
    description: 'Sweet and ripe bananas',
    location: 'Madurai',
    farmer: 'Kumar Farm',
    farmerId: 'farmer3',
    harvestDate: '2024-01-12',
    qualityGrade: 'A',
    imageUrl: '',
    status: 'available'
  },
  {
    id: 'p4',
    name: 'Coconut Oil',
    category: 'oils',
    quantity: 20,
    unit: 'liters',
    price: 180,
    description: 'Pure cold-pressed coconut oil',
    location: 'Coimbatore',
    farmer: 'Lakshmi Farm',
    farmerId: 'farmer4',
    harvestDate: '2024-01-08',
    qualityGrade: 'Premium',
    imageUrl: '',
    status: 'available'
  },
  {
    id: 'p5',
    name: 'Fresh Carrots',
    category: 'vegetables',
    quantity: 25,
    unit: 'kg',
    price: 35,
    description: 'Crunchy fresh carrots',
    location: 'Ooty',
    farmer: 'Murugan Farm',
    farmerId: 'farmer5',
    harvestDate: '2024-01-11',
    qualityGrade: 'A',
    imageUrl: '',
    status: 'available'
  }
]

// Function to add sample products to Firestore (for testing)
export const addSampleProducts = async () => {
  try {
    console.log('🌱 Adding sample products to Firestore...')
    const results = await Promise.all(
      sampleProducts.map(product => productService.addProduct(product))
    )
    console.log('✅ Sample products added successfully:', results.length)
    return results
  } catch (error) {
    console.error('❌ Error adding sample products:', error)
    throw error
  }
}

// Function to clear all products (for testing)
export const clearAllProducts = async () => {
  try {
    console.log('🗑️ Clearing all products...')
    const products = await productService.getAllProducts()
    const deletePromises = products.map(product => productService.deleteProduct(product.id))
    await Promise.all(deletePromises)
    console.log('✅ All products cleared')
  } catch (error) {
    console.error('❌ Error clearing products:', error)
    throw error
  }
}
