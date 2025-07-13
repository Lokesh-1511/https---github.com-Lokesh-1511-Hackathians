import React, { useState, useEffect } from 'react'
import { Shield, Clock, CheckCircle, Copy, Eye, EyeOff, ArrowLeft, DollarSign } from 'lucide-react'

const FarmerOTPPage = ({ user, onBack }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOTPs, setShowOTPs] = useState({})

  useEffect(() => {
    loadOrders()
  }, [user.phone])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/farmer/orders/${user.phone}`)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyOTP = async (otp) => {
    try {
      await navigator.clipboard.writeText(otp)
      alert('OTP copied to clipboard!')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = otp
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('OTP copied to clipboard!')
    }
  }

  const toggleShowOTP = (orderId) => {
    setShowOTPs(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your orders...</p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(order => order.status === 'pending_farmer_confirmation')
  const completedOrders = orders.filter(order => order.status === 'completed')

  return (
    <div className="order-dashboard-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="order-dashboard-header">
          <button
            onClick={onBack}
            className="btn btn-secondary flex items-center mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="order-dashboard-title">Order Management & Wallet</h1>
          
          <div className="order-wallet-balance">
            <div className="balance-label">Wallet Balance</div>
            <div className="balance-amount">₹{(user.walletBalance || 0).toLocaleString()}</div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-bold mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Farmer Instructions:
            </h3>
            <p className="text-green-700 font-medium">
              Share the OTP with customers only after delivering their orders. Once they enter the OTP, 
              the payment will be released to your wallet balance.
            </p>
          </div>
        </div>

        <div className="order-grid-container">
          {/* Pending Orders */}
          <div className="order-section">
            <h2 className="order-section-title">
              <Clock className="w-6 h-6" />
              Pending Orders 
              <span className="order-section-count">{pendingOrders.length}</span>
            </h2>
            
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="order-empty-state">
                  <Shield className="order-empty-icon mx-auto" />
                  <h3 className="order-empty-title">No Pending Orders</h3>
                  <p className="order-empty-description">No pending delivery confirmations at the moment.</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className="order-card pending">
                    <div className="order-header">
                      <h3 className="order-id">
                        Order #{order.id.substring(0, 8)}
                      </h3>
                      <span className="order-status pending">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    </div>

                    <div className="order-details-grid">
                      <div className="order-detail-item">
                        <div className="order-detail-label">Amount</div>
                        <div className="order-detail-value order-amount-value">₹{order.totalAmount?.toLocaleString()}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Customer</div>
                        <div className="order-detail-value">{order.consumerPhone}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Order Date</div>
                        <div className="order-detail-value">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Payment Method</div>
                        <div className="order-detail-value">{order.paymentMethod}</div>
                      </div>
                    </div>
                      
                    {order.items && (
                      <div className="order-items-section">
                        <div className="order-items-title">Items:</div>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                              <div>
                                <span className="order-item-name">{item.name}</span>
                                <span className="order-item-quantity"> x{item.quantity} {item.unit}</span>
                              </div>
                              <span className="order-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OTP Section */}
                    <div className="otp-section">
                      <div className="otp-label">Delivery OTP:</div>
                      <div className="otp-actions">
                        <button
                          onClick={() => toggleShowOTP(order.id)}
                          className="otp-action-btn"
                          title={showOTPs[order.id] ? "Hide OTP" : "Show OTP"}
                        >
                          {showOTPs[order.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyOTP(order.otp)}
                          className="otp-action-btn"
                          title="Copy OTP"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="otp-display">
                        {showOTPs[order.id] ? order.otp : '••••••'}
                      </div>
                      <p className="otp-instructions">
                        Share this OTP with customer after delivery
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Orders */}
          <div className="order-section">
            <h2 className="order-section-title">
              <CheckCircle className="w-6 h-6" />
              Completed Orders 
              <span className="order-section-count">{completedOrders.length}</span>
            </h2>
            
            <div className="space-y-4">
              {completedOrders.length === 0 ? (
                <div className="order-empty-state">
                  <CheckCircle className="order-empty-icon mx-auto" />
                  <h3 className="order-empty-title">No Completed Orders</h3>
                  <p className="order-empty-description">Completed orders will appear here.</p>
                </div>
              ) : (
                completedOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="order-card completed">
                    <div className="order-header">
                      <h3 className="order-id">
                        Order #{order.id.substring(0, 8)}
                      </h3>
                      <span className="order-status completed">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    </div>

                    <div className="order-details-grid">
                      <div className="order-detail-item">
                        <div className="order-detail-label">Amount Credited</div>
                        <div className="order-detail-value order-amount-value">₹{order.totalAmount?.toLocaleString()}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Customer</div>
                        <div className="order-detail-value">{order.consumerPhone}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Completed Date</div>
                        <div className="order-detail-value">{formatDate(order.updatedAt || order.createdAt)}</div>
                      </div>
                      <div className="order-detail-item">
                        <div className="order-detail-label">Items</div>
                        <div className="order-detail-value">{order.items?.length || 0} item(s)</div>
                      </div>
                    </div>

                    <div className="payment-confirmation">
                      <DollarSign className="w-5 h-5" />
                      <span className="payment-confirmation-text">Payment released to wallet</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerOTPPage
