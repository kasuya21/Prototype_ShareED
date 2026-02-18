import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/auth';

function ModerationDashboard() {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  useEffect(() => {
    fetchReportedPosts();
  }, []);

  const fetchReportedPosts = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/moderation/reported-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportedPosts(data.posts);
      } else if (response.status === 403) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      }
    } catch (err) {
      console.error('Failed to fetch reported posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!confirm(`ต้องการลบโพสต์ "${postTitle}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/moderation/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('ลบโพสต์สำเร็จ');
        fetchReportedPosts();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถลบโพสต์ได้');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleRestorePost = async (postId, postTitle) => {
    if (!confirm(`ต้องการกู้คืนโพสต์ "${postTitle}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/moderation/posts/${postId}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('กู้คืนโพสต์สำเร็จ');
        fetchReportedPosts();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถกู้คืนโพสต์ได้');
      }
    } catch (err) {
      console.error('Failed to restore post:', err);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แดชบอร์ดผู้ดูแล</h1>
        <p className="text-gray-600">
          โพสต์ที่ถูกรายงาน {reportedPosts.length} รายการ
        </p>
      </div>

      {reportedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-500 text-lg">ไม่มีโพสต์ที่ถูกรายงาน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportedPosts.map((item) => {
            const post = item.post;
            const reportCount = item.reportCount;
            const reports = item.reports || [];
            
            return (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-6">
                  {/* Post Cover Image */}
                  {post.coverImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(post.coverImage || post.cover_image)}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                    </div>
                  )}

                  {/* Post Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          to={`/posts/${post.id}`}
                          className="text-xl font-semibold text-gray-800 hover:text-primary-600"
                        >
                          {post.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          โดย {post.authorName}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          post.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {post.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.description}
                    </p>

                    {/* Report Info */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>ถูกรายงาน {reportCount} ครั้ง</span>
                      </div>
                      {reports.length > 0 && (
                        <div className="text-sm text-red-600">
                          <span className="font-medium">เหตุผล: </span>
                          {reports.map(r => r.reason).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        to={`/posts/${post.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        ดูโพสต์
                      </Link>

                      {post.status === 'active' ? (
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          ลบโพสต์
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestorePost(post.id, post.title)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          กู้คืนโพสต์
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModerationDashboard;
