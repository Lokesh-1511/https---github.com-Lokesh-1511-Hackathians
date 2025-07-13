# AgriChain - Complete Project Setup

## 🌟 Project Overview

AgriChain is a complete blockchain-based agricultural platform that connects farmers, buyers, and agents through a modern web interface. The platform features role-based authentication with OTP verification and tailored dashboards for each user type.

## 🏗️ Architecture

```
AgriChain/
├── backend/                    # Node.js + Express API Server
│   ├── server.js              # Main server file with OTP & auth
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment configuration
│   └── README.md              # Backend documentation
│
├── frontend/                   # React + Vite Web Application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── dashboards/    # Role-specific dashboards
│   │   │   ├── Header.jsx     # Navigation component
│   │   │   ├── Footer.jsx     # Footer component
│   │   │   ├── LandingPage.jsx # Welcome page
│   │   │   ├── RegistrationForm.jsx # User registration
│   │   │   └── OTPVerification.jsx  # OTP verification
│   │   ├── services/
│   │   │   └── api.js         # API integration layer
│   │   ├── App.jsx            # Main application
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   └── README.md              # Frontend documentation
│
├── contracts/                  # Smart Contracts (Existing)
├── shared/                     # Shared utilities and ABIs
└── feature-phone-interface/    # IVR System (Existing)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your settings:
PORT=5001
JWT_SECRET=your_secure_jwt_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development

# Start the backend server
npm start
```

**Backend runs on**: `http://localhost:5001`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npx vite --port 3000
```

**Frontend runs on**: `http://localhost:3000`

## 🔑 Key Features

### Authentication System
- **Role Selection**: Farmer, Buyer, Agent dropdown
- **Multi-field Registration**: Name, phone, location, email (optional)
- **OTP Verification**: 6-digit code sent via email
- **JWT Authentication**: Secure token-based sessions
- **Role-based Redirects**: Automatic navigation to appropriate dashboard

### User Roles & Dashboards

#### 🌾 Farmer Dashboard
- **Crop Management**: Add, edit, delete crop listings
- **Inventory Tracking**: Quantity and pricing management
- **Sales Analytics**: Revenue and transaction overview
- **Status Management**: Track listing status (Available/Sold)

#### 🛒 Buyer Dashboard
- **Product Discovery**: Browse all available produce
- **Advanced Search**: Filter by crop type, farmer, location
- **Shopping Cart**: Multi-farmer purchase capability
- **Farmer Profiles**: View ratings and contact information

#### 🤝 Agent Dashboard
- **Deal Facilitation**: Manage farmer-buyer transactions
- **User Management**: Farmer and buyer registration
- **Commission Tracking**: Monitor earnings and performance
- **Communication Hub**: Direct contact with all parties

## 📱 User Registration Flow

1. **Landing Page**: User sees role overview and benefits
2. **Registration Form**: 
   - Name (required)
   - Phone number (required)
   - Email (optional, for OTP)
   - Location (required)
   - Role selection dropdown (required)
3. **OTP Generation**: Backend generates 6-digit OTP
4. **Email Delivery**: OTP sent to user's email (if provided)
5. **OTP Verification**: 6-digit input with auto-submit
6. **Account Creation**: User account created with JWT token
7. **Dashboard Redirect**: Automatic navigation based on role

## 🔧 Technical Details

### Backend API Endpoints

```bash
# Health Check
GET /api/health

# Generate OTP
POST /api/generate-otp
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com"
}

# Verify OTP & Register
POST /api/verify-otp
{
  "phone": "+1234567890",
  "otp": "123456",
  "role": "farmer",
  "name": "John Doe",
  "location": "California, USA"
}

# Get User Profile
GET /api/profile
Authorization: Bearer <jwt_token>

# Get All Users
GET /api/users
```

### Frontend Components

```javascript
// Main Application with routing
App.jsx

// Authentication Components
RegistrationForm.jsx      // Multi-step registration
OTPVerification.jsx       // 6-digit OTP input

// Dashboard Components
FarmerDashboard.jsx       // Crop management interface
BuyerDashboard.jsx        // Product discovery interface
AgentDashboard.jsx        // Deal facilitation interface

// Layout Components
Header.jsx                // Navigation with user info
Footer.jsx                // Simple footer
LandingPage.jsx           // Welcome page
```

