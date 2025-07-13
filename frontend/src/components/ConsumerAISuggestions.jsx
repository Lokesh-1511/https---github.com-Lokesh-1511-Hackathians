import React, { useState, useEffect } from 'react';
import { Brain, ShoppingCart, TrendingDown, Star, Target, Lightbulb, RefreshCw, DollarSign, MapPin, MessageCircle, TrendingUp, Clock, Users } from 'lucide-react';
import { marketDataService } from '../services/marketDataService';

const ConsumerAISuggestions = ({ availableProduce, cart, userStats, userLocation }) => {
  const [suggestions, setSuggestions] = useState({
    local: [],
    deals: '',
    negotiation: {},
    timing: ''
  });
  
  const [loading, setLoading] = useState({
    local: false,
    deals: false,
    negotiation: false,
    timing: false
  });

  const [selectedForNegotiation, setSelectedForNegotiation] = useState(null);
  const [negotiationMode, setNegotiationMode] = useState(false);

  useEffect(() => {
    loadConsumerSuggestions();
  }, [availableProduce, userLocation]);

  const loadConsumerSuggestions = async () => {
    await getLocalPrioritizedProducts();
    await getBestDeals();
    await getBuyingTiming();
  };

  const setLoadingState = (type, state) => {
    setLoading(prev => ({ ...prev, [type]: state }));
  };

  const getLocalPrioritizedProducts = async () => {
    setLoadingState('local', true);
    try {
      if (!availableProduce || availableProduce.length === 0) {
        setSuggestions(prev => ({ 
          ...prev, 
          local: [] 
        }));
        return;
      }

      // Calculate distances and prioritize local products
      const productsWithDistance = await Promise.all(
        availableProduce.map(async (product) => {
          try {
            const farmerLocation = product.farmerLocation || product.location || product.address;
            const distance = await marketDataService.calculateDistance(
              userLocation || "Delhi", 
              farmerLocation || "Delhi"
            );
            
            return {
              ...product,
              distance: distance,
              isLocal: distance <= 50 // Within 50km is considered local
            };
          } catch (error) {
            return {
              ...product,
              distance: 999,
              isLocal: false
            };
          }
        })
      );

      // Sort by distance (local first)
      const sortedProducts = productsWithDistance.sort((a, b) => {
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;
        return a.distance - b.distance;
      });

      setSuggestions(prev => ({ ...prev, local: sortedProducts }));
    } catch (error) {
      console.error('Error prioritizing local products:', error);
      setSuggestions(prev => ({ ...prev, local: availableProduce || [] }));
    } finally {
      setLoadingState('local', false);
    }
  };

  const getBestDeals = async () => {
    setLoadingState('deals', true);
    try {
      const localProducts = suggestions.local.length > 0 ? suggestions.local : availableProduce;
      
      if (!localProducts || localProducts.length === 0) {
        setSuggestions(prev => ({ 
          ...prev, 
          deals: "🛒 No products available right now. Check back later for fresh deals!" 
        }));
        return;
      }

      // Get market data for comparison
      const dealsAnalysis = await Promise.all(
        localProducts.slice(0, 5).map(async (product) => {
          try {
            const marketData = await marketDataService.getMarketPrices(
              product.name, 
              userLocation || "Delhi", 
              "Delhi"
            );
            
            const productPrice = parseFloat(product.price.replace(/[₹,]/g, ''));
            const savings = marketData.maxPrice - productPrice;
            const savingsPercent = ((savings / marketData.maxPrice) * 100).toFixed(1);
            
            return {
              ...product,
              marketData,
              savings,
              savingsPercent: savings > 0 ? savingsPercent : 0
            };
          } catch (error) {
            return { ...product, savings: 0, savingsPercent: 0 };
          }
        })
      );

      // Sort by savings percentage
      const bestDeals = dealsAnalysis
        .filter(p => p.savings > 0)
        .sort((a, b) => b.savingsPercent - a.savingsPercent)
        .slice(0, 3);

      if (bestDeals.length > 0) {
        const dealsText = bestDeals.map(deal => 
          `${deal.name} - Save ${deal.savingsPercent}% (₹${deal.savings.toFixed(0)} below market max)`
        ).join(', ');
        
        setSuggestions(prev => ({ 
          ...prev, 
          deals: `🎉 Best Deals: ${dealsText}. These are priced below market maximum!` 
        }));
      } else {
        setSuggestions(prev => ({ 
          ...prev, 
          deals: "📊 All products are fairly priced according to current market rates. Look for local farmers to reduce transport costs!" 
        }));
      }
    } catch (error) {
      console.error('Error getting deals advice:', error);
      setSuggestions(prev => ({ 
        ...prev, 
        deals: "🛒 Compare prices across different farmers and check for seasonal produce for the best deals." 
      }));
    } finally {
      setLoadingState('deals', false);
    }
  };

  const getBuyingTiming = async () => {
    setLoadingState('timing', true);
    try {
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay();
      const isWeekend = currentDay === 0 || currentDay === 6;
      
      let timingAdvice = '';
      
      if (currentHour >= 6 && currentHour <= 10) {
        timingAdvice = "🌅 Perfect time! Early morning offers the freshest produce as farmers just harvested.";
      } else if (currentHour >= 16 && currentHour <= 19) {
        timingAdvice = "🌆 Good evening timing! Farmers often offer discounts on remaining stock.";
      } else if (isWeekend) {
        timingAdvice = "🎪 Weekend shopping! More farmers are available, but prices might be slightly higher due to demand.";
      } else {
        timingAdvice = "⏰ Off-peak hours! You might find better prices as there's less competition from other buyers.";
      }

      setSuggestions(prev => ({ ...prev, timing: timingAdvice }));
    } catch (error) {
      console.error('Error getting timing advice:', error);
      setSuggestions(prev => ({ 
        ...prev, 
        timing: "🕐 Best times: Early morning (6-10 AM) for freshness, evening (4-7 PM) for discounts!" 
      }));
    } finally {
      setLoadingState('timing', false);
    }
  };

  const startNegotiation = async (product) => {
    setLoadingState('negotiation', true);
    setSelectedForNegotiation(product);
    setNegotiationMode(true);
    
    try {
      const negotiationData = await marketDataService.getNegotiationRange(
        product.name,
        parseFloat(product.price.replace(/[₹,]/g, '')),
        userLocation || "Delhi"
      );
      
      setSuggestions(prev => ({
        ...prev,
        negotiation: {
          ...prev.negotiation,
          [product.id]: negotiationData
        }
      }));
    } catch (error) {
      console.error('Error getting negotiation data:', error);
      // Set fallback data so UI doesn't break
      setSuggestions(prev => ({
        ...prev,
        negotiation: {
          ...prev.negotiation,
          [product.id]: {
            minAcceptable: Math.round(parseFloat(product.price.replace(/[₹,]/g, '')) * 0.85),
            maxReasonable: Math.round(parseFloat(product.price.replace(/[₹,]/g, '')) * 0.95),
            conservativeOffer: Math.round(parseFloat(product.price.replace(/[₹,]/g, '')) * 0.95),
            moderateOffer: Math.round(parseFloat(product.price.replace(/[₹,]/g, '')) * 0.90),
            aggressiveOffer: Math.round(parseFloat(product.price.replace(/[₹,]/g, '')) * 0.85),
            strategy: 'Unable to fetch market data. Try offering 5-15% below asking price.',
            successProbability: 50
          }
        }
      }));
    } finally {
      setLoadingState('negotiation', false);
    }
  };

  const handleOfferClick = (offerType, amount) => {
    alert(`🤝 ${offerType} Offer: ₹${amount}\n\nThis feature will contact the farmer with your offer. Coming soon!`);
  };

  const LocalProductsCard = () => {
    const localProducts = suggestions.local.slice(0, 6);
    
    return (
      <div className="ai-suggestion-card">
        <div className="ai-card-header">
          <MapPin className="ai-card-icon" size={20} />
          <h4>🌱 Local First - Near You</h4>
          {loading.local && <RefreshCw size={16} className="ai-spinning" />}
        </div>
        <div className="ai-card-content">
          {loading.local ? (
            <div className="ai-loading">
              <div className="ai-spinner"></div>
              <span>Finding local farmers...</span>
            </div>
          ) : localProducts.length > 0 ? (
            <div className="local-products-grid">
              {localProducts.map((product, index) => (
                <div key={product.id} className={`product-card ${product.isLocal ? 'local-product' : 'distant-product'}`}>
                  <div className="product-header">
                    <span className="product-name">{product.name}</span>
                    <span className={`distance-badge ${product.isLocal ? 'local' : 'distant'}`}>
                      {product.distance <= 999 ? `${product.distance}km` : 'Far'}
                    </span>
                  </div>
                  <div className="product-details">
                    <div className="price">₹{product.price}</div>
                    <div className="farmer">{product.farmerName || 'Local Farmer'}</div>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="negotiate-btn"
                      onClick={() => startNegotiation(product)}
                      disabled={loading.negotiation}
                    >
                      💬 Negotiate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No products available in your area right now.</p>
          )}
        </div>
      </div>
    );
  };

  const NegotiationCard = () => {
    if (!negotiationMode || !selectedForNegotiation) return null;
    
    const negotiationData = suggestions.negotiation[selectedForNegotiation.id];
    
    return (
      <div className="ai-suggestion-card negotiation-card">
        <div className="ai-card-header">
          <MessageCircle className="ai-card-icon" size={20} />
          <h4>💰 Negotiate: {selectedForNegotiation.name}</h4>
          <button onClick={() => setNegotiationMode(false)} className="close-btn">✕</button>
        </div>
        <div className="ai-card-content">
          {loading.negotiation ? (
            <div className="ai-loading">
              <div className="ai-spinner"></div>
              <span>Analyzing negotiation potential...</span>
            </div>
          ) : negotiationData ? (
            <div className="negotiation-analysis">
              <div className="current-vs-market">
                <div className="price-comparison">
                  <span>Current Price: ₹{selectedForNegotiation.price}</span>
                  <span>Market Range: ₹{negotiationData.minAcceptable || negotiationData.marketData?.min || 'N/A'} - ₹{negotiationData.maxReasonable || negotiationData.marketData?.max || 'N/A'}</span>
                </div>
              </div>
              
              <div className="negotiation-advice">
                <h5>🎯 Negotiation Strategy:</h5>
                <p>{negotiationData.strategy}</p>
              </div>
              
              <div className="suggested-offers">
                <h5>💡 Suggested Offers:</h5>
                <div className="offer-buttons">
                  <button 
                    className="offer-btn conservative"
                    onClick={() => handleOfferClick('Conservative', negotiationData.conservativeOffer)}
                  >
                    ₹{negotiationData.conservativeOffer} (Safe)
                  </button>
                  <button 
                    className="offer-btn moderate"
                    onClick={() => handleOfferClick('Moderate', negotiationData.moderateOffer)}
                  >
                    ₹{negotiationData.moderateOffer} (Balanced)
                  </button>
                  <button 
                    className="offer-btn aggressive"
                    onClick={() => handleOfferClick('Aggressive', negotiationData.aggressiveOffer)}
                  >
                    ₹{negotiationData.aggressiveOffer} (Bold)
                  </button>
                </div>
              </div>
              
              <div className="success-probability">
                <span>Success Probability: </span>
                <span className={`probability ${negotiationData.successProbability >= 70 ? 'high' : negotiationData.successProbability >= 40 ? 'medium' : 'low'}`}>
                  {negotiationData.successProbability}%
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p>Unable to load negotiation data. Try again!</p>
              <button onClick={() => startNegotiation(selectedForNegotiation)} className="retry-btn">
                🔄 Retry Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DealsCard = () => (
    <div className="ai-suggestion-card">
      <div className="ai-card-header">
        <TrendingDown className="ai-card-icon" size={20} />
        <h4>🎯 Best Deals</h4>
        {loading.deals && <RefreshCw size={16} className="ai-spinning" />}
      </div>
      <div className="ai-card-content">
        {loading.deals ? (
          <div className="ai-loading">
            <div className="ai-spinner"></div>
            <span>Finding best deals...</span>
          </div>
        ) : (
          <p>{suggestions.deals}</p>
        )}
      </div>
    </div>
  );

  const TimingCard = () => (
    <div className="ai-suggestion-card">
      <div className="ai-card-header">
        <Clock className="ai-card-icon" size={20} />
        <h4>⏰ Best Timing</h4>
        {loading.timing && <RefreshCw size={16} className="ai-spinning" />}
      </div>
      <div className="ai-card-content">
        {loading.timing ? (
          <div className="ai-loading">
            <div className="ai-spinner"></div>
            <span>Analyzing timing...</span>
          </div>
        ) : (
          <p>{suggestions.timing}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="consumer-ai-suggestions">
      <div className="ai-header">
        <div className="ai-header-content">
          <Brain className="ai-brain" size={24} />
          <div>
            <h3>🛒 Smart Shopping Assistant</h3>
            <p>Local-first recommendations and smart negotiation tools</p>
          </div>
        </div>
      </div>

      <div className="ai-suggestions-grid">
        <LocalProductsCard />
        <DealsCard />
        <TimingCard />
      </div>
      
      {negotiationMode && <NegotiationCard />}

      <style jsx>{`
        .consumer-ai-suggestions {
          background: linear-gradient(135deg, #4A90E2 0%, #5BA0F2 100%);
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
          color: white;
        }

        .ai-header-content {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .ai-brain {
          color: #FFD700;
        }

        .ai-suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .ai-suggestion-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .negotiation-card {
          grid-column: 1 / -1;
          background: rgba(255, 215, 0, 0.2);
          border: 2px solid #FFD700;
        }

        .ai-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .ai-card-header h4 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-card-icon {
          color: #FFD700;
        }

        .local-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .local-product {
          border-left: 4px solid #4CAF50;
        }

        .distant-product {
          border-left: 4px solid #FF9800;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .product-name {
          font-weight: 600;
          font-size: 14px;
        }

        .distance-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
        }

        .distance-badge.local {
          background: rgba(76, 175, 80, 0.3);
        }

        .distance-badge.distant {
          background: rgba(255, 152, 0, 0.3);
        }

        .product-details {
          margin-bottom: 10px;
        }

        .price {
          font-weight: 700;
          font-size: 16px;
          color: #FFD700;
        }

        .farmer {
          font-size: 12px;
          opacity: 0.8;
        }

        .negotiate-btn {
          background: rgba(255, 215, 0, 0.2);
          color: white;
          border: 1px solid #FFD700;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          width: 100%;
        }

        .negotiate-btn:hover {
          background: rgba(255, 215, 0, 0.3);
        }

        .negotiate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .negotiation-analysis {
          space-y: 15px;
        }

        .price-comparison {
          display: flex;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .negotiation-advice {
          margin-bottom: 15px;
        }

        .negotiation-advice h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .offer-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }

        .offer-btn {
          flex: 1;
          padding: 8px 4px;
          border-radius: 6px;
          border: none;
          color: white;
          font-size: 12px;
          cursor: pointer;
        }

        .offer-btn.conservative {
          background: rgba(76, 175, 80, 0.7);
        }

        .offer-btn.conservative:hover {
          background: rgba(76, 175, 80, 0.9);
        }

        .offer-btn.moderate {
          background: rgba(255, 152, 0, 0.7);
        }

        .offer-btn.moderate:hover {
          background: rgba(255, 152, 0, 0.9);
        }

        .offer-btn.aggressive {
          background: rgba(244, 67, 54, 0.7);
        }

        .offer-btn.aggressive:hover {
          background: rgba(244, 67, 54, 0.9);
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .retry-btn {
          background: rgba(255, 215, 0, 0.3);
          color: white;
          border: 1px solid #FFD700;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 10px;
        }

        .retry-btn:hover {
          background: rgba(255, 215, 0, 0.5);
        }

        .success-probability {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .probability.high {
          color: #4CAF50;
          font-weight: 600;
        }

        .probability.medium {
          color: #FF9800;
          font-weight: 600;
        }

        .probability.low {
          color: #F44336;
          font-weight: 600;
        }

        .ai-loading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .ai-spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .ai-suggestions-grid {
            grid-template-columns: 1fr;
          }
          
          .local-products-grid {
            grid-template-columns: 1fr;
          }
          
          .offer-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsumerAISuggestions;
