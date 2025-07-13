# Firebase Setup Instructions for AgriChain

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `agrichain` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** and enable it
3. Add your domain to authorized domains if needed

## 3. Get Firebase Configuration

### For Frontend:
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Add app** > **Web**
4. Register your app with nickname "AgriChain Frontend"
5. Copy the firebaseConfig object
6. Update `frontend/src/config/firebase.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
}
```

### For Backend:
1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Replace the content of `backend/firebase-service-account.json` with your downloaded file

## 4. Configure Domain for Testing

### For Development:
1. In Firebase Console, go to **Authentication** > **Settings**
2. Add `localhost` to authorized domains
3. For phone auth testing, you can add test phone numbers in the **Phone** section

## 5. Test Phone Numbers (Optional)

For testing without sending real SMS:
1. Go to **Authentication** > **Sign-in method** > **Phone**
2. Scroll down to "Phone numbers for testing"
3. Add test numbers like:
   - Phone: `+1 555-123-4567`
   - Code: `123456`

## 6. Update Environment Variables

Update your `.env` files:

### Backend (.env):
```
PORT=5000
JWT_SECRET=your_strong_jwt_secret_here
NODE_ENV=development
FIREBASE_PROJECT_ID=your-actual-project-id
```

### Frontend:
Firebase config is in `src/config/firebase.js`

## 7. Security Rules (Optional)

For enhanced security, you can configure Firestore rules if you plan to use database features later.

## 8. Testing

1. Start backend: `npm start` (in backend directory)
2. Start frontend: `npm run dev` (in frontend directory)
3. Register with a real phone number or use test numbers
4. Verify OTP and complete registration

## Important Notes

- Keep your service account key file secure and never commit it to version control
- Use environment variables for sensitive configuration
- For production, ensure proper security rules and domain restrictions
- Consider implementing rate limiting for OTP requests
