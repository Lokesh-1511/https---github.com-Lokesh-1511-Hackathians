import React, { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react'
import { consumerService } from '../../services/consumerService'
import { escrowService } from '../../services/escrowService'

const CheckoutPage = ({ cartItems, onBack, onOrderSuccess, user }) => {
  const [currentStep, setCurrentStep] = useState(1) // 1: Details, 2: Review, 3: Escrow
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Delivery Details
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPincode: '',
    deliveryInstructions: '',
    
    // Farmer Details
    farmerWalletAddress: '',
    
    // Order Notes
    orderNotes: ''
  })

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    tax: 0,
    deliveryFee: 50,
    total: 0
  })

  useEffect(() => {
    calculateOrderSummary()
  }, [cartItems])

  const calculateOrderSummary = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    const tax = Math.round(subtotal * 0.05) // 5% tax
    const total = subtotal + tax + 50 // 50 INR delivery fee

    setOrderSummary({
      subtotal,
      tax,
      deliveryFee: 50,
      total
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate delivery details
      if (!formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryPincode) {
        alert('Please fill in all delivery details')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Validate farmer wallet address
      if (!formData.farmerWalletAddress) {
        alert('Please enter farmer wallet address for escrow payment')
        return
      }
      setCurrentStep(3)
    }
  }

  const handleCreateEscrowDeal = async () => {
    if (!formData.farmerWalletAddress) {
      alert('Farmer wallet address is required for escrow payment')
      return
    }

    setLoading(true)
    try {
      // Create order first
      const orderData = {
        consumerPhone: user.phone,
        items: cartItems,
        deliveryDetails: {
          address: formData.deliveryAddress,
          city: formData.deliveryCity,
          pincode: formData.deliveryPincode,
          instructions: formData.deliveryInstructions
        },
        orderSummary: orderSummary,
        status: 'pending_payment',
        paymentMethod: 'escrow',
        orderNotes: formData.orderNotes
      }

      const orderResult = await consumerService.placeOrder(user.phone, orderData)
      
      if (orderResult.success) {
        // Get farmer details from the first item (assuming single farmer per order)
        const firstItem = cartItems[0]
        
        // Create escrow deal
        const escrowData = {
          buyerId: user.uid || user.phone,
          buyerPhone: user.phone,
          farmerId: firstItem.farmerId,
          farmerPhone: firstItem.farmerPhone || '+919999999999', // Default for demo
          farmerWalletAddress: formData.farmerWalletAddress,
          amount: orderSummary.total,
          currency: 'INR',
          items: cartItems,
          deliveryAddress: `${formData.deliveryAddress}, ${formData.deliveryCity} - ${formData.deliveryPincode}`,
          orderNotes: formData.orderNotes
        }

        const escrowResult = await escrowService.createEscrowDeal(escrowData)
        
        if (escrowResult.success) {
          // Update order with escrow deal ID
          await consumerService.updateOrderStatus(orderResult.orderId, 'escrow_created')
          
          // Clear cart
          await consumerService.clearCart(user.phone)
          
          // Show success
          alert(`Escrow deal created successfully! Deal ID: ${escrowResult.dealId}\nOTP sent to farmer for payment verification.`)
          
          onOrderSuccess({
            orderId: orderResult.orderId,
            escrowDealId: escrowResult.dealId,
            message: 'Order placed with escrow payment. Waiting for farmer confirmation.'
          })
        } else {
          throw new Error(escrowResult.error)
        }
      } else {
        throw new Error(orderResult.error)
      }
    } catch (error) {
      console.error('Escrow creation error:', error)
      alert(error.message || 'Failed to create escrow deal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const renderDeliveryDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Delivery Details</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Address *
          </label>
          <textarea
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            placeholder="Enter complete delivery address"
            rows="3"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              City *
            </label>
            <input
              type="text"
              name="deliveryCity"
              value={formData.deliveryCity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="City"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pincode *
            </label>
            <input
              type="text"
              name="deliveryPincode"
              value={formData.deliveryPincode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              placeholder="Pincode"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Instructions
          </label>
          <input
            type="text"
            name="deliveryInstructions"
            value={formData.deliveryInstructions}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            placeholder="Any special delivery instructions"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Order Notes
          </label>
          <textarea
            name="orderNotes"
            value={formData.orderNotes}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            placeholder="Any special requirements or notes"
            rows="2"
          />
        </div>
      </div>
    </div>
  )

  const renderOrderReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Order Review</h3>
      
      {/* Cart Items */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-300">Items</h4>
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-medium">{item.name}</p>
              <p className="text-gray-400 text-sm">{item.quantity} x {formatCurrency(item.price)}</p>
            </div>
            <p className="text-white font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="space-y-2 p-4 bg-white/5 rounded-lg">
        <div className="flex justify-between text-gray-300">
          <span>Subtotal</span>
          <span>{formatCurrency(orderSummary.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Tax (5%)</span>
          <span>{formatCurrency(orderSummary.tax)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Delivery Fee</span>
          <span>{formatCurrency(orderSummary.deliveryFee)}</span>
        </div>
        <div className="border-t border-white/20 pt-2 flex justify-between text-white font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(orderSummary.total)}</span>
        </div>
      </div>

      {/* Farmer Wallet Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Farmer Wallet Address for Escrow Payment *
        </label>
        <input
          type="text"
          name="farmerWalletAddress"
          value={formData.farmerWalletAddress}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          placeholder="0x... (Ethereum wallet address)"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Payment will be held in escrow until you confirm delivery with OTP
        </p>
      </div>
    </div>
  )

  const renderEscrowPayment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Escrow Payment</h3>
        <p className="text-gray-300">
          Your payment will be securely held until delivery is confirmed
        </p>
      </div>

      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">How Escrow Payment Works:</h4>
        <ol className="text-sm text-gray-300 space-y-1">
          <li>1. Your payment is locked in a smart contract</li>
          <li>2. An OTP is sent to the farmer</li>
          <li>3. Upon delivery, enter the OTP to release payment</li>
          <li>4. If not confirmed in 3 days, payment is automatically refunded</li>
        </ol>
      </div>

      <div className="space-y-3 p-4 bg-white/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Payment Amount:</span>
          <span className="text-white font-bold text-lg">{formatCurrency(orderSummary.total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Farmer Wallet:</span>
          <span className="text-white text-sm">{formData.farmerWalletAddress}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Escrow Duration:</span>
          <span className="text-white">3 days</span>
        </div>
      </div>

      <button
        onClick={handleCreateEscrowDeal}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Creating Escrow Deal...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Create Escrow Deal
          </>
        )}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          <div></div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-600'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-16 h-1 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-600'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center text-sm text-gray-400 space-x-16">
            <span className={currentStep >= 1 ? 'text-green-400' : ''}>Delivery Details</span>
            <span className={currentStep >= 2 ? 'text-green-400' : ''}>Review Order</span>
            <span className={currentStep >= 3 ? 'text-green-400' : ''}>Escrow Payment</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          {currentStep === 1 && renderDeliveryDetails()}
          {currentStep === 2 && renderOrderReview()}
          {currentStep === 3 && renderEscrowPayment()}

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
