import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    education_level: '',
    profile_picture: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          nickname: data.user.nickname || '',
          bio: data.user.bio || '',
          education_level: data.user.education_level || '',
          profile_picture: null
        });
        setPreviewImage(data.user.profile_picture);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น');
        return;
      }
      
      setFormData(prev => ({ ...prev, profile_picture: file }));
      setPreviewImage(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate bio length
    if (formData.bio.length > 512) {
      setError('ประวัติต้องไม่เกิน 512 ตัวอักษร');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = getToken();
      
      // Upload profile picture if changed
      let profilePictureUrl = user.profile_picture;
      if (formData.profile_picture) {
        const fileFormData = new FormData();
        fileFormData.append('file', formData.profile_picture);
        
        const uploadResponse = await fetch('http://localhost:3000/api/files/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profilePictureUrl = uploadData.url;
        }
      }

      // Update profile
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          bio: formData.bio,
          education_level: formData.education_level,
          profile_picture: profilePictureUrl
        })
      });

      if (response.ok) {
        alert('อัพเดทโปรไฟล์สำเร็จ!');
        navigate(`/profile/${user.id}`);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'ไม่สามารถอัพเดทโปรไฟล์ได้');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แก้ไขโปรไฟล์</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Picture */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            รูปโปรไฟล์
          </label>
          <div className="flex items-center gap-4">
            <img
              src={previewImage || '/default-avatar.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">JPG หรือ PNG เท่านั้น</p>
            </div>
          </div>
        </div>

        {/* Nickname */}
        <div className="mb-6">
          <label htmlFor="nickname" className="block text-gray-700 font-medium mb-2">
            ชื่อเล่น <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="ชื่อเล่นของคุณ"
          />
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
            ประวัติ
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows="4"
            maxLength="512"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="เกี่ยวกับคุณ..."
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.bio.length} / 512 ตัวอักษร
          </p>
        </div>

        {/* Education Level */}
        <div className="mb-6">
          <label htmlFor="education_level" className="block text-gray-700 font-medium mb-2">
            ระดับการศึกษา
          </label>
          <select
            id="education_level"
            name="education_level"
            value={formData.education_level}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">เลือกระดับการศึกษา</option>
            <option value="junior_high">มัธยมต้น</option>
            <option value="senior_high">มัธยมปลาย</option>
            <option value="university">มหาวิทยาลัย</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/profile/${user.id}`)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;
