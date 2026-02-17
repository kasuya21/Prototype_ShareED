import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              Knowledge Share
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              หน้าแรก
            </Link>
            <Link
              to="/popular"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              ยอดนิยม
            </Link>
            <Link
              to="/search"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              ค้นหา
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="hidden md:block text-gray-700 font-medium">
                      {user.nickname || user.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to={`/profile/${user.id}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        โปรไฟล์
                      </Link>
                      <Link
                        to="/quests"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ภารกิจ
                      </Link>
                      <Link
                        to="/achievements"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ความสำเร็จ
                      </Link>
                      <Link
                        to="/shop"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ร้านค้า
                      </Link>
                      <Link
                        to="/bookmarks"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        บุ๊กมาร์ก
                      </Link>
                      <div className="border-t my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setShowMobileMenu(false)}
            >
              หน้าแรก
            </Link>
            <Link
              to="/popular"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setShowMobileMenu(false)}
            >
              ยอดนิยม
            </Link>
            <Link
              to="/search"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setShowMobileMenu(false)}
            >
              ค้นหา
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
