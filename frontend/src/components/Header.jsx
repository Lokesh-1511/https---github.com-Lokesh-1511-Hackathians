import React from 'react'
import { Link } from 'react-router-dom'
import { User, LogOut, Menu } from 'lucide-react'

const Header = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          🌾 AgriChain
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links" style={{ display: isMobileMenuOpen ? 'flex' : 'flex' }}>
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <User size={20} />
                <span>Welcome, {user.name}</span>
                <span className="text-sm text-gray-500">({user.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register">Register</Link>
              <Link to="/">Home</Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ display: 'none' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="mobile-nav" style={{ display: 'none' }}>
          {user ? (
            <>
              <div className="text-center mb-2">
                <p>Welcome, {user.name}</p>
                <p className="text-sm text-gray-500">({user.role})</p>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-full"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </Link>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}

export default Header
