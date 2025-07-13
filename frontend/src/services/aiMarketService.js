// AI Market Service for AgriChain
import axios from 'axios';

class AIMarketService {
  constructor() {
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  getAPIKey() {
    return import.meta?.env?.VITE_GROQ_API_KEY || null;
  }

  getFallbackAdvice(type) {
    const advice = {
      pricing: "💰 Check local mandi rates, consider seasonal demand, and price 10-15% above your minimum acceptable rate for negotiation room.",
      timing: "⏰ Best selling times: Early morning (6-8 AM) for wholesale, evening (4-6 PM) for retail. Avoid selling during rain or festivals.",
      negotiation: "🤝 Start 15% higher than desired price, highlight quality factors, be willing to negotiate, and know your bottom line.",
      deals: "🛒 Look for seasonal produce, compare prices across farmers, check freshness indicators like color and firmness.",
      quality: "🌟 Check for: bright colors, firm texture, fresh smell, no bruises or spots. Ask about harvest date and storage.",
      budget: "💰 Buy seasonal produce, consider bulk purchases for non-perishables, compare unit prices across different farmers."
    };
    return advice[type] || "Check with local agricultural experts for best practices.";
  }

  async callGroqAPI(prompt, systemMessage) {
    const apiKey = this.getAPIKey();
    
    if (!apiKey || apiKey === 'test_key_for_development') {
      // Return fallback advice
      if (prompt.includes('pricing') || prompt.includes('price')) return this.getFallbackAdvice('pricing');
      if (prompt.includes('timing') || prompt.includes('time')) return this.getFallbackAdvice('timing');  
      if (prompt.includes('negotiat')) return this.getFallbackAdvice('negotiation');
      if (prompt.includes('deals') || prompt.includes('best')) return this.getFallbackAdvice('deals');
      if (prompt.includes('quality')) return this.getFallbackAdvice('quality');
      if (prompt.includes('budget')) return this.getFallbackAdvice('budget');
      return "Get advice from local agricultural experts and check current market rates.";
    }

    try {
      const response = await axios.post(this.apiUrl, {
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API Error:', error);
      return this.getFallbackAdvice('timing');
    }
  }

  async getPricingSuggestion(productName, currentPrice, quantity) {
    const prompt = `Product: ${productName}, Current Price: ${currentPrice}, Quantity: ${quantity}. Suggest optimal pricing strategy.`;
    return await this.callGroqAPI(prompt, "You are an agricultural pricing expert for Indian farmers. Provide concise pricing advice.");
  }

  async getMarketTiming(productName) {
    const prompt = `When is the best time to sell ${productName} in Indian markets?`;
    return await this.callGroqAPI(prompt, "You are a market timing expert for Indian agriculture. Give practical timing advice.");
  }

  async getNegotiationTips(productName, buyerType) {
    const prompt = `Negotiation tips for selling ${productName} to ${buyerType}`;
    return await this.callGroqAPI(prompt, "You are a negotiation expert for farmers. Provide practical bargaining advice.");
  }

  async getProductOptimization(products) {
    const productList = products.map(p => p.name).join(', ');
    const prompt = `I grow: ${productList}. Suggest portfolio optimization.`;
    return await this.callGroqAPI(prompt, "You are an agricultural portfolio advisor. Suggest crop diversification strategies.");
  }

  async getSeasonalAdvice() {
    const prompt = "Seasonal farming advice for current time period";
    return await this.callGroqAPI(prompt, "You are a seasonal farming expert. Provide current season advice for Indian farmers.");
  }
}

export const aiMarketService = new AIMarketService();
