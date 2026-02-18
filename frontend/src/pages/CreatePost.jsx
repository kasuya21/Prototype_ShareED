import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

function CreatePost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    educationLevel: 'junior_high',
    tags: '',
    coverImage: null,
    contentImages: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    try {
      const token = getToken();
      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await fetch('http://localhost:3000/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, coverImage: data.file.fileUrl }));
      }
    } catch (err) {
      console.error('Failed to upload cover image:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate cover image
      if (!formData.coverImage) {
        throw new Error('กรุณาอัพโหลดรูปปกก่อนสร้างโพสต์');
      }

      const token = getToken();
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          educationLevel: formData.educationLevel,
          tags,
          coverImage: formData.coverImage,
          contentImages: formData.contentImages
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create post');
      }

      const data = await response.json();
      navigate(`/posts/${data.post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">สร้างโพสต์ใหม่</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รูปปก <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleCoverImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required
          />
          {coverPreview && (
            <img src={coverPreview} alt="Preview" className="mt-2 h-48 object-cover rounded" />
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หัวข้อ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำอธิบายสั้น <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="2"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Education Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ระดับการศึกษา <span className="text-red-500">*</span>
          </label>
          <select
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="junior_high">มัธยมศึกษาตอนต้น</option>
            <option value="senior_high">มัธยมศึกษาตอนปลาย</option>
            <option value="university">มหาวิทยาลัย</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            แท็ก (คั่นด้วยเครื่องหมายจุลภาค)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์, ฟิสิกส์"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เนื้อหา <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="10"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างโพสต์'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
