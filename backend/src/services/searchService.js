import db from '../database/db.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Search Service
 * Handles post search with keyword matching, filtering, sorting, and pagination
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

/**
 * Search posts with filters, sorting, and pagination
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * @param {Object} query - Search query parameters
 * @param {string} query.keyword - Search keyword (optional)
 * @param {string} query.educationLevel - Education level filter (optional)
 * @param {string} query.sortBy - Sort option: 'popularity', 'date', or 'views' (default: 'date')
 * @param {number} query.page - Page number (default: 1)
 * @param {number} query.pageSize - Number of posts per page (default: 10)
 * @returns {Promise<Object>} - Search results with posts, totalCount, page, and pageSize
 */
export async function searchPosts(query) {
  const {
    keyword = '',
    educationLevel = null,
    sortBy = 'date',
    page = 1,
    pageSize = 10
  } = query;

  // Validate sortBy option
  const validSortOptions = ['popularity', 'date', 'views'];
  if (!validSortOptions.includes(sortBy)) {
    throw new ValidationError('Invalid sort option. Must be one of: popularity, date, views');
  }

  // Validate education level if provided
  if (educationLevel) {
    const validEducationLevels = ['junior_high', 'senior_high', 'university'];
    if (!validEducationLevels.includes(educationLevel)) {
      throw new ValidationError('Invalid education level');
    }
  }

  // Validate pagination parameters
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  
  if (pageNum < 1) {
    throw new ValidationError('Page number must be at least 1');
  }
  
  if (pageSizeNum < 1 || pageSizeNum > 100) {
    throw new ValidationError('Page size must be between 1 and 100');
  }

  // Build WHERE clause
  const conditions = [];
  const params = [];

  // Requirement 7.4: Filter out unactived and deleted posts
  conditions.push("p.status = 'active'");

  // Requirement 7.1: Search by title and tags
  if (keyword && keyword.trim()) {
    const searchTerm = `%${keyword.trim()}%`;
    conditions.push("(p.title LIKE ? OR p.tags LIKE ?)");
    params.push(searchTerm, searchTerm);
  }

  // Requirement 7.2: Filter by education level
  if (educationLevel) {
    conditions.push("p.education_level = ?");
    params.push(educationLevel);
  }

  const whereClause = conditions.join(' AND ');

  // Requirement 7.3: Determine sort order
  let orderByClause;
  switch (sortBy) {
    case 'popularity':
      orderByClause = 'p.like_count DESC, p.created_at DESC';
      break;
    case 'views':
      orderByClause = 'p.view_count DESC, p.created_at DESC';
      break;
    case 'date':
    default:
      orderByClause = 'p.created_at DESC';
      break;
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM posts p
    WHERE ${whereClause}
  `;
  
  const countResult = db.prepare(countQuery).get(...params);
  const totalCount = countResult.total;

  // Requirement 7.5: No results message handled by caller
  if (totalCount === 0) {
    return {
      posts: [],
      totalCount: 0,
      page: pageNum,
      pageSize: pageSizeNum
    };
  }

  // Calculate offset for pagination
  const offset = (pageNum - 1) * pageSizeNum;

  // Get paginated results
  const searchQuery = `
    SELECT p.*, u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  const posts = db.prepare(searchQuery).all(...params, pageSizeNum, offset);

  // Format posts
  const formattedPosts = posts.map(post => ({
    id: post.id,
    authorId: post.author_id,
    coverImage: post.cover_image,
    title: post.title,
    description: post.description,
    content: post.content,
    educationLevel: post.education_level,
    tags: JSON.parse(post.tags),
    contentImages: JSON.parse(post.content_images),
    status: post.status,
    likeCount: post.like_count,
    viewCount: post.view_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: {
      name: post.author_name,
      nickname: post.author_nickname,
      profilePicture: post.author_picture
    }
  }));

  return {
    posts: formattedPosts,
    totalCount,
    page: pageNum,
    pageSize: pageSizeNum
  };
}

export default {
  searchPosts
};
