import { db } from '../config/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore'

class EscrowService {
  constructor() {
    this.escrowCollection = 'escrow_deals'
    this.otpCollection = 'escrow_otps'
  }

  // Generate random OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Hash OTP for blockchain storage
  hashOTP(otp) {
    // Simple hash - in production use proper cryptographic hash
    return btoa(otp).split('').reverse().join('')
  }

  // Create escrow deal with OTP
  async createEscrowDeal(dealData) {
    try {
      const otp = this.generateOTP()
      const otpHash = this.hashOTP(otp)
      
      // Store OTP in Firestore (for farmer notification)
      const otpDoc = await addDoc(collection(db, this.otpCollection), {
        otp: otp,
        otpHash: otpHash,
        farmerId: dealData.farmerId,
        farmerPhone: dealData.farmerPhone,
        dealId: null, // Will be updated after deal creation
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      })

      // Create escrow deal
      const escrowDeal = {
        buyerId: dealData.buyerId,
        buyerPhone: dealData.buyerPhone,
        farmerId: dealData.farmerId,
        farmerPhone: dealData.farmerPhone,
        farmerWalletAddress: dealData.farmerWalletAddress,
        amount: dealData.amount,
        currency: dealData.currency || 'INR',
        items: dealData.items,
        otpId: otpDoc.id,
        otpHash: otpHash,
        status: 'pending', // pending, completed, refunded, expired
        blockchainTxHash: null,
        blockchainDealId: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        metadata: {
          deliveryAddress: dealData.deliveryAddress,
          orderNotes: dealData.orderNotes
        }
      }

      const dealDoc = await addDoc(collection(db, this.escrowCollection), escrowDeal)
      
      // Update OTP with deal ID
      await updateDoc(doc(db, this.otpCollection, otpDoc.id), {
        dealId: dealDoc.id
      })

      // Send OTP to farmer (simulate SMS)
      await this.sendOTPToFarmer(dealData.farmerPhone, otp, dealDoc.id)

      return {
        success: true,
        dealId: dealDoc.id,
        otpId: otpDoc.id,
        message: 'Escrow deal created successfully. OTP sent to farmer.'
      }
    } catch (error) {
      console.error('Error creating escrow deal:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Send OTP to farmer (simulate SMS service)
  async sendOTPToFarmer(farmerPhone, otp, dealId) {
    try {
      console.log(`🔐 OTP for Deal ${dealId}: ${otp}`)
      console.log(`📱 Sending OTP to farmer: ${farmerPhone}`)
      
      // In production, integrate with SMS service like Twilio
      // For now, we'll just log it
      return {
        success: true,
        message: `OTP ${otp} sent to ${farmerPhone}`
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Verify OTP and complete payment
  async verifyOTPAndCompletePayment(dealId, enteredOTP, consumerPhone) {
    try {
      // Get deal details
      const dealDoc = await getDoc(doc(db, this.escrowCollection, dealId))
      if (!dealDoc.exists()) {
        throw new Error('Deal not found')
      }

      const deal = dealDoc.data()
      
      // Verify consumer is the buyer
      if (deal.buyerPhone !== consumerPhone) {
        throw new Error('Unauthorized: Not the buyer of this deal')
      }

      // Check if deal is still pending
      if (deal.status !== 'pending') {
        throw new Error(`Deal is already ${deal.status}`)
      }

      // Check if deal has expired
      if (deal.expiresAt && deal.expiresAt.toDate() < new Date()) {
        throw new Error('Deal has expired')
      }

      // Get OTP details
      const otpDoc = await getDoc(doc(db, this.otpCollection, deal.otpId))
      if (!otpDoc.exists()) {
        throw new Error('OTP not found')
      }

      const otpData = otpDoc.data()
      
      // Verify OTP
      if (otpData.otp !== enteredOTP) {
        throw new Error('Invalid OTP')
      }

      // Simulate blockchain transaction
      const blockchainResult = await this.simulateBlockchainTransaction(deal)
      
      if (blockchainResult.success) {
        // Update deal status
        await updateDoc(doc(db, this.escrowCollection, dealId), {
          status: 'completed',
          blockchainTxHash: blockchainResult.txHash,
          blockchainDealId: blockchainResult.dealId,
          completedAt: serverTimestamp()
        })

        // Update OTP status
        await updateDoc(doc(db, this.otpCollection, deal.otpId), {
          status: 'used',
          usedAt: serverTimestamp()
        })

        return {
          success: true,
          message: 'Payment released to farmer successfully!',
          txHash: blockchainResult.txHash,
          dealId: blockchainResult.dealId
        }
      } else {
        throw new Error('Blockchain transaction failed')
      }
    } catch (error) {
      console.error('Error verifying OTP and completing payment:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Simulate blockchain transaction (replace with actual Web3 integration)
  async simulateBlockchainTransaction(deal) {
    try {
      console.log('🔗 Simulating blockchain transaction...')
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate transaction success (90% success rate)
      const isSuccessful = Math.random() > 0.1
      
      if (isSuccessful) {
        const txHash = '0x' + Math.random().toString(16).substring(2, 66)
        const dealId = Math.floor(Math.random() * 1000000)
        
        console.log(`✅ Blockchain transaction successful: ${txHash}`)
        console.log(`💰 Payment of ${deal.amount} ${deal.currency} released to farmer`)
        
        return {
          success: true,
          txHash: txHash,
          dealId: dealId
        }
      } else {
        throw new Error('Blockchain network error')
      }
    } catch (error) {
      console.error('Blockchain transaction failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get deals for a consumer
  async getConsumerDeals(consumerPhone) {
    try {
      const q = query(
        collection(db, this.escrowCollection),
        where('buyerPhone', '==', consumerPhone)
      )
      const querySnapshot = await getDocs(q)
      const deals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      }))
      
      return deals.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()))
    } catch (error) {
      console.error('Error getting consumer deals:', error)
      return []
    }
  }

  // Get deals for a farmer
  async getFarmerDeals(farmerPhone) {
    try {
      const q = query(
        collection(db, this.escrowCollection),
        where('farmerPhone', '==', farmerPhone)
      )
      const querySnapshot = await getDocs(q)
      const deals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      }))
      
      return deals.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()))
    } catch (error) {
      console.error('Error getting farmer deals:', error)
      return []
    }
  }

  // Get pending OTPs for a farmer
  async getFarmerOTPs(farmerPhone) {
    try {
      const q = query(
        collection(db, this.otpCollection),
        where('farmerPhone', '==', farmerPhone),
        where('status', '==', 'pending')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      }))
    } catch (error) {
      console.error('Error getting farmer OTPs:', error)
      return []
    }
  }

