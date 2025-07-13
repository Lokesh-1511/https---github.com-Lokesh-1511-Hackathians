// Developer console utilities for testing AgriChain
// Open browser console and run these commands to test functionality

import { sampleProducts, addSampleProducts, clearAllProducts } from '../utils/testData'
import { productService } from '../services/productService'
import { consumerService } from '../services/consumerService'
import { escrowService } from '../services/escrowService'

// Make utilities available globally for testing
window.AgriChainTest = {
  // Product testing
  products: {
    addSample: addSampleProducts,
    clearAll: clearAllProducts,
    getAll: () => productService.getAllProducts(),
    add: (data) => productService.addProduct(data),
    delete: (id) => productService.deleteProduct(id),
    sampleData: sampleProducts
  },

  // Consumer testing
  consumer: {
    addToCart: (userId, productId, quantity) => consumerService.addToCart(userId, productId, quantity),
    getCart: (userId) => consumerService.getCartFromFirestore(userId),
    clearCart: (userId) => consumerService.clearCart(userId),
    createOrder: (orderData) => consumerService.createOrder(orderData),
    getOrders: (userId) => consumerService.getOrdersByConsumer(userId),
    createBid: (bidData) => consumerService.createBid(bidData),
    getBids: (userId) => consumerService.getBidsByConsumer(userId),
    saveFarmer: (userId, farmerData) => consumerService.saveFarmer(userId, farmerData),
    getSavedFarmers: (userId) => consumerService.getSavedFarmers(userId),
    getStats: (userId) => consumerService.getConsumerStats(userId)
  },

  // Payment testing
  payment: {
    processPayment: (paymentData) => paymentService.processPayment(paymentData),
    createOrder: (orderData) => paymentService.createOrder(orderData),
    formatCurrency: (amount) => paymentService.formatCurrency(amount),
    calculateTotal: (items) => escrowService.calculateOrderTotal(items)
  },

  // Escrow testing
  escrow: {
    createDeal: (dealData) => escrowService.createEscrowDeal(dealData),
    verifyOTP: (dealId, otp, buyerPhone) => escrowService.verifyOTPAndCompletePayment(dealId, otp, buyerPhone),
    getDeals: (userPhone, role) => role === 'farmer' ? escrowService.getFarmerDeals(userPhone) : escrowService.getConsumerDeals(userPhone),
    getOTPs: (farmerPhone) => escrowService.getFarmerOTPs(farmerPhone)
  },

  // Test data creation
  async createTestOrder(consumerPhone = '+911234567890') {
    const testOrder = {
      consumerPhone,
      items: [
        { id: '1', name: 'Test Brinjal', price: 50, quantity: 2 },
        { id: '2', name: 'Test Tomato', price: 30, quantity: 3 }
      ],
      totalAmount: 190,
      status: 'completed',
      farmerPhone: '+919876543210',
      deliveryAddress: 'Test Address'
    }
    
    const result = await this.consumer.createOrder(testOrder)
    console.log('Test order created:', result)
    return result
  },

  async createTestBid(consumerPhone = '+911234567890') {
    const testBid = {
      consumerPhone,
      productId: 'test-product-1',
      amount: 100,
      status: 'active',
      message: 'Test bid for testing stats'
    }
    
    const result = await this.consumer.createBid(testBid)
    console.log('Test bid created:', result)
    return result
  },

  async checkStats(consumerPhone = '+911234567890') {
    console.log('📊 Checking consumer stats for:', consumerPhone)
    const stats = await this.consumer.getStats(consumerPhone)
    console.log('Current stats:', stats)
    
    // Also check raw data
    const orders = await this.consumer.getOrders(consumerPhone)
    const bids = await this.consumer.getBids(consumerPhone)
    const savedFarmers = await this.consumer.getSavedFarmers(consumerPhone)
    
    console.log('Raw data:')
    console.log('- Orders:', orders)
    console.log('- Bids:', bids)
    console.log('- Saved Farmers:', savedFarmers)
    
    return { stats, orders, bids, savedFarmers }
  },

  async fixStats(consumerPhone = '+911234567890') {
    console.log('🔧 Fixing stats by creating test data for:', consumerPhone)
    
    try {
      // Create multiple test orders with different statuses
      const orders = [
        {
          consumerPhone,
          items: [
            { id: '1', name: 'Fresh Brinjal', price: 50, quantity: 2 },
            { id: '2', name: 'Organic Tomato', price: 30, quantity: 3 }
          ],
          totalAmount: 190,
          status: 'completed',
          farmerPhone: '+919876543210',
          deliveryAddress: 'Test Address 1'
        },
        {
          consumerPhone,
          items: [
            { id: '3', name: 'Fresh Carrot', price: 40, quantity: 5 }
          ],
          totalAmount: 200,
          status: 'completed',
          farmerPhone: '+919876543211',
          deliveryAddress: 'Test Address 2'
        },
        {
          consumerPhone,
          items: [
            { id: '4', name: 'Green Beans', price: 60, quantity: 1 }
          ],
          totalAmount: 60,
          status: 'pending',
          farmerPhone: '+919876543212',
          deliveryAddress: 'Test Address 3'
        }
      ]

      // Create test bids
      const bids = [
        {
          consumerPhone,
          productId: 'test-product-1',
          amount: 100,
          status: 'active',
          message: 'Interested in bulk purchase'
        },
        {
          consumerPhone,
          productId: 'test-product-2',
          amount: 150,
          status: 'active',
          message: 'Looking for organic produce'
        }
      ]

      // Create orders
      for (const order of orders) {
        await this.consumer.createOrder(order)
        console.log('✅ Created order:', order.totalAmount)
      }

      // Create bids
      for (const bid of bids) {
        await this.consumer.createBid(bid)
        console.log('✅ Created bid:', bid.amount)
      }

      // Save some farmers
      const testFarmers = [
        { phone: '+919876543210', name: 'Ravi Kumar', location: 'Tamil Nadu' },
        { phone: '+919876543211', name: 'Suresh Patel', location: 'Gujarat' }
      ]

      for (const farmer of testFarmers) {
        await this.consumer.saveFarmer(consumerPhone, farmer)
        console.log('✅ Saved farmer:', farmer.name)
      }

      // Check updated stats
      const result = await this.checkStats(consumerPhone)
      console.log('🎉 Stats fixed! Results:', result.stats)
      return result
    } catch (error) {
      console.error('❌ Error fixing stats:', error)
      return { success: false, error }
    }
  },

  // Quick setup for testing
  async quickSetup() {
    console.log('🚀 Setting up AgriChain test environment...')
    
    try {
      // Clear existing data
      await this.products.clearAll()
      console.log('✅ Cleared existing products')
      
      // Add sample products
      const products = await this.products.addSample()
      console.log(`✅ Added ${products.length} sample products`)
      
      console.log('🎉 Test environment ready!')
      console.log('')
      console.log('🧪 Available test commands:')
      console.log('- AgriChainTest.fixStats("YOUR_PHONE_NUMBER") // Create test data and fix stats')
      console.log('- AgriChainTest.checkStats("YOUR_PHONE_NUMBER") // Check current stats')
      console.log('- AgriChainTest.createTestOrder("YOUR_PHONE_NUMBER") // Create test order')
      console.log('- AgriChainTest.createTestBid("YOUR_PHONE_NUMBER") // Create test bid')
      console.log('')
      console.log('📱 Replace YOUR_PHONE_NUMBER with your actual phone number (e.g., "+911234567890")')
      console.log('')
      console.log('Other commands:')
      console.log('- AgriChainTest.products.getAll() // Get all products')
      console.log('- AgriChainTest.consumer.getCart("YOUR_PHONE_NUMBER") // Get cart')
      console.log('- AgriChainTest.consumer.getOrders("YOUR_PHONE_NUMBER") // Get orders')
      
      return { success: true, products }
    } catch (error) {
      console.error('❌ Setup failed:', error)
      return { success: false, error }
    }
  },

  // Test consumer flow
  async testConsumerFlow(userId = 'test-consumer-123') {
    console.log(`🛒 Testing consumer flow for user: ${userId}`)
    
    try {
      // Get products
      const products = await this.products.getAll()
      console.log(`📦 Available products: ${products.length}`)
      
      if (products.length === 0) {
        console.log('No products found, adding sample products...')
        await this.products.addSample()
      }
      
      // Add items to cart
      await this.consumer.addToCart(userId, 'p1', 2)
      await this.consumer.addToCart(userId, 'p2', 1)
      console.log('✅ Added items to cart')
      
      // Get cart
      const cart = await this.consumer.getCart(userId)
      console.log('🛒 Cart items:', cart)
      
      // Calculate total
      const total = this.payment.calculateTotal(cart.map(item => ({
        price: item.price,
        quantity: item.quantity
      })))
      console.log('💰 Cart total:', this.payment.formatCurrency(total))
      
      // Get stats
      const stats = await this.consumer.getStats(userId)
      console.log('📊 Consumer stats:', stats)
      
      console.log('🎉 Consumer flow test completed!')
      return { success: true, cart, total, stats }
    } catch (error) {
      console.error('❌ Consumer flow test failed:', error)
      return { success: false, error }
    }
  }
}

// Auto-expose for development
if (typeof window !== 'undefined') {
  console.log('🧪 AgriChain Test Utilities Loaded!')
  console.log('Run AgriChainTest.quickSetup() to set up test data')
  console.log('Run AgriChainTest.testConsumerFlow() to test consumer functionality')
}
