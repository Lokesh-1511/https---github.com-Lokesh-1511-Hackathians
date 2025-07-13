require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 👇 Update the path to match the real artifact location
const artifactPath = path.resolve(__dirname, '../artifacts/contracts/contracts/FarmerMarket.sol/FarmerMarket.json');

let abi;
try {
  abi = JSON.parse(fs.readFileSync(artifactPath, 'utf8')).abi;
} catch (error) {
  console.log('⚠️ Contract ABI not found. Some blockchain features may not work.');
  abi = [];
}

// Multilingual support
const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  gu: 'ગુજરાતી (Gujarati)',
  mr: 'मराठी (Marathi)',
  bn: 'বাংলা (Bengali)',
  or: 'ଓଡ଼ିଆ (Odia)'
};

// Market data sources configuration
const MARKET_CONFIG = {
  enableRealTimeData: process.env.ENABLE_REAL_TIME_MARKET === 'true',
  apiSources: {
    agmarknet: process.env.AGMARKNET_API_KEY,
    commodity: process.env.COMMODITY_API_KEY
  }
};

module.exports = {
  abi,
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS,
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  languages: LANGUAGES,
  marketConfig: MARKET_CONFIG,
  
  // AI Model configurations
  ai: {
    groq: {
      model: 'llama-3.1-70b-versatile',
      maxTokens: 1000,
      temperature: 0.7
    },
    fallbackModel: 'groq' // Use when primary fails
  }
};
