const ethers = require('ethers');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { rpcUrl, privateKey, contractAddress, abi } = require('./config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'your-groq-api-key-here';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Market data simulation (in a real app, this would come from market APIs)
const MARKET_DATA = {
  tomato: { current: 40, trend: 'rising', demand: 'high', season: 'peak' },
  potato: { current: 25, trend: 'stable', demand: 'medium', season: 'off-peak' },
  onion: { current: 35, trend: 'falling', demand: 'low', season: 'peak' },
  rice: { current: 45, trend: 'rising', demand: 'high', season: 'harvest' },
  wheat: { current: 42, trend: 'stable', demand: 'medium', season: 'post-harvest' }
};

class SmartFarmingAgent {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
  }

  async callGroqAPI(prompt, systemMessage = "You are a helpful farming and market advisor.") {
    try {
      const response = await axios.post(GROQ_API_URL, {
        model: "llama-3.1-70b-versatile", // Fast Groq model
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('🚨 Error calling Groq API:', error.response?.data || error.message);
      return "I'm sorry, I couldn't process your request at the moment. Please try again.";
    }
  }

  async getMarketAdvice(crop, quantity, farmerPrice, buyerOffers = []) {
    const marketInfo = MARKET_DATA[crop.toLowerCase()] || { current: 30, trend: 'unknown', demand: 'medium', season: 'regular' };
    
    const systemMessage = `You are an expert agricultural market advisor helping farmers in India. You understand:
    - Local market dynamics and pricing
    - Seasonal variations in crop prices
    - Supply and demand factors
    - Negotiation strategies for farmers
    
    Always provide practical, actionable advice in simple language. Consider the farmer's perspective and help them get fair prices.`;

    const prompt = `
    A farmer has ${quantity}kg of ${crop} to sell.
    
    Market Information:
    - Current market price: ₹${marketInfo.current}/kg
    - Price trend: ${marketInfo.trend}
    - Demand level: ${marketInfo.demand}
    - Season status: ${marketInfo.season}
    
    Farmer's Information:
    - Farmer's asking price: ₹${farmerPrice}/kg
    - Quantity available: ${quantity}kg
    
    ${buyerOffers.length > 0 ? `
    Buyer Offers Received:
    ${buyerOffers.map((offer, i) => `${i+1}. ${offer.name}: ₹${offer.price}/kg for ${offer.quantity}kg`).join('\n')}
    ` : 'No buyer offers received yet.'}
    
    Please provide:
    1. Analysis of the farmer's asking price vs market price
    2. Recommendation on whether to accept, reject, or counter any offers
    3. Suggested negotiation strategy
    4. Market trend explanation and timing advice
    5. Simple, practical advice in farmer-friendly language
    
    Keep the response concise but comprehensive, and focus on helping the farmer maximize their profit while being realistic about market conditions.`;

    return await this.callGroqAPI(prompt, systemMessage);
  }

  async getNegotiationHelp(crop, farmerPrice, buyerOffer, buyerName) {
    const systemMessage = `You are a negotiation expert helping farmers get fair deals. Provide specific negotiation tactics and responses that farmers can use in their conversations with buyers.`;

    const prompt = `
    Negotiation Scenario:
    - Crop: ${crop}
    - Farmer's asking price: ₹${farmerPrice}/kg
    - Buyer's offer: ₹${buyerOffer}/kg
    - Buyer name: ${buyerName}
    
    Help the farmer with:
    1. Whether this offer is fair based on market conditions
    2. Specific counter-offer suggestions
    3. Key negotiation points to mention
    4. How to justify their asking price
    5. When to walk away vs when to compromise
    
    Provide actual phrases and responses the farmer can use in the negotiation.`;

    return await this.callGroqAPI(prompt, systemMessage);
  }

  async getMarketTrends(crop) {
    const systemMessage = `You are a market analyst specializing in Indian agricultural markets. Explain market trends in simple terms that farmers can understand and act upon.`;

    const marketInfo = MARKET_DATA[crop.toLowerCase()] || { current: 30, trend: 'unknown', demand: 'medium', season: 'regular' };

    const prompt = `
    Explain the current market situation for ${crop}:
    - Current price: ₹${marketInfo.current}/kg
    - Trend: ${marketInfo.trend}
    - Demand: ${marketInfo.demand}
    - Season: ${marketInfo.season}
    
    Provide:
    1. Why prices are moving in this direction
    2. What farmers should expect in the next 2-4 weeks
    3. Best timing strategies for selling
    4. Factors that could change the market
    5. Simple actionable advice
    
    Use simple language that any farmer can understand, avoiding technical jargon.`;

    return await this.callGroqAPI(prompt, systemMessage);
  }

  async searchBlockchainBuyers(item, quantity, minPrice) {
    try {
      console.log('🔍 Searching blockchain for buyers...');
      const result = await this.contract.getMatchingBuyer(
        item, 
        quantity, 
        ethers.parseUnits(minPrice.toString(), 'ether')
      );
      
      if (result.buyer !== ethers.ZeroAddress) {
        return {
          found: true,
          buyer: {
            address: result.buyer,
            name: result.name,
            item: result.item,
            quantity: Number(result.quantity),
            pricePerKg: Number(ethers.formatUnits(result.pricePerKg, 'ether'))
          }
        };
      }
      return { found: false };
    } catch (error) {
      console.error('⚠️ Error searching blockchain:', error.message);
      return { found: false, error: error.message };
    }
  }

  async run() {
    console.log('\n🤖 Welcome to your Smart Farming AI Assistant!');
    console.log('💡 I can help you with market prices, negotiations, and selling decisions.');
    
    // Get farmer details
    const farmerName = await ask('👨‍🌾 What\'s your name? ');
    const crop = await ask('🌾 What crop are you selling? ');
    const quantity = parseInt(await ask('⚖️ How many kg do you have? '), 10);
    const farmerPrice = parseFloat(await ask('💰 What price per kg are you hoping for? ₹'));

    console.log(`\n📊 Let me analyze the market for ${crop}...\n`);

    // Get AI market analysis
    const marketAdvice = await this.getMarketAdvice(crop, quantity, farmerPrice);
    console.log('🎯 MARKET ANALYSIS:');
    console.log('═'.repeat(50));
    console.log(marketAdvice);
    console.log('═'.repeat(50));

    // Search for buyers on blockchain
    const buyerSearch = await this.searchBlockchainBuyers(crop, quantity, farmerPrice);
    
    if (buyerSearch.found) {
      console.log(`\n✅ Great news! Found a buyer on the blockchain:`);
      console.log(`   🏪 ${buyerSearch.buyer.name}`);
      console.log(`   💰 Offering: ₹${buyerSearch.buyer.pricePerKg}/kg`);
      console.log(`   📦 Wants: ${buyerSearch.buyer.quantity}kg of ${buyerSearch.buyer.item}`);

      // Get negotiation advice for this specific offer
      const negotiationAdvice = await this.getNegotiationHelp(
        crop, 
        farmerPrice, 
        buyerSearch.buyer.pricePerKg, 
        buyerSearch.buyer.name
      );
      
      console.log('\n🤝 NEGOTIATION ADVICE:');
      console.log('═'.repeat(50));
      console.log(negotiationAdvice);
      console.log('═'.repeat(50));

      const decision = await ask('\n❓ What would you like to do? (accept/counter/reject/trends): ');
      
      switch(decision.toLowerCase()) {
        case 'accept':
          console.log('✅ Good choice! The AI analysis supports this decision.');
          break;
        case 'counter':
          const counterPrice = await ask('💵 What counter-offer would you like to make? ₹');
          const counterAdvice = await this.getNegotiationHelp(crop, counterPrice, buyerSearch.buyer.pricePerKg, buyerSearch.buyer.name);
          console.log('\n📋 Counter-offer strategy:');
          console.log(counterAdvice);
          break;
        case 'reject':
          console.log('❌ Understood. The AI can help you find better opportunities.');
          break;
        case 'trends':
          const trends = await this.getMarketTrends(crop);
          console.log('\n📈 MARKET TRENDS:');
          console.log('═'.repeat(50));
          console.log(trends);
          console.log('═'.repeat(50));
          break;
      }
    } else {
      console.log('\n❌ No buyers found on blockchain at your expected price.');
      
      const trends = await this.getMarketTrends(crop);
      console.log('\n📈 MARKET TRENDS & TIMING ADVICE:');
      console.log('═'.repeat(50));
      console.log(trends);
      console.log('═'.repeat(50));
    }

    const nextAction = await ask('\n❓ Need more help? (price-check/negotiate/trends/exit): ');
    
    if (nextAction.toLowerCase() !== 'exit') {
      switch(nextAction.toLowerCase()) {
        case 'price-check':
          const newPrice = await ask('💰 What price are you considering? ₹');
          const priceAdvice = await this.getMarketAdvice(crop, quantity, parseFloat(newPrice));
          console.log('\n📊 PRICE ANALYSIS:');
          console.log(priceAdvice);
          break;
        case 'negotiate':
          const buyerOffer = await ask('💵 What is the buyer offering? ₹');
          const negAdvice = await this.getNegotiationHelp(crop, farmerPrice, parseFloat(buyerOffer), 'Buyer');
          console.log('\n🤝 NEGOTIATION STRATEGY:');
          console.log(negAdvice);
          break;
        case 'trends':
          const trendAnalysis = await this.getMarketTrends(crop);
          console.log('\n📈 DETAILED MARKET TRENDS:');
          console.log(trendAnalysis);
          break;
      }
    }

    console.log(`\n🙏 Thank you ${farmerName}! Good luck with your ${crop} sales!`);
    console.log('💚 Remember: Knowledge is power in farming business!');
    
    rl.close();
  }
}

// Run the smart agent
if (require.main === module) {
  const agent = new SmartFarmingAgent();
  agent.run().catch(console.error);
}

module.exports = { SmartFarmingAgent };
