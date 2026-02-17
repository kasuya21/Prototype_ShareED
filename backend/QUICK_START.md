# Quick Start Guide - Authentication Setup

## Prerequisites

- Node.js installed
- Google Cloud Console account

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Select "Web application" as application type
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
8. Copy the Client ID and Client Secret

### 3. Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Google OAuth credentials:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/database.sqlite

# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Generate a random secret (you can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your_random_secret_here

FRONTEND_URL=http://localhost:5173
```

### 4. Initialize Database

```bash
npm run migrate
```

### 5. Run Tests (Optional)

```bash
npm test
```

### 6. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## Testing the Authentication

### Test OAuth Login Flow

1. Open your browser and navigate to:
   ```
   http://localhost:3000/api/auth/login
   ```

2. You'll receive a JSON response with an `authUrl`. Copy this URL.

3. Open the `authUrl` in your browser to test the Google OAuth flow.

4. After successful authentication, you'll be redirected back with a token.

### Test API Endpoints

You can use curl or Postman to test:

```bash
# Get OAuth URL
curl http://localhost:3000/api/auth/login

# Get current user (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/auth/me

# Verify token
curl -X POST -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/auth/verify

# Logout
curl -X POST -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/auth/logout
```

## What Was Implemented

✅ **OAuth Flow**
- Redirect to Google OAuth
- Handle callback with authorization code
- Exchange code for access token
- Fetch user profile from Google

✅ **Session Management**
- Generate session tokens (UUID)
- Validate session tokens
- 24-hour token expiration
- Logout and token invalidation

✅ **User Management**
- Create user from Google profile
- Update existing user on login
- Store user data in SQLite database
- Default role assignment (member)

✅ **Authentication Middleware**
- `authenticate` - Require valid token
- `optionalAuth` - Optional authentication
- `authorize(...roles)` - Role-based access control
- `requireOwnership` - Resource ownership validation

✅ **API Endpoints**
- `GET /api/auth/login` - Get OAuth URL
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify` - Verify token

✅ **Tests**
- Unit tests for auth service
- Unit tests for user service
- Integration tests for API endpoints

## Next Steps

1. **Install dependencies** and configure Google OAuth
2. **Run tests** to verify everything works
3. **Test OAuth flow** manually with a browser
4. **Integrate with frontend** (Task 21.1)
5. **Implement property-based tests** (Tasks 2.2, 2.3)

## Troubleshooting

**Problem**: npm commands don't work
- **Solution**: Make sure Node.js is installed and npm is in your PATH

**Problem**: OAuth callback fails
- **Solution**: Verify the callback URL in Google Console matches exactly: `http://localhost:3000/api/auth/callback`

**Problem**: Database errors
- **Solution**: Run `npm run migrate` to create the database tables

**Problem**: "Module not found" errors
- **Solution**: Run `npm install` to install all dependencies

## Files Created

```
backend/
├── src/
│   ├── services/
│   │   ├── authService.js          # OAuth and session management
│   │   └── userService.js          # User CRUD operations
│   ├── middleware/
│   │   └── auth.js                 # Authentication middleware
│   ├── routes/
│   │   └── authRoutes.js           # Auth API endpoints
│   └── __tests__/
│       ├── auth.test.js            # Unit tests
│       └── auth.integration.test.js # Integration tests
├── AUTH_IMPLEMENTATION.md          # Detailed documentation
└── QUICK_START.md                  # This file
```

## Support

For detailed implementation information, see `AUTH_IMPLEMENTATION.md`.
