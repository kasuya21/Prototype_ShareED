# Implementation Plan: Knowledge Sharing Platform

## Overview

แผนการพัฒนาระบบแพลตฟอร์มแชร์ความรู้แบ่งออกเป็นขั้นตอนหลักๆ ดังนี้:
1. ตั้งค่าโครงสร้างโปรเจกต์และ infrastructure
2. พัฒนา authentication และ user management
3. พัฒนาระบบโพสต์และการโต้ตอบ
4. พัฒนาระบบรางวัลและภารกิจ
5. พัฒนาระบบค้นหาและการแจ้งเตือน
6. Integration และ testing

## Tasks

- [x] 1. ตั้งค่าโครงสร้างโปรเจกต์และ infrastructure
  - สร้างโครงสร้างโปรเจกต์ (frontend และ backend)
  - ติดตั้ง dependencies (Express.js, React, database client)
  - ตั้งค่า database schema และ migrations
  - ตั้งค่า environment variables และ configuration
  - ตั้งค่า testing framework (Jest, fast-check)
  - _Requirements: ทุก requirements_

- [ ] 2. พัฒนา Authentication Service และ User Management
  - [x] 2.1 Implement Google OAuth 2.0 integration
    - สร้าง OAuth flow (redirect, callback, token exchange)
    - Implement getUserProfile function
    - Implement session token generation และ validation
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Write property test for user authentication
    - **Property 1: User Authentication and Session Management**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.3 Write property test for session invalidation
    - **Property 2: Session Invalidation**
    - **Validates: Requirements 1.6**
  
  - [x] 2.4 Implement User Service
    - สร้าง createOrUpdateUser function
    - สร้าง getUser, updateProfile functions
    - Implement nickname uniqueness check
    - _Requirements: 1.4, 13.1, 13.7_
  
  - [ ]* 2.5 Write property test for nickname uniqueness
    - **Property 47: Nickname Uniqueness**
    - **Validates: Requirements 13.1, 13.2**
  
  - [x] 2.6 Implement role management (Admin only)
    - สร้าง changeRole function
    - Implement permission validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.7 Write property tests for role management
    - **Property 3: Role Assignment Authorization**
    - **Property 4: Role Update Immediate Effect**
    - **Validates: Requirements 2.3, 2.4**

- [x] 3. Checkpoint - ตรวจสอบ authentication และ user management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. พัฒนา Post Service และ File Management
  - [x] 4.1 Implement File Service
    - สร้าง uploadFile function พร้อม file type validation
    - Implement file storage (local หรือ cloud)
    - สร้าง getFileUrl และ deleteFile functions
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 4.2 Write property test for file validation
    - **Property 57: File Format Validation**
    - **Validates: Requirements 15.1, 15.2**
  
  - [x] 4.3 Implement Post Service - Create และ Update
    - สร้าง createPost function พร้อม validation
    - Implement rate limiting check (3 posts per 24 hours)
    - สร้าง updatePost function พร้อม ownership check
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.4 Write property tests for post creation
    - **Property 5: Post Creation Required Fields**
    - **Property 6: Post Creation Optional Fields**
    - **Property 7: Post Rate Limiting**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ]* 4.5 Write property test for post ownership
    - **Property 8: Post Ownership Authorization**
    - **Validates: Requirements 3.5, 3.7**
  
  - [x] 4.6 Implement Post Service - Delete และ Retrieve
    - สร้าง deletePost function (soft delete)
    - สร้าง getPost, getUserPosts functions
    - Implement incrementViewCount function
    - _Requirements: 3.6, 5.2_
  
  - [ ]* 4.7 Write property test for soft delete
    - **Property 9: Soft Delete Preservation**
    - **Property 60: Soft Delete File Preservation**
    - **Validates: Requirements 3.6, 15.5**

- [x] 5. พัฒนา Report Service และ Moderation
  - [x] 5.1 Implement Report Service
    - สร้าง reportPost function พร้อม duplicate check
    - Implement automatic deactivation (10 reports threshold)
    - สร้าง getReportedPosts function สำหรับ Moderators
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ]* 5.2 Write property tests for reporting system
    - **Property 10: Report Duplicate Prevention**
    - **Property 11: Automatic Post Deactivation**
    - **Property 13: Reported Posts Visibility**
    - **Validates: Requirements 4.2, 4.3, 4.5**
  
  - [x] 5.3 Implement Moderator actions
    - สร้าง moderatorDeletePost function
    - สร้าง moderatorRestorePost function
    - _Requirements: 4.6, 4.7_
  
  - [ ]* 5.4 Write property test for post restoration
    - **Property 14: Post Restoration**
    - **Validates: Requirements 4.7**

