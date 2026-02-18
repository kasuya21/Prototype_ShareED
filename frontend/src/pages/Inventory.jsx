import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = getToken();
      
      // Get current user
      const userResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserId(userData.user.id);

        // Fetch inventory
        const inventoryResponse = await fetch(
          `http://localhost:3000/api/users/${userData.user.id}/inventory`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setInventory(inventoryData.inventory);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (itemId, itemName) => {
    if (!confirm(`ต้องการใช้งาน ${itemName}?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/api/users/${userId}/inventory/${itemId}/activate`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('เปิดใช้งานสำเร็จ!');
        fetchInventory(); // Refresh inventory
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถเปิดใช้งานได้');
      }
    } catch (err) {
      console.error('Failed to activate item:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      theme: 'ธีม',
      badge: 'ตราสัญลักษณ์',
      frame: 'กรอบรูป'
    };
    return labels[type] || type;
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">คลังไอเทม</h1>
        <p className="text-gray-600">
          ไอเทมทั้งหมด {inventory.length} ชิ้น
        </p>
      </div>

      {Object.keys(groupedInventory).length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg">คลังของคุณว่างเปล่า</p>
          <p className="text-gray-400 text-sm mt-2">ไปซื้อไอเทมจากร้านค้ากันเถอะ!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedInventory).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {type === 'theme' && '🎨'}
                {type === 'badge' && '🏅'}
                {type === 'frame' && '🖼️'}
                {getItemTypeLabel(type)}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden ${
                      item.is_active ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    {/* Item Preview */}
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                      <div className="text-5xl">
                        {type === 'theme' && '🎨'}
                        {type === 'badge' && '🏅'}
                        {type === 'frame' && '🖼️'}
                      </div>
                      {item.is_active && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ใช้งานอยู่
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>

                      {!item.is_active && (
                        <button
                          onClick={() => handleActivate(item.id, item.name)}
                          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          ใช้งาน
                        </button>
                      )}

                      {item.is_active && (
                        <div className="text-center text-green-600 font-medium">
                          ✓ กำลังใช้งาน
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Inventory;
