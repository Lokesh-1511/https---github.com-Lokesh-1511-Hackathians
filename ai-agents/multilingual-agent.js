const ethers = require('ethers');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const config = require('./enhanced-config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

// Language templates for common phrases
const LANGUAGE_TEMPLATES = {
  en: {
    welcome: "🤖 Welcome to your Smart Farming AI Assistant!",
    help_text: "💡 I can help you with market prices, negotiations, and selling decisions.",
    ask_name: "👨‍🌾 What's your name? ",
    ask_crop: "🌾 What crop are you selling? ",
    ask_quantity: "⚖️ How many kg do you have? ",
    ask_price: "💰 What price per kg are you hoping for? ₹",
    market_analysis: "🎯 MARKET ANALYSIS:",
    negotiation_advice: "🤝 NEGOTIATION ADVICE:",
    market_trends: "📈 MARKET TRENDS:",
    buyer_found: "✅ Great news! Found a buyer on the blockchain:",
    no_buyer: "❌ No buyers found on blockchain at your expected price.",
    thank_you: "🙏 Thank you {name}! Good luck with your {crop} sales!",
    knowledge_power: "💚 Remember: Knowledge is power in farming business!"
  },
  hi: {
    welcome: "🤖 आपके स्मार्ट कृषि AI सहायक में आपका स्वागत है!",
    help_text: "💡 मैं बाजार की कीमतों, बातचीत और बिक्री के फैसलों में आपकी मदद कर सकता हूं।",
    ask_name: "👨‍🌾 आपका नाम क्या है? ",
    ask_crop: "🌾 आप कौन सी फसल बेच रहे हैं? ",
    ask_quantity: "⚖️ आपके पास कितने किलो हैं? ",
    ask_price: "💰 आप प्रति किलो कितनी कीमत की उम्मीद कर रहे हैं? ₹",
    market_analysis: "🎯 बाजार विश्लेषण:",
    negotiation_advice: "🤝 बातचीत की सलाह:",
    market_trends: "📈 बाजार के रुझान:",
    buyer_found: "✅ बहुत अच्छी खबर! ब्लॉकचेन पर एक खरीदार मिला:",
    no_buyer: "❌ आपकी अपेक्षित कीमत पर ब्लॉकचेन पर कोई खरीदार नहीं मिला।",
    thank_you: "🙏 धन्यवाद {name}! आपकी {crop} की बिक्री के लिए शुभकामनाएं!",
    knowledge_power: "💚 याद रखें: किसानी के व्यापार में ज्ञान ही शक्ति है!"
  },
  ta: {
    welcome: "🤖 உங்கள் ஸ்மார்ட் விவசாய AI உதவியாளரிடம் வரவேற்கிறோம்!",
    help_text: "💡 சந்தை விலைகள், பேச்சுவார்த்தைகள் மற்றும் விற்பனை முடிவுகளில் உதவ முடியும்.",
    ask_name: "👨‍🌾 உங்கள் பெயர் என்ன? ",
    ask_crop: "🌾 நீங்கள் எந்த பயிரை விற்கிறீர்கள்? ",
    ask_quantity: "⚖️ உங்களிடம் எத்தனை கிலோ உள்ளது? ",
    ask_price: "💰 கிலோவுக்கு எவ்வளவு விலை எதிர்பார்க்கிறீர்கள்? ₹",
    market_analysis: "🎯 சந்தை பகுப்பாய்வு:",
    negotiation_advice: "🤝 பேச்சுவார்த்தை ஆலோசனை:",
    market_trends: "📈 சந்தை போக்குகள்:",
    buyer_found: "✅ நல்ல செய்தி! ப்ளாக்செயினில் ஒரு வாங்குபவர் கிடைத்துள்ளார்:",
    no_buyer: "❌ உங்கள் எதிர்பார்க்கும் விலையில் ப்ளாக்செயினில் வாங்குபவர் இல்லை.",
    thank_you: "🙏 நன்றி {name}! உங்கள் {crop} விற்பனைக்கு வாழ்த்துகள்!",
    knowledge_power: "💚 நினைவில் கொள்ளுங்கள்: விவசாய வணிகத்தில் அறிவே சக்தி!"
  }
};

class MultilingualFarmingAgent {
  constructor() {
    this.language = 'en'; // Default language
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    
    // Initialize blockchain connection if available
    if (config.rpcUrl && config.privateKey && config.contractAddress) {
      try {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = new ethers.Contract(config.contractAddress, config.abi, this.wallet);
      } catch (error) {
        console.log('⚠️ Blockchain connection failed. AI features will still work.');
      }
    }
  }

  getText(key, params = {}) {
    let text = LANGUAGE_TEMPLATES[this.language]?.[key] || LANGUAGE_TEMPLATES.en[key] || key;
    
    // Replace parameters in text
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }

  async selectLanguage() {
    console.log('\n🌐 Language / भाषा / மொழி Selection:');
    console.log('════════════════════════════════════════');
    
    Object.entries(config.languages).forEach(([code, name], index) => {
      console.log(`${index + 1}. ${name} (${code})`);
    });
    
    const choice = await ask('\nSelect language (1-10): ');
    const languageKeys = Object.keys(config.languages);
    const selectedIndex = parseInt(choice) - 1;
    
    if (selectedIndex >= 0 && selectedIndex < languageKeys.length) {
      this.language = languageKeys[selectedIndex];
      console.log(`✅ Language set to: ${config.languages[this.language]}\n`);
    } else {
      console.log('⚠️ Invalid selection. Using English.\n');
      this.language = 'en';
    }
  }

  async callGroqAPI(prompt, systemMessage) {
    if (!config.groqApiKey || config.groqApiKey === 'your_groq_api_key_here') {
      return this.getFallbackAdvice(prompt);
    }

    try {
      // Add language instruction to system message
      const languageInstruction = this.language !== 'en' 
        ? `\n\nIMPORTANT: Respond in ${config.languages[this.language]} language. Use simple, farmer-friendly language.`
        : '';

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: config.ai.groq.model,
        messages: [
          {
            role: "system",
            content: systemMessage + languageInstruction
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: config.ai.groq.temperature,
        max_tokens: config.ai.groq.maxTokens
      }, {
        headers: {
          'Authorization': `Bearer ${config.groqApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('🚨 Error calling Groq API:', error.response?.data || error.message);
      return this.getFallbackAdvice(prompt);
    }
  }

  getFallbackAdvice(prompt) {
    // Provide basic advice when AI API is not available
    const advice = {
      en: `Based on general market knowledge:
      
1. Check current market rates in your local mandi
2. Consider the season and demand for your crop
3. Don't accept the first offer - negotiate
4. Quality of produce affects price
5. Transportation costs should be factored in
6. Weather conditions can impact prices

For specific advice, please configure your Groq API key.`,
      
      hi: `सामान्य बाजार जानकारी के आधार पर:

1. अपनी स्थानीय मंडी में वर्तमान बाजार दरें जांचें
2. अपनी फसल के लिए मौसम और मांग पर विचार करें
3. पहली पेशकश स्वीकार न करें - बातचीत करें
4. उत्पाद की गुणवत्ता कीमत को प्रभावित करती है
5. परिवहन लागत को ध्यान में रखा जाना चाहिए
6. मौसम की स्थिति कीमतों को प्रभावित कर सकती है

विशिष्ट सलाह के लिए, कृपया अपनी Groq API key कॉन्फ़िगर करें।`,
      
      ta: `பொதுவான சந்தை அறிவின் அடிப்படையில்:

1. உங்கள் உள்ளூர் மண்டியில் தற்போதைய சந்தை விலைகளை சரிபார்க்கவும்
2. உங்கள் பயிருக்கான பருவம் மற்றும் தேவையை கருத்தில் கொள்ளுங்கள்
3. முதல் வாய்ப்பை ஏற்காதீர்கள் - பேச்சுவார்த்தை நடத்துங்கள்
4. விளைபொருளின் தரம் விலையை பாதிக்கிறது
5. போக்குவரத்து செலவுகள் கணக்கில் எடுத்துக்கொள்ளப்பட வேண்டும்
6. வானிலை நிலைமைகள் விலைகளை பாதிக்கலாம்

குறிப்பிட்ட ஆலோசனைக்கு, உங்கள் Groq API விசையை கட்டமைக்கவும்.`
    };

    return advice[this.language] || advice.en;
  }

  async getMarketAdvice(crop, quantity, farmerPrice, buyerOffers = []) {
    const systemMessage = `You are an expert agricultural market advisor helping farmers in India. You understand:
    - Local market dynamics and pricing in India
    - Seasonal variations in crop prices
    - Supply and demand factors affecting Indian agriculture
    - Negotiation strategies suitable for Indian farmers
    - Regional variations in pricing
    
    Always provide practical, actionable advice considering the Indian agricultural context. Help farmers get fair prices while being realistic about market conditions.`;

    const prompt = `
    Farmer Analysis Request:
    - Crop: ${crop}
    - Quantity: ${quantity}kg
    - Farmer's asking price: ₹${farmerPrice}/kg
    
    ${buyerOffers.length > 0 ? `
    Buyer Offers:
    ${buyerOffers.map((offer, i) => `${i+1}. ${offer.name}: ₹${offer.price}/kg for ${offer.quantity}kg`).join('\n')}
    ` : 'No buyer offers received yet.'}
    
    Please provide market advice including:
    1. Price analysis compared to typical market rates
    2. Seasonal and demand factors
    3. Negotiation recommendations
    4. Best timing for selling
    5. Risk factors to consider
    
    Keep advice practical and actionable for farmers.`;

    return await this.callGroqAPI(prompt, systemMessage);
  }

  async getNegotiationHelp(crop, farmerPrice, buyerOffer, buyerName) {
    const systemMessage = `You are a negotiation expert helping Indian farmers. Provide culturally appropriate negotiation tactics that work in the Indian agricultural market context.`;

    const prompt = `
    Negotiation Help Needed:
    - Crop: ${crop}
    - Farmer's price: ₹${farmerPrice}/kg
    - Buyer's offer: ₹${buyerOffer}/kg
    - Buyer: ${buyerName}
    
    Provide negotiation guidance:
    1. Is this offer fair?
    2. Counter-offer suggestions
    3. Key points to highlight during negotiation
    4. Cultural considerations for Indian market
    5. When to accept vs when to walk away
    
    Give specific phrases and strategies farmers can use.`;

    return await this.callGroqAPI(prompt, systemMessage);
  }

  async searchBlockchainBuyers(item, quantity, minPrice) {
    if (!this.contract) {
      return { 
        found: false, 
        error: 'Blockchain connection not available' 
      };
    }

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
    // Language selection
    await this.selectLanguage();
    
    console.log(this.getText('welcome'));
    console.log(this.getText('help_text'));
    
    // Get farmer details
    const farmerName = await ask(this.getText('ask_name'));
    const crop = await ask(this.getText('ask_crop'));
    const quantity = parseInt(await ask(this.getText('ask_quantity')), 10);
    const farmerPrice = parseFloat(await ask(this.getText('ask_price')));

    console.log(`\n📊 Analyzing market for ${crop}...\n`);

    // Get AI market analysis
    const marketAdvice = await this.getMarketAdvice(crop, quantity, farmerPrice);
    console.log(this.getText('market_analysis'));
    console.log('═'.repeat(50));
    console.log(marketAdvice);
    console.log('═'.repeat(50));

    // Search for buyers on blockchain
    const buyerSearch = await this.searchBlockchainBuyers(crop, quantity, farmerPrice);
    
    if (buyerSearch.found) {
      console.log(`\n${this.getText('buyer_found')}`);
      console.log(`   🏪 ${buyerSearch.buyer.name}`);
      console.log(`   💰 Offering: ₹${buyerSearch.buyer.pricePerKg}/kg`);
      console.log(`   📦 Wants: ${buyerSearch.buyer.quantity}kg of ${buyerSearch.buyer.item}`);

      // Get negotiation advice
      const negotiationAdvice = await this.getNegotiationHelp(
        crop, 
        farmerPrice, 
        buyerSearch.buyer.pricePerKg, 
        buyerSearch.buyer.name
      );
      
      console.log(`\n${this.getText('negotiation_advice')}`);
      console.log('═'.repeat(50));
      console.log(negotiationAdvice);
      console.log('═'.repeat(50));

    } else {
      console.log(`\n${this.getText('no_buyer')}`);
      
      // Provide general market guidance
      const guidance = await this.getMarketAdvice(crop, quantity, farmerPrice);
      console.log(`\n${this.getText('market_trends')}`);
      console.log('═'.repeat(50));
      console.log(guidance);
      console.log('═'.repeat(50));
    }

    console.log(this.getText('thank_you', { name: farmerName, crop: crop }));
    console.log(this.getText('knowledge_power'));
    
    rl.close();
  }
}

// Run the multilingual agent
if (require.main === module) {
  const agent = new MultilingualFarmingAgent();
  agent.run().catch(console.error);
}

module.exports = { MultilingualFarmingAgent };