- [x] 6. Checkpoint - ตรวจสอบ post management และ moderation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. พัฒนา Interaction Service (Like, Comment, Bookmark)
  - [x] 7.1 Implement Like functionality
    - สร้าง likePost และ unlikePost functions
    - Implement hasUserLiked check
    - Update post like counter
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ]* 7.2 Write property tests for like system
    - **Property 53: Like Counter Increment**
    - **Property 54: Like Toggle Behavior**
    - **Validates: Requirements 14.1, 14.2, 14.3**
  
  - [x] 7.3 Implement Comment functionality
    - สร้าง createComment function
    - สร้าง getPostComments function พร้อม chronological sorting
    - Update post comment counter
    - _Requirements: 14.4, 14.6_
  
  - [ ]* 7.4 Write property tests for comment system
    - **Property 55: Comment Data Integrity**
    - **Property 56: Comment Chronological Order**
    - **Validates: Requirements 14.4, 14.6**
  
  - [x] 7.5 Implement Bookmark functionality
    - สร้าง addBookmark และ removeBookmark functions
    - สร้าง getUserBookmarks function
    - Implement duplicate prevention
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 7.6 Write property tests for bookmark system
    - **Property 35: Bookmark Addition**
    - **Property 36: Bookmark Removal with Notification**
    - **Property 37: Duplicate Bookmark Prevention**
    - **Property 38: Bookmark Status Independence**
    - **Validates: Requirements 10.1, 10.2, 10.4, 10.5**

- [-] 8. พัฒนา Follow Service
  - [ ] 8.1 Implement Follow functionality
    - สร้าง followUser และ unfollowUser functions
    - Implement isFollowing check และ duplicate prevention
    - สร้าง getFollowerCount และ getFollowingCount functions
    - _Requirements: 9.1, 9.2, 9.4, 9.5_
  
  - [ ]* 8.2 Write property tests for follow system
    - **Property 31: Follow Relationship Creation**
    - **Property 32: Follow Relationship Removal**
    - **Property 33: Duplicate Follow Prevention**
    - **Property 34: Follower Count Accuracy**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**

- [x] 9. พัฒนา Notification Service
  - [x] 9.1 Implement Notification Service
    - สร้าง createNotification function
    - สร้าง getUserNotifications function
    - Implement markAsRead และ markAllAsRead functions
    - สร้าง getUnreadCount function
    - _Requirements: 8.6, 8.7_
  
  - [ ]* 9.2 Write property tests for notification system
    - **Property 29: Notification Persistence**
    - **Property 30: Notification Read Status**
    - **Validates: Requirements 8.6, 8.7**
  
  - [x] 9.3 Integrate notification triggers
    - เชื่อมต่อ notification กับ comment events
    - เชื่อมต่อ notification กับ like events
    - เชื่อมต่อ notification กับ post status changes
    - เชื่อมต่อ notification กับ follower post creation
    - เชื่อมต่อ notification กับ moderator alerts
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 9.4 Write property tests for notification triggers
    - **Property 25: Comment Notification**
    - **Property 26: Like Notification**
    - **Property 27: Post Status Change Notification**
    - **Property 28: Follower Post Notification**
    - **Property 12: Moderator Notification on Deactivation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 10. Checkpoint - ตรวจสอบ interactions และ notifications
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. พัฒนา Shop Service และ Inventory
  - [x] 11.1 Implement Shop Service
    - สร้าง getAllItems function
    - สร้าง purchaseItem function พร้อม coin validation
    - Implement hasItem check และ duplicate prevention
    - สร้าง getUserInventory function
    - สร้าง activateItem function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 11.2 Write property tests for shop system
    - **Property 18: Sufficient Coins Validation**
    - **Property 19: Purchase Transaction Integrity**
    - **Property 20: Duplicate Purchase Prevention**
    - **Property 21: Transaction Atomicity**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.8**
  
  - [x] 11.3 Integrate shop items with profile customization
    - เชื่อมต่อ theme selection กับ profile
    - เชื่อมต่อ badge และ frame กับ profile display
    - Validate inventory ownership before applying items
    - _Requirements: 6.6, 13.6_
  
  - [ ]* 11.4 Write property test for theme inventory validation
    - **Property 50: Theme Inventory Validation**
    - **Validates: Requirements 13.6**

