import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, Wallet, Shield } from 'lucide-react'
import { consumerService } from '../../services/consumerService'
import { useNavigate } from 'react-router-dom'
import WalletConnection from '../WalletConnection'
import walletService from '../../services/walletService'

const CartPage = ({ user, onBack }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [walletConnected, setWalletConnected] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [walletBalance, setWalletBalance] = useState(100000) // Initial balance ₹100,000
  const [showCheckout, setShowCheckout] = useState(false)
  const [escrowProcessing, setEscrowProcessing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCart()
    checkWalletConnection()
    loadWalletBalance()
  }, [user.phone])

  const loadWalletBalance = async () => {
    try {
      // Load wallet balance from backend/localStorage
      const savedBalance = localStorage.getItem(`wallet_balance_${user.phone}`)
      if (savedBalance) {
        setWalletBalance(parseFloat(savedBalance))
      } else {
        // Set initial balance and save it
        const initialBalance = 100000
        setWalletBalance(initialBalance)
        localStorage.setItem(`wallet_balance_${user.phone}`, initialBalance.toString())
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error)
    }
  }

  const checkWalletConnection = async () => {
    try {
      const account = await walletService.getCurrentAccount()
      if (account) {
        setConnectedAccount(account)
        setWalletConnected(true)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const handleWalletConnected = (account) => {
    setConnectedAccount(account)
    setWalletConnected(true)
  }

  const handleWalletDisconnected = () => {
    setConnectedAccount(null)
    setWalletConnected(false)
  }

  const loadCart = async () => {
    try {
      setLoading(true)
      const cartData = await consumerService.getCartFromFirestore(user.phone)
      setCart(cartData)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    
    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    )
    setCart(updatedCart)
    await consumerService.saveCartToFirestore(user.phone, updatedCart)
  }

  const handleRemoveFromCart = async (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId)
    setCart(updatedCart)
    await consumerService.saveCartToFirestore(user.phone, updatedCart)
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCart([])
      await consumerService.saveCartToFirestore(user.phone, [])
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[₹,]/g, '')) || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }

    if (!walletConnected) {
      alert('Please connect your wallet first!')
      return
    }

    setShowCheckout(true)
  }

  const handlePay = async () => {
    const totalAmount = calculateTotal()
    
    if (walletBalance < totalAmount) {
      alert('Insufficient wallet balance!')
      return
    }

    setEscrowProcessing(true)
    try {
      // Deduct amount from wallet
      const newBalance = walletBalance - totalAmount
      setWalletBalance(newBalance)
      localStorage.setItem(`wallet_balance_${user.phone}`, newBalance.toString())

      // Create order in Firestore
      const orderData = {
        consumerPhone: user.phone,
        items: cart,
        totalAmount: totalAmount,
        status: 'pending',
        createdAt: new Date(),
        paymentMethod: 'escrow'
      }

      // Save order to backend
      await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      // Simulate escrow payment process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`Payment successful! ₹${totalAmount} deducted from wallet. Your order has been placed and payment will be released upon delivery confirmation.`)
      
      // Clear cart after successful payment
      setCart([])
      await consumerService.saveCartToFirestore(user.phone, [])
      
      // Show success message
      setShowCheckout(false)
      setEscrowProcessing(false)
      
      // Navigate back to dashboard
      onBack()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Payment failed. Please try again.')
      setEscrowProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Checkout Modal
  if (showCheckout) {
    return (
      <div className="min-h-screen p-6" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex items-center text-purple-600 hover:text-purple-800 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Cart
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
              <div></div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Wallet Balance</h3>
                  <p className="text-gray-600">Available funds for payment</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(walletBalance)}</p>
                <p className="text-sm text-gray-600">Current Balance</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Secure Escrow Payment</h2>
              <p className="text-gray-600">Your payment will be held securely until delivery confirmation</p>
            </div>

            {/* Order Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-gray-800 font-medium">{item.name}</span>
                    <span className="text-gray-600 text-sm ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-gray-800">{formatCurrency(parseFloat(item.price.replace(/[₹,]/g, '')) * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                  <span>Total Amount</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-green-600 mt-2">
                  <span>Remaining Balance</span>
                  <span>{formatCurrency(walletBalance - calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePay}
              disabled={escrowProcessing || walletBalance < calculateTotal()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {escrowProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : walletBalance < calculateTotal() ? (
                <>
                  <Wallet className="w-6 h-6 mr-2" />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6 mr-2" />
                  Pay {formatCurrency(calculateTotal())} with Escrow
                </>
              )}
            </button>

            <p className="text-center text-gray-600 text-sm mt-4">
              Payment will be released to farmer only after you confirm delivery with OTP
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="cart-header-card">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="cart-back-button"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="cart-title">Shopping Cart</h1>
            <div className="cart-item-count">
              <ShoppingCart className="w-7 h-7 mr-2" />
              <span>{cart.length} items</span>
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="cart-wallet-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-6 h-6 text-agriculture-primary mr-3" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Wallet Connection</h3>
                <p className="text-gray-600">Connect your wallet to proceed with secure payments</p>
              </div>
            </div>
            <div className="text-right">
              {walletConnected ? (
                <div>
                  <span className="wallet-connected-badge">
                    ✅ Connected
                  </span>
                  <p className="text-gray-600 text-sm mb-2">
                    {connectedAccount ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : ''}
                  </p>
                  <p className="wallet-balance">
                    Balance: {formatCurrency(walletBalance)}
                  </p>
                </div>
              ) : (
                <WalletConnection 
                  currentUser={user}
                  onWalletConnected={handleWalletConnected}
                  onWalletDisconnected={handleWalletDisconnected}
                />
              )}
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          // Empty Cart
          <div className="cart-empty-state">
            <ShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 text-lg">Add some fresh produce from our farmers!</p>
            <button
              onClick={onBack}
              className="cart-action-button"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          // Cart Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-farmer">
                        Farmer: {item.farmerName || 'Local Farmer'}
                      </p>
                      <p className="cart-item-price">{item.price}</p>
                    </div>
                    
                    <div className="cart-item-controls">
                      {/* Quantity Controls */}
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn quantity-btn-minus"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn quantity-btn-plus"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="remove-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Subtotal */}
                  <div className="cart-item-subtotal">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="cart-subtotal-amount">
                        {formatCurrency(parseFloat(item.price.replace(/[₹,]/g, '')) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="cart-summary-section">
                <h3 className="cart-summary-title">Order Summary</h3>
                
                <div className="cart-summary-details">
                  <div className="cart-summary-line">
                    <span>Items ({cart.length})</span>
                    <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="cart-summary-line">
                    <span>Delivery</span>
                    <span className="font-semibold text-agriculture-success">Free</span>
                  </div>
                  <div className="cart-summary-total">
                    <div className="flex justify-between text-gray-800 font-bold text-xl">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="cart-action-buttons">
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={!walletConnected}
                    className="cart-checkout-button"
                  >
                    <CreditCard className="w-6 h-6 mr-2" />
                    {walletConnected ? 'Proceed to Checkout' : 'Connect Wallet to Pay'}
                  </button>
                  
                  <button
                    onClick={handleClearCart}
                    className="cart-clear-button"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Security Notice */}
                <div className="cart-security-notice">
                  <p className="cart-security-title">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure Escrow Payment
                  </p>
                  <p className="cart-security-text">
                    Your payment is held securely until delivery confirmation. 
                    Funds are released only after you verify receipt with OTP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
