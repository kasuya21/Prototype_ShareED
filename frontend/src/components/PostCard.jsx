import { Link } from 'react-router-dom';

function PostCard({ post }) {
  const educationLevelMap = {
    junior_high: 'ม.ต้น',
    senior_high: 'ม.ปลาย',
    university: 'มหาวิทยาลัย'
  };

  return (
    <Link to={`/posts/${post.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={post.cover_image || '/placeholder-image.jpg'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Education Level */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              {educationLevelMap[post.education_level] || post.education_level}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {post.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {post.comment_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {post.view_count || 0}
              </span>
            </div>

            {/* Author */}
            {post.author_name && (
              <div className="flex items-center gap-2">
                <img
                  src={post.author_picture || '/default-avatar.png'}
                  alt={post.author_name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs">{post.author_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
