#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

async function setupAgent() {
  console.log('🚀 AgriChain AI Agent Setup');
  console.log('═'.repeat(40));
  console.log('');

  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('✅ .env file already exists');
    const overwrite = await ask('Would you like to update it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup skipped. Run npm run demo to test the agent.');
      rl.close();
      return;
    }
  }

  console.log('🔑 Let\'s set up your AI agent with Groq API (free)');
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Visit: https://console.groq.com');
  console.log('2. Sign up for a free account');
  console.log('3. Create a new API key');
  console.log('4. Copy the key and paste it below');
  console.log('');

  const groqKey = await ask('Enter your Groq API key (or press Enter to skip): ');
  
  console.log('');
  console.log('🔗 Blockchain configuration (optional):');
  console.log('Leave blank if you don\'t have a local blockchain running');
  console.log('');

  const rpcUrl = await ask('RPC URL (default: http://127.0.0.1:8545): ') || 'http://127.0.0.1:8545';
  const privateKey = await ask('Private key (leave blank if not needed): ');
  const contractAddress = await ask('Contract address (leave blank if not needed): ');

  // Create .env content
  const envContent = `# AgriChain AI Agent Configuration
# Generated on ${new Date().toISOString()}

# Groq AI API Configuration (Required for AI features)
GROQ_API_KEY=${groqKey || 'your_groq_api_key_here'}

# Blockchain Configuration (Optional)
RPC_URL=${rpcUrl}
PRIVATE_KEY=${privateKey || 'your_private_key_here'}
CONTRACT_ADDRESS=${contractAddress || 'your_contract_address_here'}

# Optional: Other AI APIs
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Market Data Configuration
ENABLE_REAL_TIME_MARKET=false
AGMARKNET_API_KEY=your_agmarknet_key_here
COMMODITY_API_KEY=your_commodity_key_here
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('');
  console.log('✅ Configuration saved to .env file');
  console.log('');

  if (groqKey) {
    console.log('🎉 Setup complete! Your AI agent is ready.');
    console.log('');
    console.log('🚀 Quick start commands:');
    console.log('   npm run demo          - Test the AI features');
    console.log('   npm run farmer-agent  - Interactive smart agent');
    console.log('   npm run multilingual  - Multi-language agent');
    console.log('');
    console.log('📚 Features available:');
    console.log('   ✅ AI-powered market analysis');
    console.log('   ✅ Negotiation assistance');
    console.log('   ✅ Price recommendations');
    console.log('   ✅ Multi-language support');
    if (privateKey && contractAddress) {
      console.log('   ✅ Blockchain integration');
    } else {
      console.log('   ⚠️  Blockchain features (need blockchain setup)');
    }
  } else {
    console.log('⚠️  No Groq API key provided.');
    console.log('');
    console.log('🔄 To get full AI features:');
    console.log('1. Get free API key from https://console.groq.com');
    console.log('2. Edit .env file and update GROQ_API_KEY');
    console.log('3. Run npm run demo to test');
    console.log('');
    console.log('📋 For now, you can still:');
    console.log('   npm run demo  - See fallback responses');
  }

  rl.close();
}

// Run setup
setupAgent().catch(console.error);