- [x] 12. พัฒนา Quest Service
  - [x] 12.1 Implement Quest Service
    - สร้าง generateDailyQuests function
    - สร้าง getUserQuests function
    - Implement updateQuestProgress function
    - สร้าง claimQuestReward function พร้อม validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_
  
  - [ ]* 12.2 Write property tests for quest system
    - **Property 39: Quest Completion Marking**
    - **Property 40: Quest Reward Claim Validation**
    - **Property 41: Quest Reward Distribution**
    - **Property 42: Quest Claim Idempotence**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.7**
  
  - [x] 12.3 Integrate quest progress tracking
    - เชื่อมต่อ quest updates กับ post creation
    - เชื่อมต่อ quest updates กับ comment creation
    - เชื่อมต่อ quest updates กับ like actions
    - _Requirements: 11.2_

- [ ] 13. พัฒนา Achievement Service
  - [ ] 13.1 Implement Achievement Service
    - สร้าง getAllAchievements function
    - สร้าง getUserAchievements function
    - Implement checkAndUnlockAchievements function
    - สร้าง unlockAchievement function พร้อม reward distribution
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ]* 13.2 Write property tests for achievement system
    - **Property 43: Achievement Auto-Unlock**
    - **Property 44: Achievement Reward Distribution**
    - **Property 45: Achievement Unlock Notification**
    - **Property 46: Achievement Progress Tracking**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
  
  - [ ] 13.3 Integrate achievement tracking
    - เชื่อมต่อ achievement progress กับ user actions
    - Implement automatic checking และ unlocking
    - _Requirements: 12.1, 12.5_

- [ ] 14. Checkpoint - ตรวจสอบ rewards system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. พัฒนา Search Service
  - [ ] 15.1 Implement Search Service
    - สร้าง searchPosts function พร้อม keyword matching
    - Implement education level filtering
    - Implement sorting options (popularity, date, views)
    - Implement pagination
    - Filter out unactived posts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 15.2 Write property tests for search system
    - **Property 22: Search by Title and Tags**
    - **Property 23: Education Level Filtering**
    - **Property 24: Search Results Sorting**
    - **Property 17: Unactived Posts Exclusion**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [ ] 15.3 Implement popular posts functionality
    - สร้าง getPopularPosts function
    - Implement sorting by like count
    - Filter out unactived posts
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [ ]* 15.4 Write property tests for popular posts
    - **Property 15: Popular Posts Sorting**
    - **Property 16: View Counter Increment**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 16. พัฒนา Profile Management
  - [ ] 16.1 Implement profile update validations
    - Implement bio length validation (512 characters)
    - Implement profile picture format validation (JPG, PNG)
    - Implement education level enum validation
    - _Requirements: 13.3, 13.4, 13.5, 13.8_
  
  - [ ]* 16.2 Write property tests for profile validations
    - **Property 48: Profile Picture Format Validation**
    - **Property 49: Bio Length Validation**
    - **Property 51: Profile Update Persistence**
    - **Property 52: Education Level Validation**
    - **Validates: Requirements 13.3, 13.4, 13.5, 13.7, 13.8**

- [ ] 17. พัฒนา Security และ Authorization
  - [ ] 17.1 Implement authentication middleware
    - สร้าง middleware สำหรับ token validation
    - Implement 401 error handling
    - _Requirements: 17.1, 17.2_
  
  - [ ] 17.2 Implement authorization middleware
    - สร้าง middleware สำหรับ permission checking
    - Implement role-based access control
    - Implement 403 error handling
    - _Requirements: 17.3, 17.4_
  
  - [ ]* 17.3 Write property tests for security
    - **Property 61: Authentication Requirement**
    - **Property 62: Authorization Enforcement**
    - **Property 63: Rate Limit Enforcement**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**
  
  - [ ] 17.4 Implement rate limiting middleware
    - สร้าง rate limiter สำหรับ API endpoints
    - Implement 429 error handling
    - _Requirements: 17.5, 17.6_

- [ ] 18. พัฒนา Data Integrity และ Transaction Management
  - [ ] 18.1 Implement transaction wrappers
    - สร้าง transaction helper functions
    - Implement automatic rollback on errors
    - Ensure atomic operations
    - _Requirements: 19.1, 19.2_
  
  - [ ]* 18.2 Write property tests for data integrity
    - **Property 64: Transaction Rollback**
    - **Property 65: Operation Atomicity**
    - **Property 66: Referential Integrity**
    - **Validates: Requirements 19.1, 19.2, 19.3**
  
  - [ ] 18.3 Implement error logging
    - สร้าง logging service
    - Implement secure error messages (no sensitive data)
    - _Requirements: 19.4_
  
  - [ ]* 18.4 Write property test for secure error logging
    - **Property 67: Secure Error Logging**
    - **Validates: Requirements 19.4**

