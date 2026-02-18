# Google OAuth Setup Guide - แก้ไขปัญหา "การเข้าถึงถูกบล็อก"

## ปัญหา
เมื่อพยายาม login ด้วย Google OAuth จะพบข้อความ:
```
การเข้าถึงถูกบล็อก: คำขอของแอปนี้ไม่ถูกต้อง
```

## สาเหตุ
ปัญหานี้เกิดจากการตั้งค่า Google Cloud Console ที่ไม่ถูกต้อง โดยเฉพาะ:
1. Authorized Redirect URIs ไม่ตรงกับที่ระบุในโค้ด
2. OAuth Consent Screen ไม่ได้ตั้งค่าอย่างถูกต้อง
3. Test users ไม่ได้ถูกเพิ่มเข้าไป (ถ้าอยู่ในโหมด Testing)

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตั้งค่า Google Cloud Console

#### 1.1 เข้าสู่ Google Cloud Console
1. ไปที่ https://console.cloud.google.com/
2. เลือก Project ของคุณ (หรือสร้างใหม่ถ้ายังไม่มี)

#### 1.2 เปิดใช้งาน Google+ API
1. ไปที่ **APIs & Services** > **Library**
2. ค้นหา "Google+ API"
3. คลิก **Enable**

#### 1.3 ตั้งค่า OAuth Consent Screen
1. ไปที่ **APIs & Services** > **OAuth consent screen**
2. เลือก **External** (สำหรับ testing)
3. กรอกข้อมูล:
   - **App name**: Knowledge Sharing Platform
   - **User support email**: อีเมลของคุณ
   - **Developer contact information**: อีเมลของคุณ
4. คลิก **Save and Continue**

5. ในหน้า **Scopes**:
   - คลิก **Add or Remove Scopes**
   - เลือก:
     - `openid`
     - `email`
     - `profile`
   - คลิก **Update** แล้ว **Save and Continue**

6. ในหน้า **Test users** (สำคัญมาก!):
   - คลิก **Add Users**
   - เพิ่มอีเมล Google ที่คุณจะใช้ทดสอบ
   - คลิก **Add** แล้ว **Save and Continue**

7. คลิก **Back to Dashboard**

#### 1.4 สร้าง OAuth 2.0 Client ID
1. ไปที่ **APIs & Services** > **Credentials**
2. คลิก **Create Credentials** > **OAuth client ID**
3. เลือก **Application type**: Web application
4. กรอกข้อมูล:
   - **Name**: Knowledge Sharing Platform Web Client

5. **Authorized JavaScript origins** เพิ่ม:
   ```
   http://localhost:3000
   http://localhost:5173
   ```

6. **Authorized redirect URIs** เพิ่ม:
   ```
   http://localhost:3000/api/auth/callback
   ```

7. คลิก **Create**
8. คัดลอก **Client ID** และ **Client Secret**

### ขั้นตอนที่ 2: อัพเดท .env File

แก้ไขไฟล์ `backend/.env`:

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

⚠️ **สำคัญ**: แทนที่ `YOUR_NEW_CLIENT_ID_HERE` และ `YOUR_NEW_CLIENT_SECRET_HERE` ด้วยค่าที่คัดลอกมาจาก Google Cloud Console

### ขั้นตอนที่ 3: Restart Server

```bash
# หยุด server ที่กำลังรันอยู่ (Ctrl+C)

# Restart backend
cd backend
npm start

# Restart frontend (ในหน้าต่างใหม่)
cd frontend
npm run dev
```

### ขั้นตอนที่ 4: ทดสอบ Login

1. เปิดเบราว์เซอร์ไปที่ http://localhost:5173
2. คลิกปุ่ม Login
3. เลือกบัญชี Google ที่คุณเพิ่มใน Test users
4. อนุญาตการเข้าถึง
5. คุณควรจะถูก redirect กลับมาที่แอปพร้อม login สำเร็จ

## การแก้ปัญหาเพิ่มเติม

### ปัญหา: ยังคงเห็นข้อความ "การเข้าถึงถูกบล็อก"

**วิธีแก้**:
1. ตรวจสอบว่าอีเมลที่ใช้ login อยู่ใน Test users list
2. ลองล้าง browser cache และ cookies
3. ลอง login ในโหมด Incognito/Private
4. ตรวจสอบว่า Redirect URI ตรงกันทุกที่:
   - Google Cloud Console
   - backend/.env
   - authService.js

### ปัญหา: redirect_uri_mismatch

**วิธีแก้**:
ตรวจสอบว่า URL ใน Google Cloud Console ตรงกับที่ระบุใน `.env`:
```
http://localhost:3000/api/auth/callback
```

ไม่ใช่:
- `http://localhost:3000/auth/callback` (ขาด /api)
- `https://localhost:3000/api/auth/callback` (ใช้ https แทน http)
- `http://localhost:3000/api/auth/callback/` (มี / ต่อท้าย)

### ปัญหา: invalid_client

**วิธีแก้**:
1. ตรวจสอบว่า Client ID และ Client Secret ถูกต้อง
2. ตรวจสอบว่าไม่มีช่องว่างหรืออักขระพิเศษที่คัดลอกมาด้วย
3. ลองสร้าง OAuth Client ID ใหม่

### ปัญหา: access_denied

**วิธีแก้**:
1. ตรวจสอบว่าผู้ใช้อนุญาตการเข้าถึง
2. ตรวจสอบว่า scopes ที่ขอไม่เกินที่อนุญาต
3. ตรวจสอบว่าแอปไม่ถูก suspend ใน Google Cloud Console

## สำหรับ Production

เมื่อพร้อม deploy:

1. **เปลี่ยน OAuth Consent Screen เป็น Published**:
   - ไปที่ OAuth consent screen
   - คลิก **Publish App**
   - ส่งคำขอ verification (ถ้าจำเป็น)

2. **อัพเดท Authorized URIs**:
   ```
   https://yourdomain.com
   https://yourdomain.com/api/auth/callback
   ```

3. **อัพเดท .env สำหรับ Production**:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/callback
   FRONTEND_URL=https://yourdomain.com
   ```

4. **ใช้ HTTPS เท่านั้น** (Google OAuth ต้องการ HTTPS สำหรับ production)

## เอกสารอ้างอิง

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [OAuth Consent Screen](https://support.google.com/cloud/answer/10311615)

## ติดต่อ

หากยังพบปัญหา:
1. ตรวจสอบ console logs ใน browser (F12)
2. ตรวจสอบ backend logs
3. ตรวจสอบว่า environment variables โหลดถูกต้อง

---

**หมายเหตุ**: ไฟล์นี้สร้างขึ้นเพื่อช่วยแก้ปัญหา Google OAuth authentication ใน Knowledge Sharing Platform
