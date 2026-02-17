# Google OAuth 2.0 Authentication Implementation

## Overview

This document describes the Google OAuth 2.0 authentication implementation for the Knowledge Sharing Platform.

## Implementation Details

### Components Created

1. **Authentication Service** (`src/services/authService.js`)
   - `exchangeAuthCode(code)` - Exchange authorization code for access token
   - `getUserProfile(accessToken)` - Retrieve user profile from Google
   - `createSession(userId)` - Generate session token
   - `validateSession(token)` - Validate session and return user
   - `logout(token)` - Invalidate session token

2. **User Service** (`src/services/userService.js`)
   - `createOrUpdateUser(profile)` - Create or update user from Google profile
   - `getUser(userId)` - Retrieve user by ID
   - `updateProfile(userId, updates)` - Update user profile
   - `isNicknameAvailable(nickname, excludeUserId)` - Check nickname availability
   - `changeRole(adminId, targetUserId, newRole)` - Change user role (Admin only)
   - `getFollowers(userId)` - Get user's followers
   - `getFollowing(userId)` - Get users being followed

3. **Authentication Middleware** (`src/middleware/auth.js`)
   - `authenticate` - Require valid authentication
   - `optionalAuth` - Optional authentication
   - `authorize(...roles)` - Require specific roles
   - `requireOwnership(getResourceOwnerId)` - Require resource ownership

4. **Authentication Routes** (`src/routes/authRoutes.js`)
   - `GET /api/auth/login` - Get OAuth redirect URL
   - `GET /api/auth/callback` - Handle OAuth callback
   - `POST /api/auth/logout` - Logout and invalidate session
   - `GET /api/auth/me` - Get current user
   - `POST /api/auth/verify` - Verify session token

## OAuth Flow

```
1. User clicks login → Frontend redirects to GET /api/auth/login
2. Backend returns Google OAuth URL
3. User redirects to Google OAuth page
4. User approves → Google redirects to /api/auth/callback with code
5. Backend exchanges code for access token
6. Backend fetches user profile from Google
7. Backend creates/updates user in database
8. Backend creates session token
9. Backend redirects to frontend with token
10. Frontend stores token and uses it for authenticated requests
```

## Session Management

- Sessions are stored in-memory (Map)
- Session tokens are UUIDs
- Sessions expire after 24 hours
- Tokens can be sent via:
  - Authorization header: `Bearer <token>`
  - Session cookie (automatically set)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
5. Copy Client ID and Client Secret

### 3. Environment Variables

Create `.env` file in backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/database.sqlite

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Session
SESSION_SECRET=your_random_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Run Database Migration

```bash
npm run migrate
```

### 5. Start Server

```bash
npm run dev
```

## Testing

Run unit tests:

```bash
npm test
```

Run specific test file:

```bash
npm test -- auth.test.js
```

## API Usage Examples

### Login Flow

```javascript
// 1. Get OAuth URL
const response = await fetch('http://localhost:3000/api/auth/login');
const { authUrl } = await response.json();

// 2. Redirect user to authUrl
window.location.href = authUrl;

// 3. After OAuth callback, frontend receives token
// Store token in localStorage or state management
localStorage.setItem('token', token);
```

### Authenticated Requests

```javascript
// Include token in Authorization header
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { user } = await response.json();
```

### Logout

```javascript
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

localStorage.removeItem('token');
```

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production
2. **Session Secret**: Use a strong, random session secret
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
4. **CORS**: Configure CORS properly for your frontend domain
5. **Rate Limiting**: Implement rate limiting on auth endpoints
6. **Token Expiry**: Sessions expire after 24 hours

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.1**: ✅ OAuth redirect to Google authentication
- **Requirement 1.2**: ✅ Receive and exchange access token
- **Requirement 1.3**: ✅ Retrieve user profile from Google
- **Requirement 1.4**: ✅ Create/update user in database
- **Requirement 1.5**: ✅ Error handling for failed authentication
- **Requirement 1.6**: ✅ Logout and session invalidation

## Next Steps

1. Install dependencies: `npm install`
2. Configure Google OAuth credentials
3. Create `.env` file with proper values
4. Run tests to verify implementation
5. Test OAuth flow manually with frontend
6. Implement property-based tests (Task 2.2, 2.3)

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` to install dependencies

### OAuth callback fails
- Verify Google OAuth credentials are correct
- Check callback URL matches Google Console configuration
- Ensure frontend URL is correct in .env

### Session not persisting
- Check session secret is set
- Verify cookies are enabled
- Check CORS configuration allows credentials

### Database errors
- Run `npm run migrate` to create tables
- Check database path is writable
- Verify SQLite is installed