- [ ] 19. Checkpoint - ตรวจสอบ security และ data integrity
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. พัฒนา REST API Endpoints
  - [ ] 20.1 Implement Authentication endpoints
    - POST /api/auth/login (initiate OAuth)
    - GET /api/auth/callback (OAuth callback)
    - POST /api/auth/logout
    - _Requirements: 1.1, 1.6_
  
  - [ ] 20.2 Implement User endpoints
    - GET /api/users/:id
    - PUT /api/users/:id/profile
    - PUT /api/users/:id/role (Admin only)
    - GET /api/users/:id/followers
    - GET /api/users/:id/following
    - _Requirements: 2.1, 13.7_
  
  - [ ] 20.3 Implement Post endpoints
    - POST /api/posts
    - GET /api/posts/:id
    - PUT /api/posts/:id
    - DELETE /api/posts/:id
    - GET /api/posts (with filters)
    - GET /api/posts/popular
    - _Requirements: 3.1, 3.5, 3.6, 5.1, 7.1_
  
  - [ ] 20.4 Implement Interaction endpoints
    - POST /api/posts/:id/like
    - DELETE /api/posts/:id/like
    - POST /api/posts/:id/comments
    - GET /api/posts/:id/comments
    - POST /api/posts/:id/bookmark
    - DELETE /api/posts/:id/bookmark
    - GET /api/users/:id/bookmarks
    - _Requirements: 10.1, 10.2, 14.1, 14.2, 14.4_
  
  - [ ] 20.5 Implement Follow endpoints
    - POST /api/users/:id/follow
    - DELETE /api/users/:id/follow
    - _Requirements: 9.1, 9.2_
  
  - [ ] 20.6 Implement Report และ Moderation endpoints
    - POST /api/posts/:id/report
    - GET /api/moderation/reported-posts (Moderator only)
    - DELETE /api/moderation/posts/:id (Moderator only)
    - PUT /api/moderation/posts/:id/restore (Moderator only)
    - _Requirements: 4.1, 4.5, 4.6, 4.7_
  
  - [ ] 20.7 Implement Shop endpoints
    - GET /api/shop/items
    - POST /api/shop/purchase
    - GET /api/users/:id/inventory
    - PUT /api/users/:id/inventory/:itemId/activate
    - _Requirements: 6.1, 6.4, 6.6_
  
  - [ ] 20.8 Implement Quest endpoints
    - GET /api/quests
    - POST /api/quests/:id/claim
    - _Requirements: 11.2, 11.5_
  
  - [ ] 20.9 Implement Achievement endpoints
    - GET /api/achievements
    - GET /api/users/:id/achievements
    - _Requirements: 12.6_
  
  - [ ] 20.10 Implement Notification endpoints
    - GET /api/notifications
    - PUT /api/notifications/:id/read
    - PUT /api/notifications/read-all
    - GET /api/notifications/unread-count
    - _Requirements: 8.6, 8.7_
  
  - [ ] 20.11 Implement File Upload endpoint
    - POST /api/files/upload
    - _Requirements: 15.1, 15.3_

- [-] 21. พัฒนา Frontend - Authentication และ Layout
  - [x] 21.1 สร้าง Login page และ OAuth integration
    - Implement Google login button
    - Handle OAuth callback
    - Store session token
    - _Requirements: 1.1_
  
  - [x] 21.2 สร้าง Main Layout components
    - Navigation bar พร้อม user menu
    - Sidebar สำหรับ navigation
    - Footer
    - Responsive design implementation
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 21.3 สร้าง Protected Route wrapper
    - Implement authentication check
    - Redirect to login if not authenticated
    - _Requirements: 17.1_

- [-] 22. พัฒนา Frontend - Post Management
  - [ ] 22.1 สร้าง Post List page
    - Display posts with pagination
    - Show post cards (cover, title, description, stats)
    - Implement infinite scroll หรือ pagination
    - _Requirements: 5.1, 5.3_
  
  - [ ] 22.2 สร้าง Post Detail page
    - Display full post content
    - Show like, comment, bookmark buttons
    - Display comments list
    - Implement comment form
    - _Requirements: 14.1, 14.4, 14.6_
  
  - [ ] 22.3 สร้าง Create/Edit Post page
    - Form สำหรับ post creation
    - File upload สำหรับ cover image และ content images
    - Tag input
    - Education level selector
    - Rich text editor สำหรับ content
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ] 22.4 Implement post interactions
    - Like/Unlike functionality
    - Comment submission
    - Bookmark add/remove
    - Report post functionality
    - _Requirements: 4.1, 10.1, 10.2, 14.1, 14.2_

