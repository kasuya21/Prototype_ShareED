# Knowledge Sharing Platform

แพลตฟอร์มแชร์ความรู้ที่ออกแบบมาเพื่อให้ผู้ใช้งานสามารถแบ่งปันความรู้ผ่านการสร้างและเผยแพร่โพสต์

## Tech Stack

- **Backend**: Express.js with JavaScript (ES Modules)
- **Frontend**: React with Vite and Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **Testing**: Jest (backend) and Vitest (frontend) with fast-check for property-based testing
- **Authentication**: Google OAuth 2.0

## Project Structure

```
knowledge-sharing-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── database/        # Database schema and migrations
│   │   ├── __tests__/       # Test files
│   │   └── server.js        # Main server file
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── test/            # Test setup
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.js
└── package.json             # Root package.json for workspaces
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Update the `.env` file with your Google OAuth credentials
4. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

### Running the Application

#### Development Mode

Run backend and frontend separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:5173`.

### Database Setup

The database will be automatically created and migrated when you first run the backend server. To manually run migrations:

```bash
cd backend
npm run migrate
```

### Testing

Run tests for both backend and frontend:

```bash
# All tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_PATH`: SQLite database file path
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: OAuth callback URL
- `SESSION_SECRET`: Session secret key
- `UPLOAD_DIR`: File upload directory
- `MAX_FILE_SIZE`: Maximum file upload size in bytes
- `FRONTEND_URL`: Frontend URL for CORS

## Features

- Google OAuth 2.0 authentication
- User role management (Member, Moderator, Admin)
- Post creation and management with rate limiting
- Like, comment, and bookmark functionality
- Follow system
- Report and moderation system
- Notification system
- Quest and achievement system
- Shop and inventory system
- Search and filtering
- Responsive design

## Testing Strategy

This project uses a dual testing approach:

- **Unit Tests**: Test specific examples and edge cases
- **Property-Based Tests**: Test universal properties across all inputs using fast-check

All property tests reference the design document properties with comment tags.

## License

MIT
