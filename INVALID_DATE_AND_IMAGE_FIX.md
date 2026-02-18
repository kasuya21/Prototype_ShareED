# แก้ไข Invalid Date และรูปภาพไม่แสดง

## ปัญหาที่พบ
1. **Invalid Date**: วันที่แสดงเป็น "Invalid Date" เนื่องจากไม่มีการตรวจสอบค่า null/undefined ก่อนแปลงเป็น Date object
2. **รูปภาพไม่แสดง**: รูปภาพไม่แสดงเนื่องจาก URL ไม่สมบูรณ์ (ขาด backend URL prefix)

## การแก้ไข

### 1. แก้ไขปัญหา Invalid Date
เพิ่มฟังก์ชัน `formatDate` และ `formatTimeAgo` ที่มีการตรวจสอบค่า null/undefined และ handle error ในทุกไฟล์ที่แสดงวันที่:

**ไฟล์ที่แก้ไข:**
- `frontend/src/components/PostCard.jsx` - เพิ่มการแสดงวันที่สร้างโพสต์
- `frontend/src/pages/PostDetail.jsx` - แก้ไขการแสดงวันที่โพสต์และคอมเมนต์
- `frontend/src/pages/Quests.jsx` - แก้ไขการแสดงวันหมดอายุของภารกิจ
- `frontend/src/pages/Notifications.jsx` - แก้ไขการแสดงเวลาการแจ้งเตือน
- `frontend/src/components/NotificationDropdown.jsx` - แก้ไขการแสดงเวลาการแจ้งเตือน

**ตัวอย่างโค้ด:**
```javascript
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return '';
  }
};
```

### 2. แก้ไขปัญหารูปภาพไม่แสดง
เพิ่มฟังก์ชัน `getImageUrl` ที่แปลง relative path เป็น absolute URL และเพิ่ม error handler สำหรับรูปภาพ:

**ไฟล์ที่แก้ไข:**
- `frontend/src/components/PostCard.jsx` - รูปปกโพสต์และรูปโปรไฟล์ผู้เขียน
- `frontend/src/pages/PostDetail.jsx` - รูปปกโพสต์และรูปโปรไฟล์ในคอมเมนต์
- `frontend/src/pages/ModerationDashboard.jsx` - รูปปกโพสต์ที่ถูกรายงาน
- `frontend/src/pages/AdminPanel.jsx` - รูปโปรไฟล์ผู้ใช้
- `frontend/src/components/Navbar.jsx` - รูปโปรไฟล์ในเมนู
- `frontend/src/pages/Profile.jsx` - รูปโปรไฟล์ผู้ใช้

**ตัวอย่างโค้ด:**
```javascript
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-image.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:3000${imagePath}`;
};
```

**การใช้งาน:**
```jsx
<img
  src={getImageUrl(post.cover_image || post.coverImage)}
  alt={post.title}
  className="w-full h-full object-cover"
  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
/>
```

## คุณสมบัติที่เพิ่มเข้ามา

### PostCard Component
- เพิ่มการแสดงวันที่สร้างโพสต์ (ด้านล่างแท็ก)
- รองรับทั้ง `cover_image` และ `coverImage` (snake_case และ camelCase)
- รองรับทั้ง `author_picture` และ `profilePicture`

### Error Handling
- ทุกรูปภาพมี `onError` handler ที่จะแสดงรูป placeholder เมื่อโหลดรูปไม่สำเร็จ
- ทุกฟังก์ชันแสดงวันที่มี try-catch เพื่อป้องกัน crash
- ตรวจสอบค่า null/undefined ก่อนแปลงเป็น Date object

## การทดสอบ
1. ตรวจสอบว่าวันที่แสดงถูกต้องในทุกหน้า
2. ตรวจสอบว่ารูปภาพแสดงถูกต้อง (รูปปกโพสต์, รูปโปรไฟล์)
3. ตรวจสอบว่า placeholder แสดงเมื่อรูปภาพโหลดไม่สำเร็จ
4. ตรวจสอบว่าไม่มี "Invalid Date" แสดงในหน้าใดๆ

## หมายเหตุ
- Backend ให้บริการไฟล์ static ที่ `/uploads` endpoint (ดูใน `backend/src/server.js`)
- รูปภาพจาก database เก็บเป็น relative path เช่น `/uploads/filename.jpg`
- Frontend ต้องแปลงเป็น absolute URL: `http://localhost:3000/uploads/filename.jpg`
