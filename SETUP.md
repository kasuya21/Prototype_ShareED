# Setup Guide - Knowledge Sharing Platform

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
```

### 3. Setup Database

The database will be automatically created and migrated when you start the backend server. To manually run migrations and seed data:

```bash
cd backend
npm run migrate
npm run seed
```

### 4. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Google OAuth Setup

To enable Google authentication, you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (development)
6. Copy the Client ID and Client Secret to your `.env` file

## Testing

### Run All Tests

```bash
# From root directory
npm test
```

### Run Backend Tests Only

```bash
cd backend
npm test

# Watch mode
npm run test:watch
```

### Run Frontend Tests Only

```bash
cd frontend
npm test

# Watch mode
npm run test:watch
```

## Project Structure

```
knowledge-sharing-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   └── config.js    # Environment configuration
│   │   ├── database/        # Database related files
│   │   │   ├── schema.sql   # Database schema
│   │   │   ├── db.js        # Database connection
│   │   │   ├── migrate.js   # Migration script
│   │   │   └── seed.js      # Seed data script
│   │   ├── utils/           # Utility functions
│   │   │   ├── errors.js    # Custom error classes
│   │   │   └── validators.js # Validation functions
│   │   ├── __tests__/       # Test files
│   │   │   └── setup.test.js
│   │   └── server.js        # Main server file
│   ├── data/                # SQLite database (auto-created)
│   ├── uploads/             # Uploaded files (auto-created)
│   ├── package.json
│   ├── jest.config.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── test/            # Test setup
│   │   │   └── setup.js
│   │   ├── App.jsx          # Main app component
│   │   ├── App.test.jsx     # App tests
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles with Tailwind
│   ├── public/              # Static assets
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json             # Root package.json (workspaces)
├── README.md
├── SETUP.md
└── .gitignore
```

## Database Schema

The database includes the following tables:

- **users**: User accounts and profiles
- **posts**: User-created posts
- **comments**: Comments on posts
- **reports**: Post reports
- **likes**: Post likes
- **bookmarks**: Saved posts
- **follows**: User follow relationships
- **notifications**: User notifications
- **quests**: Daily quests
- **achievements**: Available achievements
- **user_achievements**: User achievement progress
- **shop_items**: Items available for purchase
- **inventory_items**: User-owned items

## Available Scripts

### Root Level

- `npm test` - Run all tests (backend + frontend)
- `npm run test:backend` - Run backend tests only
- `npm run test:frontend` - Run frontend tests only

### Backend

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Troubleshooting

### Port Already in Use

If you get an error that port 3000 or 5173 is already in use:

```bash
# Find and kill the process using the port
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Issues

If you encounter database issues, you can reset it:

```bash
cd backend
rm -rf data/
npm run migrate
npm run seed
```

### Module Not Found Errors

Make sure all dependencies are installed:

```bash
# Reinstall all dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Next Steps

After completing the setup:

1. Configure Google OAuth credentials
2. Start both backend and frontend servers
3. Navigate to http://localhost:5173
4. Begin implementing features according to the task list

For detailed implementation tasks, refer to `.kiro/specs/knowledge-sharing-platform/tasks.md`
