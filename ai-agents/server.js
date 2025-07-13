const express = require('express');
const cors = require('cors');
const path = require('path');
const { MultilingualFarmingAgent } = require('./multilingual-agent');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create agent instance
const agent = new MultilingualFarmingAgent();

// API Routes
app.post('/api/market-advice', async (req, res) => {
  try {
    const { crop, quantity, price, language = 'en' } = req.body;
    
    // Set language for this request
    agent.language = language;
    
    const advice = await agent.getMarketAdvice(crop, quantity, price);
    
    res.json({
      success: true,
      advice: advice,
      language: language
    });
  } catch (error) {
    console.error('Market advice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market advice'
    });
  }
});

app.post('/api/negotiation-help', async (req, res) => {
  try {
    const { crop, farmerPrice, buyerOffer, buyerName, language = 'en' } = req.body;
    
    agent.language = language;
    
    const advice = await agent.getNegotiationHelp(crop, farmerPrice, buyerOffer, buyerName);
    
    res.json({
      success: true,
      advice: advice,
      language: language
    });
  } catch (error) {
    console.error('Negotiation advice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get negotiation advice'
    });
  }
});

app.post('/api/search-buyers', async (req, res) => {
  try {
    const { crop, quantity, minPrice } = req.body;
    
    const result = await agent.searchBlockchainBuyers(crop, quantity, minPrice);
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Buyer search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for buyers'
    });
  }
});

app.get('/api/languages', (req, res) => {
  const config = require('./enhanced-config');
  res.json({
    success: true,
    languages: config.languages
  });
});

// Serve the web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌾 AgriChain AI Agent Web Server running on port ${PORT}`);
  console.log(`📱 Open your browser to: http://localhost:${PORT}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
});

module.exports = app;
