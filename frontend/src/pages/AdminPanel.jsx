import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-avatar.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      // Note: This endpoint might need to be created in the backend
      const response = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 403) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, currentRole, userName) => {
    const roles = ['user', 'moderator', 'admin'];
    const roleLabels = {
      user: 'ผู้ใช้ทั่วไป',
      moderator: 'ผู้ดูแล',
      admin: 'ผู้ดูแลระบบ'
    };

    const newRole = prompt(
      `เปลี่ยนบทบาทของ ${userName}\n\nบทบาทปัจจุบัน: ${roleLabels[currentRole]}\n\nเลือกบทบาทใหม่:\n- user (ผู้ใช้ทั่วไป)\n- moderator (ผู้ดูแล)\n- admin (ผู้ดูแลระบบ)`,
      currentRole
    );

    if (!newRole || newRole === currentRole) {
      return;
    }

    if (!roles.includes(newRole)) {
      alert('บทบาทไม่ถูกต้อง กรุณาเลือก user, moderator หรือ admin');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('เปลี่ยนบทบาทสำเร็จ');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถเปลี่ยนบทบาทได้');
      }
    } catch (err) {
      console.error('Failed to change role:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      moderator: 'bg-purple-100 text-purple-700',
      user: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || colors.user;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'ผู้ดูแลระบบ',
      moderator: 'ผู้ดูแล',
      user: 'ผู้ใช้ทั่วไป'
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(user =>
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการผู้ใช้</h1>
        <p className="text-gray-600">ผู้ใช้ทั้งหมด {users.length} คน</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="ค้นหาผู้ใช้ (ชื่อเล่น, อีเมล)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหรียญ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={getImageUrl(user.profile_picture)}
                        alt={user.nickname}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.nickname || 'ไม่มีชื่อเล่น'}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">🪙 {user.coins || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleChangeRole(user.id, user.role, user.nickname)}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                    >
                      เปลี่ยนบทบาท
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ไม่พบผู้ใช้
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
