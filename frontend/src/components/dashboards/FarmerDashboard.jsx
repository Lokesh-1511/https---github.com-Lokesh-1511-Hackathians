import React, { useState, useEffect } from 'react'
import { Sprout, Package, TrendingUp, Users, Plus, Edit, Trash2, X, Shield, Clock, CheckCircle } from 'lucide-react'
import { productService } from '../../services/productService'
import FarmerOTPPage from '../pages/FarmerOTPPage'
import AISuggestions from '../AISuggestions'

const FarmerDashboard = ({ user }) => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showOTPPage, setShowOTPPage] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    price: '',
    category: '',
    description: '',
    location: ''
  })

  useEffect(() => {
    console.log('🚀 FarmerDashboard mounted, loading data...')
    loadProducts()
    loadOrders()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log('📥 Loading products for farmer:', user.phone)
      const farmerProducts = await productService.getProductsByFarmer(user.phone)
      console.log('📋 Loaded products:', farmerProducts)
      setProducts(farmerProducts)
    } catch (error) {
      console.error('❌ Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      console.log('📥 Loading orders for farmer:', user.phone)
      const response = await fetch(`http://localhost:5000/api/farmer/orders/${user.phone}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('📋 Loaded farmer orders:', data.orders)
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error)
    }
  }

  const stats = {
    totalListings: products.length,
    activeListing: products.filter(product => product.status === 'Available' || !product.status).length,
    totalSold: orders.filter(order => order.status === 'completed').length,
    pendingOrders: orders.filter(order => order.status === 'pending_farmer_confirmation').length,
    walletBalance: user.walletBalance || 0,
    totalRevenue: `₹${orders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + (order.totalAmount || 0), 0)
      .toLocaleString()}`
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.quantity || !newProduct.price) {
      alert('Please fill in all required fields')
      return
    }

    try {
      console.log('🌱 Adding product:', newProduct)
      console.log('👨‍🌾 User phone:', user.phone)
      
      const productData = {
        ...newProduct,
        farmerPhone: user.phone,
        farmerName: user.name,
        status: 'Available'
      }
      
      console.log('📦 Product data to save:', productData)

      const result = await productService.addProduct(productData)
      console.log('✅ Product added successfully:', result)
      
      setNewProduct({ 
        name: '', 
        quantity: '', 
        price: '', 
        category: '',
        description: '',
        location: ''
      })
      setShowAddProduct(false)
      
      console.log('🔄 Reloading products...')
      await loadProducts() // Reload products
      alert('Product added successfully!')
    } catch (error) {
      console.error('❌ Error adding product:', error)
      alert('Failed to add product. Please try again.')
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      await productService.updateProduct(editingProduct.id, newProduct)
      setEditingProduct(null)
      setNewProduct({ 
        name: '', 
        quantity: '', 
        price: '', 
        category: '',
        description: '',
        location: ''
      })
      await loadProducts() // Reload products
      alert('Product updated successfully!')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id)
        await loadProducts() // Reload products
        alert('Product deleted successfully!')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product. Please try again.')
      }
    }
  }

  const startEdit = (product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      quantity: product.quantity,
      price: product.price,
      category: product.category || '',
      description: product.description || '',
      location: product.location || ''
    })
    setShowAddProduct(true)
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setNewProduct({ 
      name: '', 
      quantity: '', 
      price: '', 
      category: '',
      description: '',
      location: ''
    })
    setShowAddProduct(false)
  }

  // Show OTP management page if requested
  if (showOTPPage) {
    return <FarmerOTPPage user={user} onBack={() => setShowOTPPage(false)} />
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Farmer Dashboard</h1>
          <p className="card-subtitle">
            Welcome back, {user.name}! Manage your crops and connect with buyers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid mb-4">
          <div className="dashboard-card">
            <Package className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.totalListings}</h3>
            <p className="dashboard-card-desc">Total Listings</p>
          </div>
          <div className="dashboard-card">
            <Sprout className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.activeListing}</h3>
            <p className="dashboard-card-desc">Active Listings</p>
          </div>
          <div className="dashboard-card">
            <TrendingUp className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.totalSold}</h3>
            <p className="dashboard-card-desc">Orders Completed</p>
          </div>
          <div className="dashboard-card">
            <Clock className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.pendingOrders}</h3>
            <p className="dashboard-card-desc">Pending Orders</p>
          </div>
          <div className="dashboard-card">
            <Users className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">₹{stats.walletBalance.toLocaleString()}</h3>
            <p className="dashboard-card-desc">Wallet Balance</p>
          </div>
          <div className="dashboard-card">
            <CheckCircle className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">{stats.totalRevenue}</h3>
            <p className="dashboard-card-desc">Total Revenue</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add New Product
          </button>
          <button
            onClick={() => setShowOTPPage(true)}
            className="btn btn-secondary"
          >
            <Shield size={16} />
            Manage OTPs & Escrow
          </button>
        </div>

        {/* Add/Edit Product Form */}
        {showAddProduct && (
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title" style={{ fontSize: '1.5rem' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={cancelEdit}
                className="btn btn-secondary"
                style={{ padding: '0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Tomatoes, Rice, Wheat"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="grains">Grains</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="pulses">Pulses</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="text"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    className="form-input"
                    placeholder="e.g., 500 kg"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input
                    type="text"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="form-input"
                    placeholder="e.g., ₹40/kg"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Punjab, India"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="form-input"
                    placeholder="Quality, harvest date, etc."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Market Intelligence */}
        <AISuggestions products={products} user={user} />

        {/* Pending Orders Section */}
        {orders.filter(order => order.status === 'pending_farmer_confirmation').length > 0 && (
          <div className="card mb-4">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              🔔 Pending Orders - Waiting for Confirmation
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders
                .filter(order => order.status === 'pending_farmer_confirmation')
                .map((order) => (
                  <div key={order.id} style={{
                    border: '1px solid #e67e22',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#fff3cd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ color: '#e67e22', margin: '0 0 0.5rem 0' }}>Order #{order.id}</h4>
                        <p style={{ margin: '0 0 0.5rem 0' }}>Consumer: {order.consumerPhone}</p>
                        <p style={{ margin: '0 0 0.5rem 0' }}>Amount: ₹{order.totalAmount?.toLocaleString()}</p>
                        <p style={{ margin: '0' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ 
                        backgroundColor: '#e67e22', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        OTP: {order.otp}
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0' }}>Items:</h5>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ 
                          backgroundColor: 'white', 
                          padding: '0.5rem', 
                          marginBottom: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}>
                          <strong>{item.name}</strong> - {item.quantity} {item.unit} @ ₹{item.price}
                        </div>
                      ))}
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#d4edda', 
                      borderRadius: '4px',
                      border: '1px solid #c3e6cb'
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#155724' }}>
                        📱 Share this OTP with consumer for delivery confirmation
                      </p>
                      <p style={{ margin: '0', fontSize: '0.9rem', color: '#155724' }}>
                        Consumer will enter this OTP to release payment after delivery
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Completed Orders Section */}
        {orders.filter(order => order.status === 'completed').length > 0 && (
          <div className="card mb-4">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              ✅ Completed Orders
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders
                .filter(order => order.status === 'completed')
                .slice(0, 5) // Show last 5 completed orders
                .map((order) => (
                  <div key={order.id} style={{
                    border: '1px solid #28a745',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#d4edda'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ color: '#28a745', margin: '0 0 0.5rem 0' }}>Order #{order.id}</h4>
                        <p style={{ margin: '0 0 0.5rem 0' }}>Consumer: {order.consumerPhone}</p>
                        <p style={{ margin: '0' }}>Completed: {new Date(order.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        ₹{order.totalAmount?.toLocaleString()} Credited
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Product Listings */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Your Products
          </h3>
          
          {loading ? (
            <p className="text-center" style={{ color: '#666', padding: '2rem' }}>
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="text-center" style={{ color: '#666', padding: '2rem' }}>
              No products listed yet. Add your first product to get started!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e5e9' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Quantity</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Price</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #e1e5e9' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{product.name}</td>
                      <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{product.category}</td>
                      <td style={{ padding: '1rem' }}>{product.quantity}</td>
                      <td style={{ padding: '1rem', color: '#2D5016', fontWeight: '600' }}>
                        {product.price}
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>{product.location || 'Not specified'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEdit(product)}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn"
                            style={{ 
                              padding: '0.5rem', 
                              fontSize: '0.875rem',
                              backgroundColor: '#dc3545',
                              color: 'white'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default FarmerDashboard
