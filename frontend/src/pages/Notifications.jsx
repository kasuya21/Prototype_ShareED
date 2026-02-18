import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/auth';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();
      await fetch('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.post_id) {
      return `/posts/${notification.post_id}`;
    }
    return '#';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return 'เมื่อสักครู่';
      if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
      return date.toLocaleDateString('th-TH');
    } catch (error) {
      return '';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">การแจ้งเตือน</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `มี ${unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน` : 'อ่านทั้งหมดแล้ว'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium ${
            filter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ทั้งหมด ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium ${
            filter === 'unread'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ยังไม่ได้อ่าน ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 font-medium ${
            filter === 'read'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          อ่านแล้ว ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-gray-500 text-lg">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                !notification.is_read ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="flex-1"
                >
                  <p className={`text-gray-800 ${!notification.is_read ? 'font-medium' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </Link>

                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="ml-4 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    ทำเครื่องหมายว่าอ่านแล้ว
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
