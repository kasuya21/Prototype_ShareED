import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../database/db.js';
import { searchPosts } from '../services/searchService.js';
import { v4 as uuidv4 } from 'uuid';

describe('Search Service', () => {
  let testUserId;
  let testPosts;

  beforeEach(() => {
    // Create test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, 'member')
    `).run(testUserId, 'test@example.com', 'Test User', 'testuser');

    // Create test posts with different attributes
    testPosts = [
      {
        id: uuidv4(),
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        tags: ['javascript', 'programming'],
        educationLevel: 'junior_high',
        status: 'active',
        likeCount: 10,
        viewCount: 100
      },
      {
        id: uuidv4(),
        title: 'Advanced Python',
        description: 'Master Python programming',
        tags: ['python', 'advanced'],
        educationLevel: 'university',
        status: 'active',
        likeCount: 25,
        viewCount: 200
      },
      {
        id: uuidv4(),
        title: 'Web Development',
        description: 'Build modern websites',
        tags: ['web', 'javascript'],
        educationLevel: 'senior_high',
        status: 'active',
        likeCount: 15,
        viewCount: 150
      },
      {
        id: uuidv4(),
        title: 'Unactived Post',
        description: 'This should not appear',
        tags: ['hidden'],
        educationLevel: 'junior_high',
        status: 'unactived',
        likeCount: 5,
        viewCount: 50
      },
      {
        id: uuidv4(),
        title: 'Deleted Post',
        description: 'This should not appear',
        tags: ['deleted'],
        educationLevel: 'junior_high',
        status: 'deleted',
        likeCount: 3,
        viewCount: 30
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO posts (
        id, author_id, cover_image, title, description, content,
        education_level, tags, content_images, status, like_count, view_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    testPosts.forEach(post => {
      stmt.run(
        post.id,
        testUserId,
        'cover.jpg',
        post.title,
        post.description,
        'Content',
        post.educationLevel,
        JSON.stringify(post.tags),
        JSON.stringify([]),
        post.status,
        post.likeCount,
        post.viewCount
      );
    });
  });

  afterEach(() => {
    // Clean up
    db.prepare('DELETE FROM posts WHERE author_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('Keyword Search', () => {
    it('should search posts by title', async () => {
      const result = await searchPosts({ keyword: 'JavaScript' });
      
      expect(result.posts.length).toBe(2);
      expect(result.posts.some(p => p.title === 'JavaScript Basics')).toBe(true);
      expect(result.posts.some(p => p.title === 'Web Development')).toBe(true);
    });

    it('should search posts by tags', async () => {
      const result = await searchPosts({ keyword: 'python' });
      
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].title).toBe('Advanced Python');
    });

    it('should be case-insensitive', async () => {
      const result = await searchPosts({ keyword: 'javascript' });
      
      expect(result.posts.length).toBe(2);
    });

    it('should return all active posts when no keyword provided', async () => {
      const result = await searchPosts({});
      
      expect(result.posts.length).toBe(3); // Only active posts
      expect(result.posts.every(p => p.status === 'active')).toBe(true);
    });
  });

  describe('Education Level Filtering', () => {
    it('should filter posts by education level', async () => {
      const result = await searchPosts({ educationLevel: 'university' });
      
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].educationLevel).toBe('university');
    });

    it('should combine keyword and education level filters', async () => {
      const result = await searchPosts({ 
        keyword: 'javascript',
        educationLevel: 'junior_high'
      });
      
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].title).toBe('JavaScript Basics');
    });

    it('should throw error for invalid education level', async () => {
      await expect(searchPosts({ educationLevel: 'invalid' }))
        .rejects.toThrow('Invalid education level');
    });
  });

  describe('Sorting', () => {
    it('should sort by popularity (like count)', async () => {
      const result = await searchPosts({ sortBy: 'popularity' });
      
      expect(result.posts.length).toBe(3);
      expect(result.posts[0].title).toBe('Advanced Python'); // 25 likes
      expect(result.posts[1].title).toBe('Web Development'); // 15 likes
      expect(result.posts[2].title).toBe('JavaScript Basics'); // 10 likes
    });

    it('should sort by views', async () => {
      const result = await searchPosts({ sortBy: 'views' });
      
      expect(result.posts.length).toBe(3);
      expect(result.posts[0].title).toBe('Advanced Python'); // 200 views
      expect(result.posts[1].title).toBe('Web Development'); // 150 views
      expect(result.posts[2].title).toBe('JavaScript Basics'); // 100 views
    });

    it('should sort by date (default)', async () => {
      const result = await searchPosts({ sortBy: 'date' });
      
      expect(result.posts.length).toBe(3);
      // Most recent first - verify the order is descending by created_at
      const dates = result.posts.map(p => new Date(p.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should throw error for invalid sort option', async () => {
      await expect(searchPosts({ sortBy: 'invalid' }))
        .rejects.toThrow('Invalid sort option');
    });
  });

  describe('Pagination', () => {
    it('should paginate results', async () => {
      const result = await searchPosts({ page: 1, pageSize: 2 });
      
      expect(result.posts.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalCount).toBe(3);
    });

    it('should return second page', async () => {
      const result = await searchPosts({ page: 2, pageSize: 2 });
      
      expect(result.posts.length).toBe(1);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(2);
      expect(result.totalCount).toBe(3);
    });

    it('should return empty array for page beyond results', async () => {
      const result = await searchPosts({ page: 10, pageSize: 10 });
      
      expect(result.posts.length).toBe(0);
      expect(result.totalCount).toBe(3);
    });

    it('should use default pagination values', async () => {
      const result = await searchPosts({});
      
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should throw error for invalid page number', async () => {
      await expect(searchPosts({ page: 0 }))
        .rejects.toThrow('Page number must be at least 1');
    });

    it('should throw error for invalid page size', async () => {
      await expect(searchPosts({ pageSize: 0 }))
        .rejects.toThrow('Page size must be between 1 and 100');
      
      await expect(searchPosts({ pageSize: 101 }))
        .rejects.toThrow('Page size must be between 1 and 100');
    });
  });

  describe('Status Filtering', () => {
    it('should exclude unactived posts', async () => {
      const result = await searchPosts({ keyword: 'Unactived' });
      
      expect(result.posts.length).toBe(0);
    });

    it('should exclude deleted posts', async () => {
      const result = await searchPosts({ keyword: 'Deleted' });
      
      expect(result.posts.length).toBe(0);
    });

    it('should only return active posts', async () => {
      const result = await searchPosts({});
      
      expect(result.posts.every(p => p.status === 'active')).toBe(true);
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no matches found', async () => {
      const result = await searchPosts({ keyword: 'nonexistent' });
      
      expect(result.posts).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should return empty array when education level has no matches', async () => {
      // Delete all university posts first
      db.prepare("DELETE FROM posts WHERE education_level = 'university'").run();
      
      const result = await searchPosts({ educationLevel: 'university' });
      
      expect(result.posts).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('Post Data Integrity', () => {
    it('should return complete post data', async () => {
      const result = await searchPosts({ keyword: 'JavaScript Basics' });
      
      expect(result.posts.length).toBe(1);
      const post = result.posts[0];
      
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('authorId');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('description');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('educationLevel');
      expect(post).toHaveProperty('tags');
      expect(post).toHaveProperty('status');
      expect(post).toHaveProperty('likeCount');
      expect(post).toHaveProperty('viewCount');
      expect(post).toHaveProperty('author');
      expect(post.author).toHaveProperty('name');
      expect(post.author).toHaveProperty('nickname');
    });

    it('should parse tags as array', async () => {
      const result = await searchPosts({ keyword: 'JavaScript Basics' });
      
      expect(Array.isArray(result.posts[0].tags)).toBe(true);
      expect(result.posts[0].tags).toContain('javascript');
    });
  });

  describe('Combined Filters', () => {
    it('should apply keyword, education level, and sorting together', async () => {
      const result = await searchPosts({
        keyword: 'javascript',
        educationLevel: 'junior_high',
        sortBy: 'popularity',
        page: 1,
        pageSize: 10
      });
      
      expect(result.posts.length).toBe(1);
      expect(result.posts[0].title).toBe('JavaScript Basics');
      expect(result.posts[0].educationLevel).toBe('junior_high');
    });
  });
});
