# AgriChain Backend API

A Node.js backend service for the AgriChain platform, providing authentication, OTP generation, and user management.

## Features

- 🔐 OTP-based authentication
- 📧 Email OTP delivery via Nodemailer
- 👥 Multi-role user management (Farmer, Buyer, Agent)
- 🛡️ JWT token-based sessions
- 📱 Phone number validation
- 🔄 OTP resend functionality
- ⚡ Fast in-memory storage (easily replaceable with database)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer (Gmail)
- **Validation**: Custom phone/email validators
- **Environment**: dotenv for configuration

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account for email service (or any SMTP service)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   NODE_ENV=development
   ```

   **Setting up Gmail App Password:**
   1. Enable 2-Factor Authentication on your Gmail account
   2. Go to Google Account settings > Security > App passwords
   3. Generate an app password for "Mail"
   4. Use this app password in `EMAIL_PASS`

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Generate OTP
```http
POST /api/generate-otp
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "otp": "123456"  // Only in development mode
}
```

#### Verify OTP & Register
```http
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456",
  "role": "farmer",
  "name": "John Doe",
  "location": "California, USA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt_token_here",
  "user": {
    "phone": "+1234567890",
    "name": "John Doe",
    "location": "California, USA",
    "role": "farmer",
    "registeredAt": 1641234567890,
    "verified": true
  },
  "redirectUrl": "/farmer-dashboard"
}
```

### User Management

#### Get User Profile
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

#### Get All Users (Admin)
```http
GET /api/users
```

### Utility

#### Health Check
```http
GET /api/health
```

## Project Structure

```
backend/
├── server.js              # Main application file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md             # This file
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **OTP Expiration**: OTPs expire after 5 minutes
- **Input Validation**: Phone number and email validation
- **CORS Protection**: Configured for frontend origins
- **Rate Limiting**: Can be easily added for production

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `EMAIL_USER` | Gmail address for sending OTPs | Yes | - |
| `EMAIL_PASS` | Gmail app password | Yes | - |
| `NODE_ENV` | Environment mode | No | development |

## Development Features

- **Hot Reload**: Using nodemon for development
- **Debug Mode**: OTP shown in response during development
- **CORS**: Configured for React dev servers (3000, 5173)
- **Error Handling**: Comprehensive error responses

## Production Considerations

1. **Database Integration**: Replace in-memory storage with MongoDB/PostgreSQL
2. **Rate Limiting**: Add rate limiting for OTP generation
3. **SMS Service**: Integrate Twilio for SMS OTPs
4. **Logging**: Add structured logging with Winston
5. **Security Headers**: Add helmet.js for security headers
6. **Input Sanitization**: Add express-validator for robust validation
7. **Redis**: Use Redis for OTP storage and session management

## API Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "message": "string",
  "data": {} // optional
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (expired token)
- `404`: Not Found
- `500`: Internal Server Error

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Update documentation for new endpoints
4. Test all changes thoroughly

## License

MIT License - see LICENSE file for details.
