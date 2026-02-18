import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';
import PostCard from '../components/PostCard';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const token = getToken();
      
      // Get current user
      const userResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserId(userData.user.id);

        // Fetch bookmarks
        const bookmarksResponse = await fetch(
          `http://localhost:3000/api/users/${userData.user.id}/bookmarks`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          setBookmarks(bookmarksData.bookmarks);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    if (!confirm('ต้องการลบบุ๊กมาร์กนี้?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/api/posts/${postId}/bookmark`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        // Remove from local state
        setBookmarks(prev => prev.filter(b => b.id !== postId));
      } else {
        alert('ไม่สามารถลบบุ๊กมาร์กได้');
      }
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">บุ๊กมาร์ก</h1>
        <p className="text-gray-600">
          โพสต์ที่บันทึกไว้ {bookmarks.length} รายการ
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔖</div>
          <p className="text-gray-500 text-lg">ยังไม่มีบุ๊กมาร์ก</p>
          <p className="text-gray-400 text-sm mt-2">
            บันทึกโพสต์ที่คุณสนใจเพื่ออ่านภายหลัง
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((post) => (
            <div key={post.id} className="relative">
              <PostCard post={post} />
              
              {/* Remove Bookmark Button */}
              <button
                onClick={() => handleRemoveBookmark(post.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                title="ลบบุ๊กมาร์ก"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
