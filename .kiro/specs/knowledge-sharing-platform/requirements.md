# Requirements Document

## Introduction

ระบบแพลตฟอร์มแชร์ความรู้ (Knowledge Sharing Platform) เป็นระบบที่ออกแบบมาเพื่อให้ผู้ใช้งานสามารถแบ่งปันความรู้ผ่านการสร้างและเผยแพร่โพสต์ โดยมีระบบจัดการผู้ใช้งานหลายระดับ (Member, Moderator, Admin) ระบบรางวัลและภารกิจ การค้นหาและกรองเนื้อหา รวมถึงระบบการแจ้งเตือนและการติดตามผู้ใช้งาน

## Teckstack
-express เป็นโครงสร้างapi
-javascript(backend)
-tailwind
-react(frontend)
-sqlite
## Glossary

- **System**: ระบบแพลตฟอร์มแชร์ความรู้
- **Member**: ผู้ใช้งานทั่วไปที่ผ่านการยืนยันตัวตนแล้ว
- **Moderator**: เจ้าหน้าที่ตรวจสอบเนื้อหาที่มีสิทธิ์พิเศษในการจัดการโพสต์
- **Admin**: ผู้ดูแลระบบที่มีสิทธิ์สูงสุดในการจัดการบทบาทผู้ใช้งาน
- **Post**: โพสต์หรือบทความที่ผู้ใช้งานสร้างขึ้น
- **Access_Token**: โทเค็นสำหรับการยืนยันตัวตนที่ได้จาก Google OAuth
- **Coin**: เหรียญรางวัลที่ใช้แลกซื้อไอเทมในระบบ
- **Badge**: เหรียญตราหรือความสำเร็จที่ผู้ใช้งานได้รับ
- **Quest**: ภารกิจที่ผู้ใช้งานสามารถทำเพื่อรับรางวัล
- **Achievement**: ความสำเร็จระยะยาวที่ปลดล็อกเมื่อทำตามเงื่อนไข
- **Bookmark**: การบันทึกโพสต์ไว้เพื่ออ่านภายหลัง
- **Report**: การรายงานโพสต์ที่ไม่เหมาะสม
- **Soft_Delete**: การลบข้อมูลโดยไม่ลบออกจากฐานข้อมูลแต่ซ่อนจากการแสดงผล

## Requirements

### Requirement 1: การยืนยันตัวตนผ่าน Google OAuth

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการเข้าสู่ระบบด้วยบัญชี Google เพื่อความสะดวกและปลอดภัย

#### Acceptance Criteria

1. WHEN a user initiates login, THE System SHALL redirect to Google OAuth 2.0 authentication page
2. WHEN Google authentication succeeds, THE System SHALL receive an Access_Token from Google
3. WHEN the System receives an Access_Token, THE System SHALL retrieve user profile information from Google
4. WHEN user profile is retrieved successfully, THE System SHALL create or update user account in the database
5. WHEN authentication fails, THE System SHALL display an error message and prevent system access
6. WHEN a user requests logout, THE System SHALL invalidate the Access_Token and clear session data

### Requirement 2: การจัดการบทบาทผู้ใช้งาน

**User Story:** ในฐานะ Admin ฉันต้องการกำหนดบทบาทผู้ใช้งาน เพื่อควบคุมสิทธิ์การเข้าถึงฟังก์ชันต่างๆ

#### Acceptance Criteria

1. WHEN an Admin assigns a Moderator role to a user, THE System SHALL update the user role to Moderator
2. WHEN an Admin removes a Moderator role from a user, THE System SHALL update the user role to Member
3. WHEN a user role is updated, THE System SHALL apply the new permissions immediately
4. THE System SHALL restrict role assignment functionality to Admin users only

### Requirement 3: การสร้างและจัดการโพสต์

**User Story:** ในฐานะ Member ฉันต้องการสร้างและจัดการโพสต์ของตนเอง เพื่อแบ่งปันความรู้กับผู้อื่น

#### Acceptance Criteria

1. WHEN a Member creates a post, THE System SHALL require cover image, title, description, education level, and content
2. WHEN a Member creates a post, THE System SHALL allow optional tags and content images
3. WHEN a Member attempts to create a post, THE System SHALL check if the user has created fewer than 3 posts in the last 24 hours
4. IF a Member has created 3 or more posts in the last 24 hours, THEN THE System SHALL reject the new post creation and display a rate limit message
5. WHEN a Member edits a post, THE System SHALL verify that the user is the post owner
6. WHEN a Member deletes their own post, THE System SHALL perform a Soft_Delete and hide the post from public view
7. WHEN a non-owner attempts to edit a post, THE System SHALL reject the request

