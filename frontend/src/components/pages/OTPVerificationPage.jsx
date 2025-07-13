import React, { useState, useEffect } from 'react'
import { Shield, Clock, CheckCircle, AlertCircle, ArrowLeft, Copy, Package, User, Calendar, IndianRupee } from 'lucide-react'

const OTPVerificationPage = ({ user, onBack }) => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyingDeal, setVerifyingDeal] = useState(null)
  const [otpInput, setOtpInput] = useState('')

  useEffect(() => {
    loadDeals()
  }, [user.phone])

  const loadDeals = async () => {
    try {
      // Load orders from backend
      const response = await fetch(`http://localhost:5000/api/orders/${user.phone}`);
      const data = await response.json();
      
      if (data.success) {
        // Transform orders to match the expected deal format
        const transformedDeals = data.orders.map(order => ({
          id: order.id,
          consumerPhone: order.consumerPhone,
          amount: order.totalAmount,
          currency: 'INR',
          status: order.status,
          createdAt: order.createdAt,
          items: order.items,
          otp: order.otp, // Include OTP for display
          farmerPhone: order.items[0]?.farmerName || 'Unknown',
        }));
        setDeals(transformedDeals);
      } else {
        console.error('Failed to load orders:', data.message);
        setDeals([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOTP = async (dealId) => {
    if (!otpInput || otpInput.length !== 6) {
      alert('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingDeal(dealId)
    try {
      const response = await fetch('http://localhost:5000/api/orders/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dealId,
          otp: otpInput,
          consumerPhone: user.phone
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Payment released successfully! ✅')
        setOtpInput('')
        await loadDeals() // Refresh orders
      } else {
        alert(`Verification failed: ${result.message}`)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setVerifyingDeal(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'refunded': return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'expired': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      case 'refunded': return <AlertCircle className="w-5 h-5" />
      case 'expired': return <AlertCircle className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
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
      <div className="order-dashboard-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <p className="text-green-800 text-xl font-semibold">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-dashboard-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="order-dashboard-header">
          <button
            onClick={onBack}
            className="btn btn-secondary flex items-center mb-4"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="order-dashboard-title">🔐 Verify Deliveries</h1>
          
          {/* Info Box */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-green-800 font-bold text-lg">How to Complete Payment</h3>
            </div>
            <p className="text-green-700 font-medium">
              When you receive your order, get the OTP from the farmer and enter it below to release the payment. 
              This ensures secure transactions for both parties.
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {deals.length === 0 ? (
            <div className="order-section">
              <div className="order-empty-state">
                <Package className="order-empty-icon mx-auto" />
                <h3 className="order-empty-title">No Pending Orders</h3>
                <p className="order-empty-description">No delivery confirmations required at the moment.</p>
              </div>
            </div>
          ) : (
            deals.map((deal) => (
              <div key={deal.id} className={`order-card ${deal.status === 'completed' ? 'completed' : 'pending'}`}>
                <div className="order-header">
                  <h3 className="order-id">
                    Order #{deal.id.substring(6)}
                  </h3>
                  <div className="text-right">
                    <span className={`order-status ${deal.status}`}>
                      {getStatusIcon(deal.status)}
                      <span className="capitalize">{deal.status}</span>
                    </span>
                    <div className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(deal.amount)}
                    </div>
                  </div>
                </div>

                <div className="order-details-grid">
                  <div className="order-detail-item">
                    <div className="order-detail-label">Order Date</div>
                    <div className="order-detail-value">{formatDate(deal.createdAt)}</div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Farmer Phone</div>
                    <div className="order-detail-value">{deal.farmerPhone || 'N/A'}</div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Status</div>
                    <div className="order-detail-value capitalize">{deal.status}</div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Payment Method</div>
                    <div className="order-detail-value">Escrow</div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items-section">
                  <h4 className="order-items-title flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Items
                  </h4>
                  <div className="space-y-1">
                    {deal.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <div>
                          <div className="order-item-name">{item.name}</div>
                          <div className="order-item-quantity">
                            {item.quantity} {item.unit} × ₹{item.price} = ₹{item.quantity * item.price}
                          </div>
                          {item.farmerName && (
                            <div className="text-green-600 text-sm flex items-center mt-1">
                              <User className="w-3 h-3 mr-1" />
                              Farmer: {item.farmerName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OTP Verification Section */}
                {deal.status === 'pending' && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 mt-4">
                    <h4 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Enter OTP from farmer to release payment:
                    </h4>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="otp-input-container">
                        {[...Array(6)].map((_, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={otpInput[index] || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const newOtp = otpInput.split('');
                              newOtp[index] = value;
                              const finalOtp = newOtp.join('').slice(0, 6);
                              setOtpInput(finalOtp);
                              
                              // Auto-focus next input
                              if (value && index < 5) {
                                const nextInput = e.target.parentElement.children[index + 1];
                                if (nextInput) nextInput.focus();
                              }
                            }}
                            className="otp-input-field"
                            placeholder="0"
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleVerifyOTP(deal.id)}
                        disabled={verifyingDeal === deal.id || otpInput.length !== 6}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg"
                      >
                        {verifyingDeal === deal.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        {verifyingDeal === deal.id ? 'Verifying...' : 'Verify & Release Payment'}
                      </button>
                    </div>

                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg mb-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                        <div className="text-yellow-700 text-sm">
                          <p className="font-semibold mb-1">Important: Only enter OTP after receiving your order</p>
                          <p>Payment will be immediately released to the farmer upon OTP verification</p>
                        </div>
                      </div>
                    </div>

                    {/* Test OTP info */}
                    <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                      <div className="flex items-center text-blue-700 text-sm font-medium">
                        <Shield className="w-4 h-4 mr-2" />
                        For testing: Use OTP "123456"
                      </div>
                    </div>
                  </div>
                )}

                {deal.status === 'completed' && (
                  <div className="payment-confirmation mt-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="payment-confirmation-text">Payment completed successfully!</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default OTPVerificationPage
