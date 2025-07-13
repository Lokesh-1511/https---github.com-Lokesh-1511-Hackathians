import React from 'react'
import WalletConnection from './components/WalletConnection'

// Test component to verify wallet integration
const WalletTest = () => {
  const testUser = {
    name: 'Test User',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // First Hardhat account
  }

  const handleWalletConnected = (account) => {
    console.log('Test: Wallet connected', account)
  }

  const handleWalletDisconnected = () => {
    console.log('Test: Wallet disconnected')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Wallet Connection Test</h1>
      <p>This is a test page to verify MetaMask wallet integration.</p>
      
      <WalletConnection 
        currentUser={testUser}
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
      />
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Make sure MetaMask is installed and running</li>
          <li>Import the first Hardhat account into MetaMask:
            <br/><code>Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code>
          </li>
          <li>Connect to Hardhat Local Network (Chain ID: 31337)</li>
          <li>Click "Connect Wallet" button above</li>
          <li>The wallet should automatically recognize the correct address</li>
        </ol>
      </div>
    </div>
  )
}

export default WalletTest
