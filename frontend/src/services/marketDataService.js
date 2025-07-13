// Real Market Data Service for AgriChain
import axios from 'axios';

class MarketDataService {
  constructor() {
    // You can replace these with real APIs
    this.mandiAPI = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'; // Sample Indian market API
    this.priceAPI = 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24'; // Agricultural price API
    this.groqAPI = 'https://api.groq.com/openai/v1/chat/completions';
  }

  // Get real market prices for a product
  async getMarketPrices(productName, location, state) {
    try {
      // For demo purposes, using simulated data that mimics real market APIs
      const mockMarketData = this.getMockMarketData(productName, location);
      
      // In production, you would call real APIs like:
      // const response = await axios.get(`${this.mandiAPI}?filters[commodity]=${productName}&filters[state]=${state}`);
      
      return mockMarketData;
    } catch (error) {
      console.error('Market data fetch error:', error);
      return this.getFallbackPrices(productName);
    }
  }

  // Mock market data that simulates real API responses
  getMockMarketData(productName, location) {
    const basePrice = this.getBasePrice(productName.toLowerCase());
    const locationMultiplier = this.getLocationMultiplier(location);
    const seasonalVariation = this.getSeasonalVariation();
    
    const minPrice = Math.round(basePrice * locationMultiplier * seasonalVariation * 0.85);
    const maxPrice = Math.round(basePrice * locationMultiplier * seasonalVariation * 1.25);
    const avgPrice = Math.round((minPrice + maxPrice) / 2);
    
    return {
      commodity: productName,
      location: location,
      minPrice: minPrice,
      maxPrice: maxPrice,
      avgPrice: avgPrice,
      unit: 'per kg',
      lastUpdated: new Date().toISOString(),
      marketTrend: Math.random() > 0.5 ? 'rising' : 'stable',
      demandLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      nearbyMarkets: this.getNearbyMarkets(location)
    };
  }

  getBasePrice(productName) {
    const basePrices = {
      'tomato': 35,
      'tomatoes': 35,
      'onion': 25,
      'onions': 25,
      'potato': 20,
      'potatoes': 20,
      'rice': 45,
      'wheat': 25,
      'carrot': 40,
      'carrots': 40,
      'cabbage': 15,
      'cauliflower': 30,
      'beans': 60,
      'peas': 80,
      'corn': 30,
      'brinjal': 35,
      'okra': 50,
      'spinach': 25,
      'coriander': 40,
      'chili': 120,
      'ginger': 180,
      'garlic': 200
    };
    return basePrices[productName] || 40;
  }

  getLocationMultiplier(location) {
    const locationMultipliers = {
      'mumbai': 1.3,
      'delhi': 1.25,
      'bangalore': 1.2,
      'chennai': 1.15,
      'hyderabad': 1.1,
      'pune': 1.1,
      'kolkata': 1.05,
      'ahmedabad': 1.0,
      'surat': 1.0,
      'jaipur': 0.95,
      'lucknow': 0.9,
      'kanpur': 0.85,
      'nagpur': 0.9,
      'indore': 0.9,
      'thane': 1.25,
      'bhopal': 0.85,
      'visakhapatnam': 0.9,
      'pimpri': 1.1,
      'patna': 0.8,
      'vadodara': 1.0
    };
    return locationMultipliers[location?.toLowerCase()] || 1.0;
  }

  getSeasonalVariation() {
    const month = new Date().getMonth() + 1;
    // Higher prices in off-season, lower in harvest season
    const seasonalFactors = {
      1: 1.1, 2: 1.05, 3: 0.95, 4: 0.9, 5: 0.85, 6: 0.9,
      7: 1.0, 8: 1.05, 9: 1.1, 10: 1.15, 11: 1.1, 12: 1.05
    };
    return seasonalFactors[month];
  }

  getNearbyMarkets(location) {
    const marketData = {
      'mumbai': ['Vashi APMC', 'Navi Mumbai Mandi', 'Dadar Market'],
      'delhi': ['Azadpur Mandi', 'Ghazipur Mandi', 'Okhla Mandi'],
      'bangalore': ['Yeshwantpur Market', 'KR Market', 'Madiwala Market'],
      'chennai': ['Koyambedu Market', 'Perambur Market', 'Pallavaram Market'],
      'hyderabad': ['Gaddiannaram Market', 'Bowenpally Market', 'Erragadda Market'],
      'pune': ['Gultekdi Market', 'Hadapsar Mandi', 'Market Yard']
    };
    return marketData[location?.toLowerCase()] || ['Local Mandi', 'District Market', 'Regional APMC'];
  }

  getFallbackPrices(productName) {
    const basePrice = this.getBasePrice(productName.toLowerCase());
    return {
      commodity: productName,
      location: 'General',
      minPrice: Math.round(basePrice * 0.8),
      maxPrice: Math.round(basePrice * 1.3),
      avgPrice: basePrice,
      unit: 'per kg',
      lastUpdated: new Date().toISOString(),
      marketTrend: 'stable',
      demandLevel: 'medium',
      nearbyMarkets: ['Local Market']
    };
  }

  // AI-powered product description generator
  async generateProductDescription(productName, location, currentPrice, marketData) {
    const apiKey = import.meta?.env?.VITE_GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'test_key_for_development') {
      return this.getFallbackDescription(productName, marketData);
    }