  // Refund expired deal
  async refundExpiredDeal(dealId) {
    try {
      const dealDoc = await getDoc(doc(db, this.escrowCollection, dealId))
      if (!dealDoc.exists()) {
        throw new Error('Deal not found')
      }

      const deal = dealDoc.data()
      
      // Check if deal has expired and is still pending
      if (deal.status !== 'pending') {
        throw new Error('Deal is not pending')
      }

      if (!deal.expiresAt || deal.expiresAt.toDate() > new Date()) {
        throw new Error('Deal has not expired yet')
      }

      // Simulate blockchain refund
      const refundResult = await this.simulateBlockchainRefund(deal)
      
      if (refundResult.success) {
        await updateDoc(doc(db, this.escrowCollection, dealId), {
          status: 'refunded',
          refundTxHash: refundResult.txHash,
          refundedAt: serverTimestamp()
        })

        return {
          success: true,
          message: 'Deal refunded successfully',
          txHash: refundResult.txHash
        }
      } else {
        throw new Error('Refund transaction failed')
      }
    } catch (error) {
      console.error('Error refunding deal:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Simulate blockchain refund
  async simulateBlockchainRefund(deal) {
    try {
      console.log('🔄 Simulating blockchain refund...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const txHash = '0x' + Math.random().toString(16).substring(2, 66)
      console.log(`✅ Refund successful: ${txHash}`)
      console.log(`💰 Amount ${deal.amount} ${deal.currency} refunded to buyer`)
      
      return {
        success: true,
        txHash: txHash
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }
}

export const escrowService = new EscrowService()
