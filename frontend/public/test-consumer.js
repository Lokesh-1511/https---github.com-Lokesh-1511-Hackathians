// Test script for Consumer Dashboard fixes
// Run this in the browser console at http://localhost:5174

console.log('🧪 AgriChain Consumer Dashboard Test Script')
console.log('==========================================')

// Replace this with your actual phone number from login
const TEST_PHONE = '+911234567890' // Change this to your actual phone number

async function testConsumerFeatures() {
  console.log('🚀 Starting Consumer Dashboard tests...')
  
  try {
    // 1. Test Statistics Fix
    console.log('\n📊 Testing Statistics...')
    console.log('Creating test data to fix stats...')
    const statsResult = await AgriChainTest.fixStats(TEST_PHONE)
    console.log('Stats result:', statsResult)
    
    // 2. Test Saved Farmers
    console.log('\n❤️ Testing Saved Farmers...')
    const testFarmer = {
      phone: '+919876543999',
      name: 'Test Farmer',
      location: 'Test Location'
    }
    
    await AgriChainTest.consumer.saveFarmer(TEST_PHONE, testFarmer)
    console.log('✅ Farmer saved successfully')
    
    const savedFarmers = await AgriChainTest.consumer.getSavedFarmers(TEST_PHONE)
    console.log('📝 Saved farmers:', savedFarmers)
    
    // 3. Test Cart Functionality
    console.log('\n🛒 Testing Cart...')
    const cart = await AgriChainTest.consumer.getCart(TEST_PHONE)
    console.log('Current cart:', cart)
    
    // 4. Check Final Stats
    console.log('\n📈 Final Stats Check...')
    const finalStats = await AgriChainTest.consumer.getStats(TEST_PHONE)
    console.log('Final stats:', finalStats)
    
    console.log('\n🎉 All tests completed!')
    console.log('📱 Now refresh the dashboard to see updated statistics!')
    
    return {
      success: true,
      stats: finalStats,
      savedFarmers: savedFarmers,
      cart: cart
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error }
  }
}

// Instructions
console.log('\n📋 Instructions:')
console.log('1. Make sure you are logged in as a consumer')
console.log('2. Update TEST_PHONE variable with your actual phone number')
console.log('3. Run: testConsumerFeatures()')
console.log('4. After completion, refresh the dashboard or click "Refresh" button')
console.log('\n💡 Quick commands:')
console.log('- testConsumerFeatures() // Run all tests')
console.log('- AgriChainTest.fixStats("YOUR_PHONE") // Fix stats only')
console.log('- AgriChainTest.checkStats("YOUR_PHONE") // Check current stats')

// Make the test function available globally
window.testConsumerFeatures = testConsumerFeatures