### Security Features

- **JWT Tokens**: Secure authentication with expiration
- **OTP Expiration**: 5-minute timeout for security
- **Input Validation**: Phone and email format validation
- **Protected Routes**: Role-based access control
- **CORS Protection**: Configured for specific origins

## 🎨 Design System

### Color Palette
- **Primary**: `#2D5016` (AgriChain green)
- **Secondary**: `#4CAF50` (Success green)
- **Background**: Gradient from `#667eea` to `#764ba2`
- **Cards**: `rgba(255, 255, 255, 0.95)` with glassmorphism

### Typography
- **Font**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Scale**: 2.5rem (titles) to 0.875rem (small text)

### Components
- **Buttons**: Rounded corners with hover effects
- **Forms**: Clean inputs with focus states
- **Cards**: Glassmorphism with subtle shadows
- **Tables**: Responsive with status indicators

## 📱 Responsive Design

- **Desktop**: Full dashboard layouts
- **Tablet**: Optimized grid layouts
- **Mobile**: Touch-friendly interface with collapsible navigation

## 🔮 Integration Points

### Blockchain Integration
The frontend is designed to integrate with your existing smart contracts:

```javascript
// contracts/ directory contains:
- FarmerRegistry.sol
- ProduceMarket.sol
- AgentAccess.sol
- Escrow.sol
- FarmerMarket.sol

// shared/ directory contains:
- Contract ABIs
- Deployment information
- Crop codes mapping
```

### Feature Phone Integration
Connects with your existing IVR system:

```javascript
// feature-phone-interface/ directory
- Voice-based crop listing
- Phone number to address mapping
- SMS/Call integration capabilities
```

## 🧪 Testing the Application

### Test User Registration

1. **Visit Frontend**: http://localhost:3000
2. **Click "Get Started"**: Navigate to registration
3. **Fill Registration Form**:
   - Name: Test Farmer
   - Phone: +1234567890
   - Email: test@example.com
   - Location: Test Location
   - Role: Farmer
4. **Submit Form**: OTP will be generated
5. **Check Console**: In development, OTP is logged to backend console
6. **Enter OTP**: Use the 6-digit code from console
7. **Access Dashboard**: Automatically redirected to farmer dashboard

### Test Different Roles

Repeat the process with different roles to see different dashboards:
- **Farmer**: Crop management interface
- **Buyer**: Product browsing interface  
- **Agent**: Deal facilitation interface

## 🔄 Development Workflow

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npx vite --port 3000 # Start with hot reload
```

### Making Changes
1. **Backend**: Edit `server.js` - auto-reloads with nodemon
2. **Frontend**: Edit React components - hot reload automatically
3. **Styles**: Edit `index.css` - changes apply instantly

## 🚀 Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use process manager (PM2)
3. Configure reverse proxy (Nginx)
4. Setup SSL certificates

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with web server
3. Configure API endpoint for production backend

## 📈 Future Enhancements

### Planned Features
- **Real-time Chat**: WebSocket-based messaging
- **Push Notifications**: Deal updates and alerts
- **Payment Integration**: Integrated payment processing
- **Mobile App**: React Native version
- **Advanced Analytics**: Data visualization dashboards

### Technical Improvements
- **Database Integration**: Replace in-memory storage
- **TypeScript**: Add type safety
- **Testing**: Unit and integration tests
- **PWA**: Progressive Web App features
- **Caching**: Redis for session management

## 🆘 Troubleshooting

### Common Issues

**Backend won't start**
- Check if port 5001 is available
- Verify .env configuration
- Check Node.js version (v16+)

**Frontend won't start**
- Run `npx vite --port 3000` directly
- Check if port 3000 is available
- Verify React dependencies installed

**OTP not received**
- Check backend console for generated OTP
- Verify email configuration in .env
- Check spam folder for emails

**API connection errors**
- Ensure backend is running on port 5001
- Check CORS configuration
- Verify API URLs in frontend

## 📞 Support

For issues and questions:
- Check console logs for errors
- Verify all environment variables
- Ensure both servers are running
- Test API endpoints directly

---

**🌾 Built for the future of agriculture with modern web technologies**
