# Search Service Implementation

## Overview
Implemented the Search Service for the Knowledge Sharing Platform according to task 15.1 specifications.

## Files Created

### 1. `backend/src/services/searchService.js`
Main search service implementation with the following features:

**Function: `searchPosts(query)`**
- **Keyword Search (Requirement 7.1)**: Searches posts by title and tags using SQL LIKE operator
- **Education Level Filtering (Requirement 7.2)**: Filters posts by education level (junior_high, senior_high, university)
- **Sorting Options (Requirement 7.3)**: Supports three sort modes:
  - `popularity`: Sort by like_count DESC
  - `date`: Sort by created_at DESC (default)
  - `views`: Sort by view_count DESC
- **Pagination (Requirement 7.5)**: Implements page and pageSize parameters with validation
- **Status Filtering (Requirement 7.4)**: Automatically excludes posts with status 'unactived' or 'deleted'

**Input Validation:**
- Validates sort options (must be: popularity, date, or views)
- Validates education level (must be: junior_high, senior_high, or university)
- Validates pagination parameters (page >= 1, pageSize between 1-100)

**Return Format:**
```javascript
{
  posts: Array<Post>,      // Array of formatted post objects with author info
  totalCount: number,      // Total number of matching posts
  page: number,           // Current page number
  pageSize: number        // Number of posts per page
}
```

### 2. `backend/src/__tests__/searchService.test.js`
Comprehensive unit tests covering:
- Keyword search (by title and tags)
- Case-insensitive search
- Education level filtering
- Combined filters
- All three sorting options
- Pagination (first page, second page, beyond results)
- Status filtering (excludes unactived and deleted posts)
- Empty results handling
- Post data integrity
- Input validation errors

**Test Results:** 25/25 tests passing ✓

### 3. `backend/src/__tests__/searchRoutes.test.js`
API integration tests covering:
- GET /api/posts/search endpoint
- Query parameter handling
- Error responses (400 for validation errors)
- Combined filter scenarios

**Test Results:** 8/8 tests passing ✓

### 4. `backend/src/routes/postRoutes.js` (Updated)
Added new search endpoint:
- **Route:** `GET /api/posts/search`
- **Query Parameters:**
  - `keyword` (optional): Search term for title/tags
  - `educationLevel` (optional): Filter by education level
  - `sortBy` (optional): Sort option (popularity, date, views)
  - `page` (optional): Page number (default: 1)
  - `pageSize` (optional): Posts per page (default: 10)
- **Response:** JSON with posts array, totalCount, page, and pageSize
- **Error Handling:** Returns 400 for validation errors, 500 for server errors

## Requirements Satisfied

✅ **Requirement 7.1**: Search posts by title and tags
✅ **Requirement 7.2**: Filter by education level
✅ **Requirement 7.3**: Sort by popularity, date, or views
✅ **Requirement 7.4**: Exclude unactived and deleted posts
✅ **Requirement 7.5**: Handle empty results gracefully

## API Usage Examples

### Basic keyword search:
```
GET /api/posts/search?keyword=javascript
```

### Filter by education level:
```
GET /api/posts/search?educationLevel=university
```

### Sort by popularity:
```
GET /api/posts/search?sortBy=popularity
```

### Combined search with pagination:
```
GET /api/posts/search?keyword=python&educationLevel=senior_high&sortBy=views&page=1&pageSize=20
```

### Get all active posts (no filters):
```
GET /api/posts/search
```

## Database Query Optimization

The search service uses:
- Indexed columns for efficient filtering (status, education_level)
- JOIN with users table to include author information
- Parameterized queries to prevent SQL injection
- Efficient pagination with LIMIT and OFFSET

## Testing Coverage

- **Unit Tests**: 25 tests covering all search functionality
- **Integration Tests**: 8 tests covering API endpoints
- **Edge Cases**: Empty results, invalid inputs, boundary conditions
- **All tests passing**: ✓

## Next Steps

The search service is fully implemented and tested. It can now be:
1. Integrated with the frontend search UI
2. Extended with additional filters (tags, date ranges) if needed
3. Optimized with caching for frequently searched terms
4. Enhanced with full-text search if performance becomes an issue

## Notes

- The service follows the existing codebase patterns and conventions
- Error handling is consistent with other services
- All validation errors return appropriate HTTP status codes
- The implementation is minimal and focused on the specified requirements
