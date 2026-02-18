# แก้ไข Post Not Found Error

## ปัญหาที่พบ
```
Error fetching post: NotFoundError: Post not found
```

เกิดจากการพยายามเข้าถึงโพสต์ที่:
1. ไม่มีอยู่ในฐานข้อมูล
2. ถูกลบไปแล้ว (status = 'deleted')
3. ID ไม่ถูกต้อง (undefined, null, หรือ invalid)

## การแก้ไข

### 1. Backend - postService.js
เพิ่มการตรวจสอบสถานะโพสต์ที่ถูกลบ:

```javascript
export async function getPost(postId) {
  const post = db.prepare(`
    SELECT p.*, u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if post is deleted
  if (post.status === 'deleted') {
    throw new NotFoundError('Post has been deleted');
  }

  return { ... };
}
```

### 2. Frontend - PostDetail.jsx
ปรับปรุง error handling ให้แสดงข้อความที่เหมาะสม:

```javascript
const fetchPost = async () => {
  try {
    // Check if ID exists
    if (!id) {
      setError('ไม่พบ ID ของโพสต์');
      setLoading(false);
      return;
    }

    const token = getToken();
    const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 404) {
      setError('ไม่พบโพสต์นี้ อาจถูกลบหรือไม่มีอยู่ในระบบ');
      setLoading(false);
      return;
    }

    if (!response.ok) {
      throw new Error('ไม่สามารถโหลดโพสต์ได้');
    }
    
    const data = await response.json();
    setPost(data.post);
  } catch (err) {
    console.error('Error fetching post:', err);
    setError(err.message || 'เกิดข้อผิดพลาดในการโหลดโพสต์');
  } finally {
    setLoading(false);
  }
};
```

## สาเหตุที่เป็นไปได้

1. **URL ไม่ถูกต้อง**: ผู้ใช้พิมพ์ URL ผิด เช่น `/posts/undefined` หรือ `/posts/abc123`
2. **โพสต์ถูกลบ**: โพสต์ที่เคยมีอยู่ถูกลบไปแล้ว แต่ผู้ใช้ยังมี link เก่า
3. **Database ว่างเปล่า**: ยังไม่มีโพสต์ในระบบ
4. **Routing ผิดพลาด**: การ navigate ไปยังหน้าโพสต์ไม่ส่ง ID ที่ถูกต้อง

## วิธีตรวจสอบ

### ตรวจสอบโพสต์ในฐานข้อมูล:
```bash
sqlite3 backend/data/database.sqlite "SELECT id, title, status FROM posts;"
```

### ตรวจสอบจำนวนโพสต์ที่ active:
```bash
sqlite3 backend/data/database.sqlite "SELECT COUNT(*) FROM posts WHERE status = 'active';"
```

### ทดสอบ API โดยตรง:
```bash
curl http://localhost:3000/api/posts/[POST_ID]
```

## การป้องกัน

1. **ตรวจสอบ ID ก่อนส่ง request**: ใน PostCard component ตรวจสอบว่า `post.id` มีค่าก่อน render Link
2. **แสดง error message ที่เหมาะสม**: ให้ผู้ใช้รู้ว่าเกิดอะไรขึ้นและทำอย่างไรต่อ
3. **เพิ่ม fallback**: ถ้าโพสต์ไม่พบ redirect กลับไปหน้า PostList
4. **Log errors**: บันทึก error เพื่อ debug ในอนาคต

## ผลลัพธ์

- ✅ แสดงข้อความ error ที่เข้าใจง่ายเป็นภาษาไทย
- ✅ ตรวจสอบโพสต์ที่ถูกลบและแสดงข้อความที่เหมาะสม
- ✅ ตรวจสอบ ID ก่อนส่ง request
- ✅ มีปุ่มกลับไปหน้าโพสต์เมื่อเกิด error
