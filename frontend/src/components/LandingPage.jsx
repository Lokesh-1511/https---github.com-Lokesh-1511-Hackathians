import React from 'react'
import { Link } from 'react-router-dom'
import { Sprout, ShoppingCart, Users, ArrowRight } from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="text-center">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Welcome to AgriChain</h1>
          <p className="card-subtitle">
            Revolutionizing agriculture through blockchain technology
          </p>
        </div>

        <div className="dashboard-grid mb-4">
          <div className="dashboard-card">
            <Sprout className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">For Farmers</h3>
            <p className="dashboard-card-desc">
              List your produce, connect directly with buyers, and get fair prices for your crops.
            </p>
          </div>

          <div className="dashboard-card">
            <ShoppingCart className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">For Buyers</h3>
            <p className="dashboard-card-desc">
              Access fresh produce directly from farmers, ensuring quality and supporting local agriculture.
            </p>
          </div>

          <div className="dashboard-card">
            <Users className="dashboard-card-icon" />
            <h3 className="dashboard-card-title">For Agents</h3>
            <p className="dashboard-card-desc">
              Facilitate transactions, provide support services, and help build the agricultural ecosystem.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/register" className="btn btn-primary">
            Get Started <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
          </Link>
        </div>

        <div className="mt-4 text-center">
          <h3 style={{ color: '#2D5016', marginBottom: '1rem' }}>Why Choose AgriChain?</h3>
          <div className="text-left" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>✅ Direct farmer-to-buyer connections</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Transparent pricing and transactions</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Secure blockchain-based verification</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Real-time market information</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Support for multiple stakeholders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
