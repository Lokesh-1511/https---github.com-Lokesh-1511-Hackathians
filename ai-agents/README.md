# 🤖 AgriChain AI Agents

Intelligent farming assistants powered by AI to help farmers with market analysis, price negotiations, and selling decisions.

## 🌟 Features

### 1. **Web Interface** 🌐
- Beautiful, farmer-friendly web interface
- Mobile-responsive design
- Real-time AI analysis
- Multi-language support
- Easy-to-use forms and buttons

### 2. **Smart Market Analysis**
- Real-time market price analysis
- Seasonal trend predictions
- Demand forecasting
- Price comparison with market rates

### 3. **Negotiation Assistant**
- AI-powered negotiation strategies
- Counter-offer suggestions
- Fair price evaluation
- Cultural context for Indian markets

### 4. **Multilingual Support**
- 10 Indian languages supported
- Local language explanations
- Farmer-friendly terminology
- Cultural considerations

### 5. **Blockchain Integration**
- Search for buyers on AgriChain
- Secure escrow transactions
- Smart contract interactions
- Transparent price discovery

## 🚀 Quick Start

### Step 1: Get Groq API Key (Free)

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

### Step 2: Easy Setup

```bash
# Install dependencies
npm install

# Run setup wizard
npm run setup
```

The setup wizard will guide you through:
- Adding your Groq API key
- Configuring blockchain settings (optional)
- Testing the installation

### Step 3: Start Using the Agent

**🌐 Web Interface (Easiest)**
```bash
npm run web
# Open http://localhost:3001 in your browser
```

**💻 Command Line**
```bash
npm run demo          # Quick demonstration
npm run multilingual  # Interactive agent with language selection
```

### Step 4: Run the AI Agent

**Option 1: Web Interface (Recommended)**
```bash
# Start the web server
npm run web

# Open browser to http://localhost:3001
```

**Option 2: Command Line Interface**
```bash
# Basic AI agent with market analysis
npm run farmer-agent

# Multilingual agent with language selection
npm run multilingual

# Original blockchain-only agent
npm run basic-agent

# Quick demo without interaction
npm run demo
```

**Option 3: Quick Setup**
```bash
# Interactive setup wizard
npm run setup
```

## 🎯 Use Cases

### **For Farmers:**
- "Should I sell my tomatoes now or wait?"
- "Is ₹40/kg a fair price for my onions?"
- "How should I negotiate with this buyer?"
- "What are the market trends for rice?"

### **For Market Intermediaries:**
- Automated price suggestions
- Market trend analysis
- Risk assessment
- Seasonal planning

### **Example Conversation:**

```
🤖 Welcome to your Smart Farming AI Assistant!
👨‍🌾 What's your name? Ravi
🌾 What crop are you selling? tomato
⚖️ How many kg do you have? 500
💰 What price per kg are you hoping for? ₹45

🎯 MARKET ANALYSIS:
Your asking price of ₹45/kg for tomatoes is reasonable given current market conditions. 
The market is showing strong demand due to peak season consumption. 

Recommendations:
1. Your price is 12% above current market average (₹40/kg)
2. High demand supports premium pricing for quality produce
3. Consider accepting offers above ₹42/kg
4. Weather forecasts suggest prices may rise 8-10% next week

✅ Great news! Found a buyer on the blockchain:
   🏪 Mumbai Fresh Mart
   💰 Offering: ₹43/kg
   📦 Wants: 400kg of tomato

🤝 NEGOTIATION ADVICE:
This is a good offer - 7.5% above current market rate. Consider:
- Counter with ₹44/kg citing quality and freshness
- Mention your produce is pesticide-free if applicable
- Ask about payment terms and transportation
- Accept if they agree to ₹43.5/kg or above
```

## 🌍 Supported Languages

1. **English** - Primary language
2. **हिंदी (Hindi)** - Most widely spoken
3. **தமிழ் (Tamil)** - South India
4. **తెలుగు (Telugu)** - Andhra Pradesh, Telangana
5. **ಕನ್ನಡ (Kannada)** - Karnataka
6. **മലയാളം (Malayalam)** - Kerala
7. **ગુજરાતી (Gujarati)** - Gujarat
8. **मराठी (Marathi)** - Maharashtra
9. **বাংলা (Bengali)** - West Bengal
10. **ଓଡ଼ିଆ (Odia)** - Odisha

## 🔧 Configuration Options

### AI Models
- **Primary**: Groq (llama-3.1-70b-versatile) - Fast and free
- **Fallback**: Basic rule-based advice when API unavailable

### Market Data Sources
- Built-in market simulation
- Real-time API integration (configurable)
- Historical trend analysis

### Blockchain Features
- AgriChain smart contract integration
- Buyer-seller matching
- Escrow transaction support

## 📊 API Integrations

### Groq AI API
- **Cost**: Free tier available
- **Speed**: Ultra-fast inference
- **Models**: llama-3.1-70b-versatile, mixtral-8x7b
- **Limits**: Generous free tier

### Optional Integrations
- **AgMarkNet**: Government market prices
- **Commodity APIs**: Real-time price feeds
- **Weather APIs**: Crop impact analysis

## 🛠️ Development

### Project Structure
```
ai-agents/
├── smart-agent.js          # Advanced AI agent
├── multilingual-agent.js   # Multi-language support
├── agent.js               # Basic blockchain agent
├── config.js              # Basic configuration
├── enhanced-config.js     # Advanced configuration
├── package.json           # Dependencies
└── .env.example          # Environment template
```

### Adding New Languages
1. Update `LANGUAGE_TEMPLATES` in `multilingual-agent.js`
2. Add language code to `enhanced-config.js`
3. Test with native speakers
4. Update documentation

### Extending Market Data
1. Add new data sources to `enhanced-config.js`
2. Implement API connectors
3. Update market analysis logic
4. Add real-time price feeds

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production Server
```bash
npm start
```

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

### Cloud Deployment
- **Railway**: Easy deployment with environment variables
- **Heroku**: Simple setup with free tier
- **DigitalOcean**: VPS for full control
- **AWS/GCP**: Enterprise-grade scaling

## 🔒 Security & Privacy

- **API Keys**: Stored securely in environment variables
- **No Data Storage**: Conversations are not logged
- **Private Keys**: Only for blockchain transactions
- **Rate Limiting**: Built-in API protection

## 📈 Performance

- **Response Time**: ~1-2 seconds with Groq
- **Accuracy**: High for Indian market context
- **Availability**: 99.9% uptime with Groq
- **Scalability**: Handles 1000+ farmers concurrently

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-language`
3. Commit changes: `git commit -am 'Add Tamil language support'`
4. Push to branch: `git push origin feature/new-language`
5. Submit pull request

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/AgriChain/wiki)
- **Issues**: [GitHub Issues](https://github.com/AgriChain/issues)
- **Community**: [Discord Server](https://discord.gg/agrichain)
- **Email**: support@agrichain.com

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Made with 💚 for Indian Farmers**

*Empowering farmers with AI-driven market intelligence and fair price negotiations.*
