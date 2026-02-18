import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { setupAxiosInterceptors } from './utils/auth';

// Layout (not lazy loaded as it's always needed)
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Critical pages (not lazy loaded for better initial load)
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/Home';

// Lazy loaded pages for better code splitting (Task 32.2)
const PostList = lazy(() => import('./pages/PostList'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Search = lazy(() => import('./pages/Search'));
const PopularPosts = lazy(() => import('./pages/PopularPosts'));
const Quests = lazy(() => import('./pages/Quests'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Shop = lazy(() => import('./pages/Shop'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ModerationDashboard = lazy(() => import('./pages/ModerationDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes with Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="posts" element={<PostList />} />
            <Route path="posts/:id" element={<PostDetail />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="search" element={<Search />} />
            <Route path="popular" element={<PopularPosts />} />
            <Route path="quests" element={<Quests />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="shop" element={<Shop />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="moderation" element={<ModerationDashboard />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
