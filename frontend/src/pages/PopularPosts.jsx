import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';

function PopularPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularPosts();
  }, []);

  const fetchPopularPosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/posts/popular?limit=20');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch popular posts:', err);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">โพสต์ยอดนิยม</h1>
        <p className="text-gray-600">โพสต์ที่ได้รับความนิยมสูงสุด</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ยังไม่มีโพสต์ยอดนิยม
        </div>
      )}
    </div>
  );
}

export default PopularPosts;
