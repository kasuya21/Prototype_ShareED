import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    educationLevel: searchParams.get('educationLevel') || '',
    sortBy: searchParams.get('sortBy') || 'date'
  });

  useEffect(() => {
    if (filters.keyword) {
      handleSearch();
    }
  }, [filters]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.educationLevel) params.append('educationLevel', filters.educationLevel);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`http://localhost:3000/api/posts/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ค้นหาโพสต์</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำค้นหา
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="ค้นหาจากหัวข้อหรือแท็ก..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ระดับการศึกษา
            </label>
            <select
              value={filters.educationLevel}
              onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">ทั้งหมด</option>
              <option value="junior_high">มัธยมศึกษาตอนต้น</option>
              <option value="senior_high">มัธยมศึกษาตอนปลาย</option>
              <option value="university">มหาวิทยาลัย</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เรียงตาม
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="date">วันที่ล่าสุด</option>
              <option value="popularity">ความนิยม</option>
              <option value="views">จำนวนการดู</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">พบ {posts.length} โพสต์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {posts.length === 0 && filters.keyword && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบผลลัพธ์</h3>
              <p className="mt-1 text-sm text-gray-500">ลองค้นหาด้วยคำอื่น</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Search;
