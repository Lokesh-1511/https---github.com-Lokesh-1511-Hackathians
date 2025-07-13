import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Filter, Star, MapPin, Calendar, Plus, Package, Heart, Eye, Truck, TrendingUp } from 'lucide-react'
import { productService } from '../../services/productService'
import { consumerService } from '../../services/consumerService'
import CartPage from '../pages/CartPage'
import OTPVerificationPage from '../pages/OTPVerificationPage'
import ConsumerAISuggestions from '../ConsumerAISuggestions'

const ConsumerDashboard = ({ user }) => {
  const [availableProduce, setAvailableProduce] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showOTPPage, setShowOTPPage] = useState(false)
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalProducts: 0,
    activeBids: 0,
    savedFarmers: 0,
    totalSpent: 0,
    recentOrders: [],
    pendingOrders: 0
  })
  const [savedFarmers, setSavedFarmers] = useState([])

  useEffect(() => {
    loadData()
  }, [user.phone])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading consumer data for:', user.phone)
      const [products, consumerStats, savedFarmersData, cartData] = await Promise.all([
        productService.getAllProducts(),
        consumerService.getConsumerStats(user.phone),
        consumerService.getSavedFarmers(user.phone),
        consumerService.getCartFromFirestore(user.phone)
      ])
      
      console.log('📊 Consumer stats loaded:', consumerStats)
      setAvailableProduce(products)
      setStats(consumerStats)
      setSavedFarmers(savedFarmersData)
      setCart(cartData)
    } catch (error) {
      console.error('Error loading consumer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'grains', label: 'Grains' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'pulses', label: 'Pulses' }
  ]

  const filteredProduce = availableProduce.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.farmerName && item.farmerName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'grains' && ['rice', 'wheat'].some(g => item.name.toLowerCase().includes(g))) ||
                           (selectedCategory === 'vegetables' && ['tomato'].some(v => item.name.toLowerCase().includes(v))) ||
                           item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddToCart = async (product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      alert('This product is already in your cart!')
      return
    }
    
    // Add full quantity only (bulk purchase)
    const updatedCart = [...cart, { 
      ...product, 
      quantity: product.quantity, // Use full available quantity
      isBulkPurchase: true
    }]
    
    setCart(updatedCart)
    
    // Save cart to Firestore
    await consumerService.saveCartToFirestore(user.phone, updatedCart)
    
    alert(`${product.name} (${product.quantity} ${product.unit}) added to cart as bulk purchase!`)
  }

  const handleRemoveFromCart = async (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId)
    setCart(updatedCart)
    await consumerService.saveCartToFirestore(user.phone, updatedCart)
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

  const handleSaveFarmer = async (farmerData) => {
    try {
      const isSaved = savedFarmers.some(farmer => farmer.phone === farmerData.phone)
      
      if (isSaved) {
        const success = await consumerService.unsaveFarmer(user.phone, farmerData)
        if (success) {
          setSavedFarmers(prev => prev.filter(farmer => farmer.phone !== farmerData.phone))
          // Refresh stats
          const updatedStats = await consumerService.getConsumerStats(user.phone)
          setStats(updatedStats)
          alert('Farmer removed from saved list')
        } else {
          alert('Failed to remove farmer from saved list')
        }
      } else {
        const success = await consumerService.saveFarmer(user.phone, farmerData)
        if (success) {
          setSavedFarmers(prev => [...prev, farmerData])
          // Refresh stats
          const updatedStats = await consumerService.getConsumerStats(user.phone)
          setStats(updatedStats)
          alert('Farmer saved successfully!')
        } else {
          alert('Failed to save farmer')
        }
      }
    } catch (error) {
      console.error('Error handling save farmer:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleContactFarmer = (farmerPhone) => {
    alert(`Contacting farmer at ${farmerPhone}... This would open a chat or call interface.`)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }
    // setShowCheckout(true)
    alert('Checkout feature temporarily disabled due to service loading issue. Will be fixed shortly!')
  }

  const handlePaymentSuccess = async (paymentData) => {
    // Refresh stats after successful payment
    await loadData()
    setShowCheckout(false)
    alert(`Order placed successfully! Order ID: ${paymentData.orderId}`)
  }

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Temporary currency formatter (replace with paymentService later)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Page navigation
  if (showCart) {
    return <CartPage user={user} onBack={() => setShowCart(false)} />
  }

  if (showOTPPage) {
    return <OTPVerificationPage user={user} onBack={() => setShowOTPPage(false)} />
  }



  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center w-full">
            <div>
              <h1 className="card-title">Consumer Dashboard</h1>
              <p className="card-subtitle">
                Welcome back, {user.name}! Discover fresh produce from local farmers.
              </p>
              <p className="text-xs text-gray-500">User: {user.phone}</p>
            </div>
            <button
              onClick={loadData}
              className="btn btn-secondary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid mb-4">
          <div className="dashboard-card">
            <Package className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.totalPurchases}</h3>
            <p className="dashboard-card-desc">Total Orders</p>
          </div>
          <div className="dashboard-card">
            <TrendingUp className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.totalProducts}</h3>
            <p className="dashboard-card-desc">Products Bought</p>
          </div>
          <div className="dashboard-card">
            <Filter className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.activeBids}</h3>
            <p className="dashboard-card-desc">Active Bids</p>
          </div>
          <div className="dashboard-card">
            <Heart className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.savedFarmers}</h3>
            <p className="dashboard-card-desc">Saved Farmers</p>
          </div>
          <div className="dashboard-card">
            <ShoppingCart className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{formatCurrency(stats.totalSpent)}</h3>
            <p className="dashboard-card-desc">Total Spent</p>
          </div>
          <div className="dashboard-card">
            <Truck className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.pendingOrders}</h3>
            <p className="dashboard-card-desc">Pending Orders</p>
          </div>
        </div>

        {/* AI Shopping Intelligence */}
        <ConsumerAISuggestions 
          availableProduce={availableProduce}
          cart={cart}
          userStats={stats}
        />

        {/* Quick Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowCart(true)}
            className="btn btn-primary flex items-center"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({getTotalCartItems()})
          </button>
          <button
            onClick={() => setShowOTPPage(true)}
            className="btn btn-secondary flex items-center"
          >
            <Package className="w-4 h-4 mr-2" />
            Verify Deliveries
          </button>
        </div>

        {/* Search and Filter */}
        <div className="card mb-4">
          <h3 className="card-title" style={{ fontSize: '1.5rem' }}>Find Fresh Produce</h3>
          <div className="form-row">
            <div className="form-group">
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }} 
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  placeholder="Search for crops or farmers..."
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            <div className="form-group">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Available Produce */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Available Produce ({filteredProduce.length})
          </h3>
          
          {loading ? (
            <p className="text-center" style={{ color: '#666', padding: '2rem' }}>
              Loading products...
            </p>
          ) : filteredProduce.length === 0 ? (
            <p className="text-center" style={{ color: '#666', padding: '2rem' }}>
              No produce found matching your criteria. Try adjusting your search or filters.
            </p>
          ) : (
            <div className="dashboard-grid">
              {filteredProduce.map(item => {
                const isSaved = savedFarmers.some(farmer => farmer.phone === item.farmerPhone)
                
                return (
                  <div key={item.id} className="dashboard-card" style={{ maxWidth: '400px' }}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="dashboard-card-title" style={{ fontSize: '1.25rem' }}>
                        {item.name}
                      </h4>
                      <button
                        onClick={() => handleSaveFarmer({
                          name: item.farmerName,
                          phone: item.farmerPhone,
                          location: item.location
                        })}
                        className={`p-1 rounded transition-colors ${
                          isSaved 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} color="#666" />
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                          {item.farmerName || 'Unknown Farmer'} • {item.location || 'Location not specified'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={16} color="#666" />
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                          Added: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      {item.description}
                    </p>

                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2D5016' }}>
                          ₹{item.price}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          Bulk: {item.quantity} {item.unit} only
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#e67e22', fontWeight: 'bold' }}>
                          ⚠️ Whole quantity purchase only
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
                      >
                        <ShoppingCart size={16} />
                        Buy Bulk ({item.quantity} {item.unit})
                      </button>
                      <button
                        onClick={() => handleContactFarmer(item.farmerPhone)}
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem', fontSize: '0.9rem' }}
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ConsumerDashboard
