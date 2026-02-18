import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToken } from '../utils/auth';
import PostCard from '../components/PostCard';

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  // Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-avatar.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
    fetchAchievements();
    fetchFollowers();
    fetchFollowing();
    checkFollowStatus();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/posts/user/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const fetchAchievements = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${id}/achievements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements.filter(a => a.isUnlocked));
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${id}/followers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers);
      }
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${id}/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
      }
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${id}/follow/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
      }
    } catch (err) {
      console.error('Failed to check follow status:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const token = getToken();
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:3000/api/users/${id}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        fetchFollowers();
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12">ไม่พบผู้ใช้งาน</div>;
  }

  const educationLevelMap = {
    junior_high: 'มัธยมศึกษาตอนต้น',
    senior_high: 'มัธยมศึกษาตอนปลาย',
    university: 'มหาวิทยาลัย'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <img
            src={getImageUrl(user.profilePicture || user.profile_picture)}
            alt={user.name}
            className="w-32 h-32 rounded-full"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{user.nickname || user.name}</h1>
              <div className="flex gap-2">
                <Link
                  to={`/profile/${id}/edit`}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  แก้ไขโปรไฟล์
                </Link>
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">{user.email}</p>
            {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}
            
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded">
                {educationLevelMap[user.educationLevel]}
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded">
                🪙 {user.coins} เหรียญ
              </span>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold">{followers.length}</span> ผู้ติดตาม
              </div>
              <div>
                <span className="font-bold">{following.length}</span> กำลังติดตาม
              </div>
              <div>
                <span className="font-bold">{posts.length}</span> โพสต์
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'posts'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            โพสต์
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'achievements'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ความสำเร็จ
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {posts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  ยังไม่มีโพสต์
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.achievementId} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="font-medium text-sm">{achievement.title}</h3>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              ))}
              {achievements.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  ยังไม่มีความสำเร็จที่ปลดล็อก
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
