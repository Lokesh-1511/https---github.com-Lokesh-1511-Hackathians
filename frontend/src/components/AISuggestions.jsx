import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, DollarSign, Clock, Target, Lightbulb, RefreshCw, MapPin, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { marketDataService } from '../services/marketDataService';

const AISuggestions = ({ products, user }) => {
  const [marketData, setMarketData] = useState({});
  const [productDescriptions, setProductDescriptions] = useState({});
  const [loading, setLoading] = useState({
    market: false,
    description: false
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (products && products.length > 0) {
      setSelectedProduct(products[0]);
      loadMarketDataForProducts();
    }
  }, [products]);

  useEffect(() => {
    if (selectedProduct) {
      loadMarketDataForProduct(selectedProduct);
      generateProductDescription(selectedProduct);
    }
  }, [selectedProduct]);

  const loadMarketDataForProducts = async () => {
    if (!products || products.length === 0) return;
    
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const marketPromises = products.map(product => 
        marketDataService.getMarketPrices(product.name, user.location || user.address, user.state)
      );
      const marketResults = await Promise.all(marketPromises);
      
      const marketDataMap = {};
      products.forEach((product, index) => {
        marketDataMap[product.id] = marketResults[index];
      });
      
      setMarketData(marketDataMap);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  const loadMarketDataForProduct = async (product) => {
    if (!product) return;
    
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const data = await marketDataService.getMarketPrices(
        product.name, 
        user.location || user.address, 
        user.state
      );
      setMarketData(prev => ({ ...prev, [product.id]: data }));
    } catch (error) {
      console.error('Error loading market data for product:', error);
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  const generateProductDescription = async (product) => {
    if (!product) return;
    
    setLoading(prev => ({ ...prev, description: true }));
    try {
      const productMarketData = marketData[product.id];
      if (productMarketData) {
        const description = await marketDataService.generateProductDescription(
          product.name,
          user.location || user.address,
          product.price,
          productMarketData
        );
        setProductDescriptions(prev => ({ ...prev, [product.id]: description }));
      }
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setLoading(prev => ({ ...prev, description: false }));
    }
  };

  const getPriceRecommendation = (product) => {
    const data = marketData[product?.id];
    if (!data) return null;

    const farmerPrice = parseFloat(product.price.replace(/[₹,]/g, ''));
    const { minPrice, maxPrice, avgPrice } = data;

    let recommendation = '';
    let priceStatus = '';
    let statusIcon = null;
    let statusColor = '';

    if (farmerPrice < minPrice) {
      recommendation = `Your price is below market minimum! Consider increasing to ₹${minPrice}-₹${avgPrice}`;
      priceStatus = 'too_low';
      statusIcon = <TrendingDown className="w-5 h-5" />;
      statusColor = 'text-red-500';
    } else if (farmerPrice > maxPrice) {
      recommendation = `Your price is above market maximum! Consider reducing to ₹${avgPrice}-₹${maxPrice}`;
      priceStatus = 'too_high';
      statusIcon = <AlertTriangle className="w-5 h-5" />;
      statusColor = 'text-orange-500';
    } else if (farmerPrice <= avgPrice) {
      recommendation = `Good pricing! You could increase up to ₹${avgPrice} (market average)`;
      priceStatus = 'good';
      statusIcon = <CheckCircle className="w-5 h-5" />;
      statusColor = 'text-green-500';
    } else {
      recommendation = `Premium pricing! Market accepts up to ₹${maxPrice}`;
      priceStatus = 'premium';
      statusIcon = <TrendingUp className="w-5 h-5" />;
      statusColor = 'text-blue-500';
    }

    return {
      recommendation,
      priceStatus,
      marketData: data,
      farmerPrice,
      statusIcon,
      statusColor
    };
  };

  const MarketAnalysisCard = ({ product }) => {
    const analysis = getPriceRecommendation(product);
    const data = marketData[product?.id];

    if (!data || !analysis) {
      return (
        <div className="ai-suggestion-card">
          <div className="ai-card-header">
            <DollarSign className="ai-card-icon" size={20} />
            <h4>Market Analysis</h4>
            {loading.market && <RefreshCw size={16} className="ai-spinning" />}
          </div>
          <div className="ai-card-content">
            {loading.market ? 'Fetching real market data...' : 'Select a product to see market analysis'}
          </div>
        </div>
      );
    }

    return (
      <div className="ai-suggestion-card">
        <div className="ai-card-header">
          <DollarSign className="ai-card-icon" size={20} />
          <h4>Market Analysis - {product.name}</h4>
          <button onClick={() => loadMarketDataForProduct(product)} disabled={loading.market}>
            <RefreshCw size={16} className={loading.market ? 'ai-spinning' : ''} />
          </button>
        </div>
        
        <div className="ai-card-content">
          <div className="market-summary">
            <div className={`price-status ${analysis.statusColor}`}>
              {analysis.statusIcon}
              <span>{analysis.recommendation}</span>
            </div>
            
            <div className="price-grid">
              <div className="price-item">
                <span className="price-label">Your Price:</span>
                <span className="price-value">₹{analysis.farmerPrice}/kg</span>
              </div>
              <div className="price-item">
                <span className="price-label">Market Min:</span>
                <span className="price-value">₹{data.minPrice}/kg</span>
              </div>
              <div className="price-item">
                <span className="price-label">Market Max:</span>
                <span className="price-value">₹{data.maxPrice}/kg</span>
              </div>
              <div className="price-item">
                <span className="price-label">Average:</span>
                <span className="price-value">₹{data.avgPrice}/kg</span>
              </div>
            </div>

            <div className="market-indicators">
              <div className="indicator">
                <span>Trend:</span>
                <span className={`trend-${data.marketTrend}`}>
                  {data.marketTrend === 'rising' ? '📈' : '📊'} {data.marketTrend}
                </span>
              </div>
              <div className="indicator">
                <span>Demand:</span>
                <span className={`demand-${data.demandLevel}`}>
                  {data.demandLevel === 'high' ? '🔥' : data.demandLevel === 'medium' ? '📊' : '📉'} {data.demandLevel}
                </span>
              </div>
            </div>

            <div className="nearby-markets">
              <strong>Nearby Markets:</strong>
              <div className="market-list">
                {data.nearbyMarkets.map((market, index) => (
                  <span key={index} className="market-tag">{market}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProductDescriptionCard = ({ product }) => {
    const description = productDescriptions[product?.id];
    
    return (
      <div className="ai-suggestion-card">
        <div className="ai-card-header">
          <Brain className="ai-card-icon" size={20} />
          <h4>AI Product Description</h4>
          {loading.description && <RefreshCw size={16} className="ai-spinning" />}
        </div>
        <div className="ai-card-content">
          {loading.description ? (
            <div className="ai-loading">
              <div className="ai-spinner"></div>
              <span>Generating smart description...</span>
            </div>
          ) : description ? (
            <div className="product-description">
              <p>{description}</p>
              <button 
                onClick={() => generateProductDescription(product)}
                className="regenerate-btn"
              >
                🔄 Generate New Description
              </button>
            </div>
          ) : (
            <p>Select a product to generate an AI-powered description</p>
          )}
        </div>
      </div>
    );
  };

  if (!products || products.length === 0) {
    return (
      <div className="ai-suggestions-container">
        <div className="ai-header">
          <Brain className="ai-brain" size={24} />
          <div>
            <h3>🤖 AI Market Intelligence</h3>
            <p>Add products to get real-time market analysis and pricing suggestions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestions-container">
      <div className="ai-header">
        <div className="ai-header-content">
          <Brain className="ai-brain" size={24} />
          <div>
            <h3>🤖 AI Market Intelligence</h3>
            <p>Real-time market data and smart pricing suggestions</p>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      <div className="product-selector">
        <label>Analyze Product:</label>
        <select 
          value={selectedProduct?.id || ''} 
          onChange={(e) => {
            const product = products.find(p => p.id === e.target.value);
            setSelectedProduct(product);
          }}
          className="product-select"
        >
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - ₹{product.price} ({product.quantity} {product.unit})
            </option>
          ))}
        </select>
      </div>

      {/* AI Analysis Cards */}
      <div className="ai-suggestions-grid">
        <MarketAnalysisCard product={selectedProduct} />
        <ProductDescriptionCard product={selectedProduct} />
      </div>

      <style jsx>{`
        .ai-suggestions-container {
          background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
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

        .product-selector {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .product-select {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
        }

        .ai-suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }

        .ai-suggestion-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
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

        .price-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .price-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .price-label {
          font-size: 13px;
          opacity: 0.9;
        }

        .price-value {
          font-weight: 600;
        }

        .market-indicators {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .nearby-markets {
          font-size: 13px;
        }

        .market-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 5px;
        }

        .market-tag {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }

        .product-description {
          line-height: 1.5;
        }

        .regenerate-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .regenerate-btn:hover {
          background: rgba(255, 255, 255, 0.3);
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
          
          .price-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AISuggestions;
