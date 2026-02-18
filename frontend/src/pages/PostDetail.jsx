import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  };

  // Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
    checkLikeStatus();
    checkBookmarkStatus();
  }, [id]);

  const fetchPost = async () => {
    try {
      // Check if ID exists
      if (!id) {
        setError('ไม่พบ ID ของโพสต์');
        setLoading(false);
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) {
        setError('ไม่พบโพสต์นี้ อาจถูกลบหรือไม่มีอยู่ในระบบ');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดโพสต์ได้');
      }
      
      const data = await response.json();
      setPost(data.post);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดโพสต์');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${id}/like/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
      }
    } catch (err) {
      console.error('Failed to check like status:', err);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${id}/bookmark/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error('Failed to check bookmark status:', err);
    }
  };

  const handleLike = async () => {
    try {
      const token = getToken();
      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:3000/api/posts/${id}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setLiked(!liked);
        fetchPost(); // Refresh to get updated like count
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async () => {
    try {
      const token = getToken();
      const method = bookmarked ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:3000/api/posts/${id}/bookmark`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
        fetchPost(); // Refresh to get updated comment count
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('กรุณาระบุเหตุผลในการรายงาน');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason })
      });

      if (response.ok) {
        alert('รายงานโพสต์สำเร็จ');
        setShowReportModal(false);
        setReportReason('');
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถรายงานโพสต์ได้');
      }
    } catch (err) {
      console.error('Failed to report post:', err);
      alert('เกิดข้อผิดพลาดในการรายงานโพสต์');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบโพสต์</p>
          <button onClick={() => navigate('/posts')} className="px-4 py-2 bg-primary-600 text-white rounded">
            กลับไปหน้าโพสต์
          </button>
        </div>
      </div>
    );
  }

  const educationLevelMap = {
    junior_high: 'ม.ต้น',
    senior_high: 'ม.ปลาย',
    university: 'มหาวิทยาลัย'
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cover Image */}
      <div className="mb-6 rounded-lg overflow-hidden">
        <img 
          src={getImageUrl(post.cover_image || post.coverImage)} 
          alt={post.title} 
          className="w-full h-96 object-cover"
          onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
        />
      </div>

      {/* Title and Meta */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded">
            {educationLevelMap[post.education_level || post.educationLevel]}
          </span>
          {(post.created_at || post.createdAt) && (
            <span>{formatDate(post.created_at || post.createdAt)}</span>
          )}
        </div>
        {(post.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-primary-100 text-primary-600 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            liked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.like_count}
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            bookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {bookmarked ? 'บันทึกแล้ว' : 'บันทึก'}
        </button>
        <span className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          {post.view_count}
        </span>
        <button
          onClick={() => setShowReportModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          รายงาน
        </button>
      </div>

      {/* Content */}
      <div className="prose max-w-none mb-8">
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">ความคิดเห็น ({comments.length})</h2>
        
        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="แสดงความคิดเห็น..."
            className="w-full p-3 border rounded-lg resize-none"
            rows="3"
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            ส่งความคิดเห็น
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={getImageUrl(comment.author?.profilePicture || comment.author?.profile_picture)}
                  alt={comment.author?.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div>
                  <p className="font-medium text-sm">{comment.author?.nickname || comment.author?.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(comment.createdAt || comment.created_at)}
                  </p>
                </div>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">รายงานโพสต์</h3>
            <p className="text-gray-600 mb-4">กรุณาระบุเหตุผลในการรายงานโพสต์นี้</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="เหตุผลในการรายงาน..."
              className="w-full p-3 border rounded-lg resize-none mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReport}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ส่งรายงาน
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetail;
