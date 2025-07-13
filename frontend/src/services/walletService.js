import { ethers } from 'ethers'

class WalletService {
  constructor() {
    this.provider = null
    this.signer = null
    this.account = null
    this.isConnected = false
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Connect to MetaMask
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in MetaMask.')
      }

      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      this.account = accounts[0]
      this.isConnected = true

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this))
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))

      return {
        account: this.account,
        isConnected: true
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null
    this.signer = null
    this.account = null
    this.isConnected = false

    // Remove event listeners
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', this.handleChainChanged)
    }
  }

  // Handle account changes
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnect()
    } else {
      this.account = accounts[0]
      // Trigger a custom event for the app to listen to
      window.dispatchEvent(new CustomEvent('walletAccountChanged', { 
        detail: { account: this.account } 
      }))
    }
  }

  // Handle chain changes
  handleChainChanged(chainId) {
    // Reload the page to avoid inconsistent state
    window.location.reload()
  }

  // Get current account
  async getCurrentAccount() {
    if (!this.isMetaMaskInstalled()) {
      return null
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.error('Error getting current account:', error)
      return null
    }
  }

  // Check if specific address matches connected wallet
  async isAddressConnected(targetAddress) {
    const currentAccount = await this.getCurrentAccount()
    return currentAccount && currentAccount.toLowerCase() === targetAddress.toLowerCase()
  }

  // Get wallet balance
  async getBalance() {
    if (!this.isConnected || !this.provider || !this.account) {
      throw new Error('Wallet not connected')
    }

    try {
      const balance = await this.provider.getBalance(this.account)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      throw error
    }
  }

  // Switch to Hardhat local network
  async switchToLocalNetwork() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex (Hardhat default)
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7A69',
            chainName: 'Hardhat Local',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['http://127.0.0.1:8545'],
            blockExplorerUrls: null
          }]
        })
      } else {
        throw switchError
      }
    }
  }

  // Get contract instance
  getContract(contractAddress, contractABI) {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }
    return new ethers.Contract(contractAddress, contractABI, this.signer)
  }

  // Send transaction
  async sendTransaction(to, value, data = '0x') {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value.toString()),
        data
      })

      return tx
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }
}

export default new WalletService()
