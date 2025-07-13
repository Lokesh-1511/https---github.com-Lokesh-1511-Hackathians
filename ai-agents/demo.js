// Test script to demonstrate AI agent capabilities without requiring user input
const { MultilingualFarmingAgent } = require('./multilingual-agent');
const config = require('./enhanced-config');

async function runDemo() {
  console.log('🧪 AgriChain AI Agent Demo');
  console.log('═'.repeat(50));
  
  // Check if Groq API key is configured
  const hasGroqKey = config.groqApiKey && config.groqApiKey !== 'your_groq_api_key_here';
  
  if (!hasGroqKey) {
    console.log('⚠️  Groq API key not configured. Demo will show fallback responses.');
    console.log('💡 To get full AI features:');
    console.log('   1. Get free API key from https://console.groq.com');
    console.log('   2. Add GROQ_API_KEY=your_key to .env file');
    console.log('   3. Run the demo again');
    console.log('');
  } else {
    console.log('✅ Groq API configured - Full AI features available!');
    console.log('');
  }

  const agent = new MultilingualFarmingAgent();
  
  // Demo scenario
  console.log('📋 Demo Scenario:');
  console.log('   Farmer: Ravi Kumar');
  console.log('   Crop: Tomatoes');
  console.log('   Quantity: 500 kg');
  console.log('   Expected Price: ₹45/kg');
  console.log('');

  // Get market advice
  console.log('🎯 AI MARKET ANALYSIS:');
  console.log('═'.repeat(50));
  
  const marketAdvice = await agent.getMarketAdvice('tomato', 500, 45);
  console.log(marketAdvice);
  console.log('═'.repeat(50));
  console.log('');

  // Demo negotiation scenario
  console.log('🤝 NEGOTIATION SCENARIO:');
  console.log('   Buyer Offer: ₹42/kg from Mumbai Fresh Mart');
  console.log('');
  
  console.log('💡 NEGOTIATION ADVICE:');
  console.log('═'.repeat(50));
  
  const negotiationAdvice = await agent.getNegotiationHelp('tomato', 45, 42, 'Mumbai Fresh Mart');
  console.log(negotiationAdvice);
  console.log('═'.repeat(50));
  console.log('');

  // Test blockchain connection
  console.log('🔗 BLOCKCHAIN CONNECTION TEST:');
  if (config.rpcUrl && config.contractAddress) {
    console.log('✅ Blockchain configuration found');
    console.log(`   RPC: ${config.rpcUrl}`);
    console.log(`   Contract: ${config.contractAddress}`);
    
    try {
      const result = await agent.searchBlockchainBuyers('tomato', 500, 45);
      if (result.found) {
        console.log('✅ Buyer found on blockchain!');
        console.log(`   Name: ${result.buyer.name}`);
        console.log(`   Price: ₹${result.buyer.pricePerKg}/kg`);
        console.log(`   Quantity: ${result.buyer.quantity}kg`);
      } else {
        console.log('❌ No buyers found at expected price');
      }
    } catch (error) {
      console.log('⚠️  Blockchain connection error:', error.message);
    }
  } else {
    console.log('⚠️  Blockchain not configured (optional)');
    console.log('   Add RPC_URL and CONTRACT_ADDRESS to .env for blockchain features');
  }
  
  console.log('');
  console.log('🚀 Demo completed! To interact with the full agent:');
  console.log('   Run: node multilingual-agent.js');
  console.log('   Or: npm run farmer-agent');
  console.log('');
  console.log('💚 Ready to help farmers make better decisions!');
}

// Run demo if this script is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };
