import { ethers } from 'ethers'
import walletService from './walletService'

// Import contract ABI and deployment info
import EscrowWithOTPABI from '../abi/EscrowWithOTP.json'
import deploymentInfo from '../shared/deploy-info.json'

class BlockchainEscrowService {
  constructor() {
    this.contractAddress = deploymentInfo.localhost?.EscrowWithOTP
    this.contractABI = EscrowWithOTPABI.abi || EscrowWithOTPABI
  }

  // Get contract instance
  getContract() {
    if (!this.contractAddress) {
      throw new Error('EscrowWithOTP contract not deployed')
    }
    
    return walletService.getContract(this.contractAddress, this.contractABI)
  }

  // Create a new escrow deal
  async createDeal(farmerAddress, amount, otpHash, dealDetails = '') {
    try {
      if (!walletService.isConnected) {
        throw new Error('Wallet not connected')
      }

      const contract = this.getContract()
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount.toString())
      
      console.log('Creating deal:', {
        farmer: farmerAddress,
        amount: amount.toString(),
        amountInWei: amountInWei.toString(),
        otpHash,
        dealDetails
      })

      // Call createDeal function and send ETH
      const tx = await contract.createDeal(
        farmerAddress,
        otpHash,
        dealDetails,
        {
          value: amountInWei,
          gasLimit: 300000 // Set gas limit
        }
      )

      console.log('Transaction sent:', tx.hash)
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      // Get the deal ID from the event logs
      const dealCreatedEvent = receipt.logs.find(
        log => {
          try {
            const parsed = contract.interface.parseLog(log)
            return parsed && parsed.name === 'DealCreated'
          } catch (e) {
            return false
          }
        }
      )

      let dealId = null
      if (dealCreatedEvent) {
        const parsed = contract.interface.parseLog(dealCreatedEvent)
        dealId = parsed.args.dealId.toString()
      }

      return {
        success: true,
        transactionHash: tx.hash,
        dealId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }

    } catch (error) {
      console.error('Error creating deal:', error)
      throw new Error(`Failed to create deal: ${error.message}`)
    }
  }

  // Complete deal with OTP
  async completeDealWithOTP(dealId, otp) {
    try {
      if (!walletService.isConnected) {
        throw new Error('Wallet not connected')
      }

      const contract = this.getContract()
      
      console.log('Completing deal:', { dealId, otp })

      const tx = await contract.completeDealWithOTP(dealId, otp, {
        gasLimit: 200000
      })

      console.log('Transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }

    } catch (error) {
      console.error('Error completing deal:', error)
      throw new Error(`Failed to complete deal: ${error.message}`)
    }
  }

  // Cancel a deal (only buyer can cancel)
  async cancelDeal(dealId) {
    try {
      if (!walletService.isConnected) {
        throw new Error('Wallet not connected')
      }

      const contract = this.getContract()
      
      console.log('Cancelling deal:', dealId)

      const tx = await contract.cancelDeal(dealId, {
        gasLimit: 150000
      })

      console.log('Transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }

    } catch (error) {
      console.error('Error cancelling deal:', error)
      throw new Error(`Failed to cancel deal: ${error.message}`)
    }
  }

  // Get deal details
  async getDeal(dealId) {
    try {
      const contract = this.getContract()
      
      const deal = await contract.deals(dealId)
      
      return {
        buyer: deal.buyer,
        farmer: deal.farmer,
        amount: ethers.formatEther(deal.amount),
        otpHash: deal.otpHash,
        dealDetails: deal.dealDetails,
        isCompleted: deal.isCompleted,
        isCancelled: deal.isCancelled,
        createdAt: new Date(Number(deal.createdAt) * 1000).toISOString()
      }

    } catch (error) {
      console.error('Error getting deal:', error)
      throw new Error(`Failed to get deal: ${error.message}`)
    }
  }

  // Get deal count
  async getDealCount() {
    try {
      const contract = this.getContract()
      const count = await contract.dealCount()
      return Number(count)
    } catch (error) {
      console.error('Error getting deal count:', error)
      throw new Error(`Failed to get deal count: ${error.message}`)
    }
  }

  // Get all deals for a specific user (buyer or farmer)
  async getDealsForUser(userAddress) {
    try {
      const contract = this.getContract()
      const dealCount = await this.getDealCount()
      const userDeals = []

      for (let i = 1; i <= dealCount; i++) {
        try {
          const deal = await this.getDeal(i)
          if (deal.buyer.toLowerCase() === userAddress.toLowerCase() || 
              deal.farmer.toLowerCase() === userAddress.toLowerCase()) {
            userDeals.push({
              id: i,
              ...deal,
              role: deal.buyer.toLowerCase() === userAddress.toLowerCase() ? 'buyer' : 'farmer'
            })
          }
        } catch (error) {
          console.warn(`Error getting deal ${i}:`, error)
        }
      }

      return userDeals
    } catch (error) {
      console.error('Error getting user deals:', error)
      throw new Error(`Failed to get user deals: ${error.message}`)
    }
  }

  // Listen for contract events
  async listenForEvents(callback) {
    try {
      const contract = this.getContract()
      
      // Listen for DealCreated events
      contract.on('DealCreated', (dealId, buyer, farmer, amount, event) => {
        callback({
          type: 'DealCreated',
          dealId: dealId.toString(),
          buyer,
          farmer,
          amount: ethers.formatEther(amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        })
      })

      // Listen for DealCompleted events
      contract.on('DealCompleted', (dealId, event) => {
        callback({
          type: 'DealCompleted',
          dealId: dealId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        })
      })

      // Listen for DealCancelled events
      contract.on('DealCancelled', (dealId, event) => {
        callback({
          type: 'DealCancelled',
          dealId: dealId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        })
      })

      return () => {
        contract.removeAllListeners()
      }

    } catch (error) {
      console.error('Error setting up event listeners:', error)
      throw new Error(`Failed to listen for events: ${error.message}`)
    }
  }

  // Generate OTP hash (for demonstration - in production this should be done securely on backend)
  generateOTPHash(otp) {
    return ethers.keccak256(ethers.toUtf8Bytes(otp))
  }

  // Verify OTP against hash
  verifyOTP(otp, hash) {
    const otpHash = this.generateOTPHash(otp)
    return otpHash === hash
  }
}

export default new BlockchainEscrowService()