- [ ] 23. พัฒนา Frontend - User Profile และ Customization
  - [ ] 23.1 สร้าง Profile page
    - Display user information
    - Show user's posts
    - Display follower/following counts
    - Show achievements และ badges
    - Apply selected theme, frame, badge
    - _Requirements: 9.5, 12.6, 13.7_
  
  - [ ] 23.2 สร้าง Edit Profile page
    - Form สำหรับ profile updates
    - Nickname input พร้อม uniqueness validation
    - Bio textarea พร้อม character counter
    - Profile picture upload
    - Education level selector
    - _Requirements: 13.1, 13.3, 13.4, 13.8_
  
  - [ ] 23.3 สร้าง Shop page
    - Display available items
    - Show coin balance
    - Implement purchase functionality
    - _Requirements: 6.1, 6.4_
  
  - [ ] 23.4 สร้าง Inventory page
    - Display owned items
    - Implement item activation
    - Show active items
    - _Requirements: 6.6_

- [ ] 24. พัฒนา Frontend - Search และ Filtering
  - [ ] 24.1 สร้าง Search page
    - Search input
    - Education level filter
    - Sort options (popularity, date, views)
    - Display search results
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 24.2 สร้าง Popular Posts page
    - Display most liked posts
    - Show view counts
    - _Requirements: 5.1, 5.3_
  
  - [ ] 24.3 สร้าง Bookmarks page
    - Display user's bookmarked posts
    - Implement bookmark removal
    - _Requirements: 10.2, 10.3_

- [ ] 25. พัฒนา Frontend - Quests และ Achievements
  - [ ] 25.1 สร้าง Quests page
    - Display daily quests
    - Show progress bars
    - Implement claim rewards button
    - Show coin rewards
    - _Requirements: 11.2, 11.5_
  
  - [ ] 25.2 สร้าง Achievements page
    - Display all achievements (locked และ unlocked)
    - Show progress toward locked achievements
    - Display badges
    - _Requirements: 12.6_

- [ ] 26. พัฒนา Frontend - Notifications
  - [ ] 26.1 สร้าง Notification dropdown
    - Display recent notifications
    - Show unread count badge
    - Implement mark as read
    - Link to notification sources
    - _Requirements: 8.6, 8.7_
  
  - [ ] 26.2 สร้าง Notifications page
    - Display all notifications
    - Filter by read/unread
    - Implement mark all as read
    - _Requirements: 8.7_

- [ ] 27. พัฒนา Frontend - Moderation (Moderator only)
  - [ ] 27.1 สร้าง Moderation Dashboard
    - Display reported posts
    - Show report counts และ reasons
    - Implement delete post action
    - Implement restore post action
    - _Requirements: 4.5, 4.6, 4.7_

- [ ] 28. พัฒนา Frontend - Admin Panel (Admin only)
  - [ ] 28.1 สร้าง User Management page
    - Display user list
    - Implement role change functionality
    - _Requirements: 2.1, 2.2_

- [ ] 29. Checkpoint - ตรวจสอบ frontend integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 30. Integration Testing และ Bug Fixes
  - [ ] 30.1 ทดสอบ end-to-end user flows
    - User registration และ login flow
    - Post creation และ interaction flow
    - Quest และ achievement flow
    - Shop และ customization flow
    - Moderation flow
  
  - [ ] 30.2 ทดสอบ error scenarios
    - Network errors
    - Invalid inputs
    - Permission errors
    - Rate limiting
  
  - [ ] 30.3 แก้ไข bugs ที่พบ
    - Fix critical bugs
    - Fix UI/UX issues
    - Optimize performance

- [ ]* 31. Write integration tests
  - Test API endpoints
  - Test database operations
  - Test external service integrations

- [ ] 32. Performance Optimization
  - [ ] 32.1 Optimize database queries
    - Add indexes
    - Optimize N+1 queries
    - Implement query caching
  
  - [ ] 32.2 Optimize frontend performance
    - Implement code splitting
    - Optimize images
    - Implement lazy loading
  
  - [ ] 32.3 Implement caching strategies
    - Cache frequently accessed data
    - Implement Redis caching (optional)

- [ ] 33. Final Checkpoint - ตรวจสอบระบบทั้งหมด
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Check code quality และ documentation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- แต่ละ task มี reference ไปยัง requirements เพื่อ traceability
- Checkpoints ช่วยให้มั่นใจว่าแต่ละส่วนทำงานถูกต้องก่อนไปต่อ
- Property tests ช่วยตรวจสอบ correctness properties จาก design document
- Unit tests ช่วยตรวจสอบ specific examples และ edge cases
- ควรใช้ fast-check library สำหรับ property-based testing ใน JavaScript