### Requirement 4: ระบบรายงานและตรวจสอบโพสต์

**User Story:** ในฐานะ Member ฉันต้องการรายงานโพสต์ที่ไม่เหมาะสม เพื่อรักษาคุณภาพของเนื้อหาในแพลตฟอร์ม

#### Acceptance Criteria

1. WHEN a Member reports a post, THE System SHALL record the report with the user ID and post ID
2. WHEN a Member attempts to report the same post again, THE System SHALL reject the duplicate report
3. WHEN a post receives 10 unique reports, THE System SHALL automatically change the post status to unactived and hide it from public view
4. WHEN a post status changes to unactived, THE System SHALL send a notification to all Moderators
5. WHEN a Moderator views reported posts, THE System SHALL display all posts with unactived status or with reports
6. WHEN a Moderator performs Soft_Delete on a post, THE System SHALL hide the post permanently from public view
7. WHEN a Moderator restores a post, THE System SHALL change the status back to active and make it visible to users

### Requirement 5: การแสดงโพสต์ยอดนิยม

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการดูโพสต์ยอดนิยม เพื่อค้นหาเนื้อหาที่น่าสนใจ

#### Acceptance Criteria

1. WHEN a user views the popular posts section, THE System SHALL display posts sorted by like count in descending order
2. WHEN a user views a post, THE System SHALL increment the view counter by 1
3. WHEN displaying posts, THE System SHALL show the total view count for each post
4. THE System SHALL exclude posts with unactived status from popular posts display

### Requirement 6: ระบบเหรียญและร้านค้า

**User Story:** ในฐานะ Member ฉันต้องการใช้เหรียญแลกซื้อไอเทม เพื่อตกแต่งโปรไฟล์ของตนเอง

#### Acceptance Criteria

1. WHEN a Member views the shop, THE System SHALL display all available items with their coin prices
2. WHEN a Member purchases an item, THE System SHALL verify that the user has sufficient coins
3. IF a Member has insufficient coins, THEN THE System SHALL reject the purchase and display an error message
4. WHEN a purchase is successful, THE System SHALL deduct the coin amount and add the item to the user inventory
5. WHEN a Member attempts to purchase an already owned item, THE System SHALL reject the purchase
6. WHEN a Member selects an item from inventory, THE System SHALL apply the item to the user profile
7. THE System SHALL display current coin balance before and after each transaction
8. THE System SHALL ensure atomic transactions to prevent duplicate coin deductions

### Requirement 7: การค้นหาและกรองโพสต์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการค้นหาและกรองโพสต์ เพื่อหาเนื้อหาที่ตรงกับความสนใจ

#### Acceptance Criteria

1. WHEN a user enters a search query, THE System SHALL search posts by title and tags
2. WHEN a user selects an education level filter, THE System SHALL display only posts matching that education level
3. WHEN displaying search results, THE System SHALL support sorting by popularity, publish date, or view count
4. THE System SHALL exclude posts with unactived status from search results
5. WHEN no results are found, THE System SHALL display a message indicating no matching posts

### Requirement 8: ระบบการแจ้งเตือน

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการรับการแจ้งเตือน เพื่อติดตามกิจกรรมที่เกี่ยวข้องกับฉัน

#### Acceptance Criteria

1. WHEN another user comments on a Member's post, THE System SHALL send a notification to the post owner
2. WHEN another user likes a Member's post, THE System SHALL send a notification to the post owner
3. WHEN a Member's reported post status changes, THE System SHALL send a notification to the post owner
4. WHEN a post reaches 10 reports and becomes unactived, THE System SHALL send notifications to all Moderators
5. WHEN a followed user creates a new post, THE System SHALL send a notification to all followers
6. THE System SHALL store notifications in the database for later retrieval
7. WHEN a user views notifications, THE System SHALL mark them as read

### Requirement 9: การติดตามผู้ใช้งาน

**User Story:** ในฐานะ Member ฉันต้องการติดตามผู้ใช้งานที่สนใจ เพื่อรับการแจ้งเตือนเมื่อมีโพสต์ใหม่

#### Acceptance Criteria