    try {
      const prompt = `
      Product: ${productName}
      Farmer Location: ${location}
      Farmer's Price: ₹${currentPrice}/kg
      Market Min Price: ₹${marketData.minPrice}/kg
      Market Max Price: ₹${marketData.maxPrice}/kg
      Market Average: ₹${marketData.avgPrice}/kg
      Current Trend: ${marketData.marketTrend}
      Demand Level: ${marketData.demandLevel}
      
      Create a compelling product description that helps the farmer sell better. Include quality highlights, seasonal benefits, and pricing justification.
      `;

      const response = await axios.post(this.groqAPI, {
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an agricultural marketing expert. Create compelling product descriptions that help farmers sell their produce better. Focus on quality, freshness, seasonal benefits, and value proposition. Keep it under 100 words and practical."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 120
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI description error:', error);
      return this.getFallbackDescription(productName, marketData);
    }
  }

  getFallbackDescription(productName, marketData) {
    const descriptions = {
      'tomato': `🍅 Fresh, vine-ripened ${productName}s from local farm. Rich in vitamins and perfect for cooking. Current market demand is ${marketData.demandLevel}.`,
      'onion': `🧅 Premium quality ${productName}s, well-cured and long-lasting. Essential kitchen ingredient with strong market demand.`,
      'potato': `🥔 Fresh, grade-A ${productName}s perfect for all cooking needs. Locally grown with excellent storage quality.`,
      'rice': `🌾 Premium quality ${productName}, properly aged and aromatic. Staple grain with consistent market demand.`,
      'wheat': `🌾 High-quality ${productName} grain, perfect for flour production. Essential commodity with stable market prices.`
    };
    
    return descriptions[productName.toLowerCase()] || 
           `🌱 Fresh, high-quality ${productName} from local farm. Market trend: ${marketData.marketTrend}, demand: ${marketData.demandLevel}.`;
  }

  // Calculate distance-based priority for consumers
  calculateDistance(userLocation, farmerLocation) {
    // Simplified distance calculation - in production use proper geolocation APIs
    const locationCoords = {
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'delhi': { lat: 28.7041, lon: 77.1025 },
      'bangalore': { lat: 12.9716, lon: 77.5946 },
      'chennai': { lat: 13.0827, lon: 80.2707 },
      'hyderabad': { lat: 17.3850, lon: 78.4867 },
      'pune': { lat: 18.5204, lon: 73.8567 }
    };

    const user = locationCoords[userLocation?.toLowerCase()] || { lat: 0, lon: 0 };
    const farmer = locationCoords[farmerLocation?.toLowerCase()] || { lat: 0, lon: 0 };

    const R = 6371; // Earth's radius in km
    const dLat = (farmer.lat - user.lat) * Math.PI / 180;
    const dLon = (farmer.lon - user.lon) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(user.lat * Math.PI / 180) * Math.cos(farmer.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  }

  // Get negotiation range for a product
  async getNegotiationRange(productName, farmerPrice, location) {
    try {
      // Get market data first
      const marketData = await this.getMarketPrices(productName, location, 'Delhi');
      
      const farmer = parseFloat(farmerPrice);
      const min = marketData.minPrice;
      const max = marketData.maxPrice;
      const avg = marketData.avgPrice;

      // Calculate negotiation offers
      const conservativeOffer = Math.round(farmer * 0.95); // 5% below asking
      const moderateOffer = Math.round(farmer * 0.90);     // 10% below asking
      const aggressiveOffer = Math.round(farmer * 0.85);   // 15% below asking
      
      // Calculate success probability based on market position
      let successProbability = 50;
      if (farmer > max) {
        successProbability = 85; // High chance if overpriced
      } else if (farmer > avg) {
        successProbability = 70; // Good chance if above average
      } else if (farmer > min) {
        successProbability = 45; // Lower chance if fairly priced
      } else {
        successProbability = 20; // Very low chance if underpriced
      }

      // Generate strategy advice
      let strategy = '';
      if (farmer > max) {
        strategy = 'This product is overpriced compared to market rates. You have strong negotiating power. Start with a moderate offer.';
      } else if (farmer > avg) {
        strategy = 'Product is priced above market average. Politely mention market rates and make a conservative offer.';
      } else if (farmer >= min) {
        strategy = 'Fair market pricing. Focus on quantity discounts or bundle deals rather than base price negotiation.';
      } else {
        strategy = 'Great price! Consider purchasing without negotiation to maintain good relationship with farmer.';
      }

      return {
        minAcceptable: Math.max(min, aggressiveOffer),
        maxReasonable: Math.min(max, conservativeOffer), 
        conservativeOffer,
        moderateOffer,
        aggressiveOffer,
        strategy,
        successProbability,
        marketData: {
          min,
          max,
          avg,
          farmerPrice: farmer
        }
      };
    } catch (error) {
      console.error('Error getting negotiation range:', error);
      // Fallback negotiation data
      const farmer = parseFloat(farmerPrice);
      return {
        minAcceptable: Math.round(farmer * 0.85),
        maxReasonable: Math.round(farmer * 0.95),
        conservativeOffer: Math.round(farmer * 0.95),
        moderateOffer: Math.round(farmer * 0.90),
        aggressiveOffer: Math.round(farmer * 0.85),
        strategy: 'Market data unavailable. Try offering 5-15% below asking price.',
        successProbability: 50,
        marketData: {
          min: Math.round(farmer * 0.8),
          max: Math.round(farmer * 1.2),
          avg: farmer,
          farmerPrice: farmer
        }
      };
    }
  }
}

export const marketDataService = new MarketDataService();