1. WHEN a Member follows another user, THE System SHALL create a follow relationship in the database
2. WHEN a Member unfollows a user, THE System SHALL remove the follow relationship
3. WHEN a followed user creates a new post, THE System SHALL trigger notifications to all followers
4. WHEN a Member attempts to follow the same user again, THE System SHALL reject the duplicate follow request
5. THE System SHALL display follower and following counts on user profiles

### Requirement 10: การบุ๊กมาร์กโพสต์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการบันทึกโพสต์ที่สนใจ เพื่ออ่านภายหลัง

#### Acceptance Criteria

1. WHEN a user bookmarks a post, THE System SHALL add the post to the user's bookmark list
2. WHEN a user removes a bookmark, THE System SHALL delete the bookmark from the list and send a notification
3. WHEN a user views their bookmarks, THE System SHALL display all bookmarked posts
4. WHEN a user attempts to bookmark the same post again, THE System SHALL reject the duplicate bookmark
5. THE System SHALL allow users to bookmark posts regardless of post status

### Requirement 11: ระบบภารกิจรายวัน

**User Story:** ในฐานะ Member ฉันต้องการทำภารกิจรายวัน เพื่อรับเหรียญรางวัล

#### Acceptance Criteria

1. THE System SHALL generate daily quests for creating posts, commenting, and liking posts
2. WHEN a Member completes a quest objective, THE System SHALL mark the quest as completable
3. WHEN a Member claims quest rewards, THE System SHALL verify the quest is completed
4. IF a quest is not completed, THEN THE System SHALL reject the reward claim
5. WHEN quest rewards are claimed, THE System SHALL add coins to the user account and mark the quest as claimed
6. WHEN 24 hours pass since quest generation, THE System SHALL reset all daily quests
7. WHEN a Member attempts to claim rewards for an already claimed quest, THE System SHALL reject the request

### Requirement 12: ระบบความสำเร็จ

**User Story:** ในฐานะ Member ฉันต้องการปลดล็อกความสำเร็จ เพื่อรับรางวัลและแสดงความก้าวหน้า

#### Acceptance Criteria

1. WHEN a Member meets achievement criteria, THE System SHALL unlock the achievement automatically
2. WHEN an achievement is unlocked, THE System SHALL award coins to the user immediately
3. WHEN an achievement is unlocked, THE System SHALL send a notification to the user
4. WHEN an achievement is unlocked, THE System SHALL award the associated badge to the user
5. THE System SHALL track progress toward achievements continuously
6. WHEN a user views achievements, THE System SHALL display both locked and unlocked achievements with progress

### Requirement 13: การจัดการโปรไฟล์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการแก้ไขโปรไฟล์ เพื่ออัพเดทข้อมูลส่วนตัว

#### Acceptance Criteria

1. WHEN a user updates their nickname, THE System SHALL verify the nickname is unique across all users
2. IF a nickname is already taken, THEN THE System SHALL reject the update and display an error message
3. WHEN a user updates their profile picture, THE System SHALL validate the file format is JPG or PNG
4. WHEN a user updates their bio, THE System SHALL enforce a maximum length of 512 characters
5. IF bio exceeds 512 characters, THEN THE System SHALL reject the update and display an error message
6. WHEN a user selects a profile theme, THE System SHALL verify the theme is in the user's inventory
7. WHEN profile updates are saved, THE System SHALL persist changes to the database and display updated information
8. WHEN a user updates education level, THE System SHALL accept only valid education levels (มัธยมศึกษาตอนต้น, มัธยมศึกษาตอนปลาย, มหาวิทยาลัย)

### Requirement 14: การโต้ตอบกับโพสต์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการโต้ตอบกับโพสต์ เพื่อแสดงความคิดเห็นและความชื่นชอบ

#### Acceptance Criteria

1. WHEN a user likes a post, THE System SHALL increment the post like count by 1
2. WHEN a user unlikes a post, THE System SHALL decrement the post like count by 1
3. WHEN a user attempts to like the same post again, THE System SHALL treat it as unlike
4. WHEN a user comments on a post, THE System SHALL save the comment with timestamp and user information
5. WHEN a comment is saved, THE System SHALL trigger a notification to the post owner
6. THE System SHALL display comments in chronological order on the post detail page

### Requirement 15: การจัดการไฟล์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการอัพโหลดไฟล์ เพื่อเพิ่มเนื้อหาให้โพสต์

#### Acceptance Criteria

1. WHEN a user uploads a file, THE System SHALL validate the file format is PDF, JPG, or PNG
2. IF file format is invalid, THEN THE System SHALL reject the upload and display an error message
3. WHEN a valid file is uploaded, THE System SHALL store the file and return a file reference
4. THE System SHALL associate uploaded files with the corresponding post or profile
5. WHEN a post is deleted, THE System SHALL maintain file references for potential restoration

### Requirement 16: Responsive Design

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการใช้งานระบบบนอุปกรณ์ต่างๆ เพื่อความสะดวก

#### Acceptance Criteria

1. WHEN the System is accessed from a desktop computer, THE System SHALL display the full desktop layout
2. WHEN the System is accessed from a tablet, THE System SHALL adapt the layout for tablet screen size
3. WHEN the System is accessed from a smartphone, THE System SHALL adapt the layout for mobile screen size
4. THE System SHALL maintain functionality across all supported device types

### Requirement 17: ความปลอดภัยและการควบคุมสิทธิ์

**User Story:** ในฐานะผู้ดูแลระบบ ฉันต้องการควบคุมสิทธิ์การเข้าถึง เพื่อรักษาความปลอดภัยของระบบ

#### Acceptance Criteria

1. THE System SHALL require authentication for all protected endpoints
2. WHEN an unauthenticated user attempts to access protected resources, THE System SHALL reject the request with 401 status
3. WHEN a user attempts to perform an action without sufficient permissions, THE System SHALL reject the request with 403 status
4. THE System SHALL validate user permissions before executing any privileged operation
5. THE System SHALL implement rate limiting to prevent spam and bot activities
6. WHEN rate limits are exceeded, THE System SHALL reject requests and display appropriate error messages

### Requirement 18: ประสิทธิภาพของระบบ

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการระบบที่ตอบสนองรวดเร็ว เพื่อประสบการณ์การใช้งานที่ดี

#### Acceptance Criteria

1. WHEN a user loads a page, THE System SHALL respond within 3 seconds under normal load
2. WHEN a user performs a search, THE System SHALL return results within 2 seconds
3. WHEN a user uploads an image, THE System SHALL process and confirm upload within 5 seconds
4. THE System SHALL handle concurrent users without significant performance degradation

### Requirement 19: ความเสถียรของข้อมูล

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการมั่นใจว่าข้อมูลของฉันปลอดภัย เพื่อไม่สูญหายจากข้อผิดพลาด

#### Acceptance Criteria

1. WHEN a database transaction fails, THE System SHALL rollback all changes to maintain data consistency
2. WHEN a user performs an action, THE System SHALL ensure atomic operations to prevent partial updates
3. THE System SHALL maintain referential integrity between related data entities
4. WHEN system errors occur, THE System SHALL log errors without exposing sensitive information to users

### Requirement 20: การดูแลรักษาระบบ

**User Story:** ในฐานะนักพัฒนา ฉันต้องการโค้ดที่เป็นระเบียบ เพื่อง่ายต่อการดูแลรักษา

#### Acceptance Criteria

1. THE System SHALL follow consistent coding standards and naming conventions
2. THE System SHALL separate concerns between presentation, business logic, and data layers
3. THE System SHALL include comprehensive error handling and logging
4. THE System SHALL document all public APIs and interfaces

### Requirement 21: ความเข้ากันได้ของเบราว์เซอร์

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการใช้งานระบบบนเบราว์เซอร์ที่ฉันชอบ เพื่อความสะดวก

#### Acceptance Criteria

1. THE System SHALL function correctly on Google Chrome (latest version)
2. THE System SHALL function correctly on Mozilla Firefox (latest version)
3. THE System SHALL function correctly on Safari (latest version)
4. THE System SHALL function correctly on Microsoft Edge (latest version)
5. THE System SHALL not require any browser plugins or extensions

### Requirement 22: การออกแบบที่เข้าถึงได้

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการอินเทอร์เฟซที่อ่านง่าย เพื่อใช้งานได้สะดวก

#### Acceptance Criteria

1. THE System SHALL use readable font sizes (minimum 14px for body text)
2. THE System SHALL provide sufficient color contrast between text and background
3. THE System SHALL organize UI elements in a logical and consistent manner
4. THE System SHALL provide clear visual feedback for user interactions
5. THE System SHALL use intuitive icons and labels for navigation
