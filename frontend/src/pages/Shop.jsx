import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

function Shop() {
  const [items, setItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const token = getToken();
      
      // Fetch shop items
      const itemsResponse = await fetch('http://localhost:3000/api/shop/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch user profile for coins
      const userResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (itemsResponse.ok && userResponse.ok) {
        const itemsData = await itemsResponse.json();
        const userData = await userResponse.json();
        
        setItems(itemsData.items);
        setUserCoins(userData.user.coins || 0);
      }
    } catch (err) {
      console.error('Failed to fetch shop data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId, itemPrice, itemName) => {
    if (userCoins < itemPrice) {
      alert('เหรียญไม่เพียงพอ!');
      return;
    }

    if (!confirm(`ต้องการซื้อ ${itemName} ในราคา ${itemPrice} เหรียญ?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item_id: itemId })
      });

      if (response.ok) {
        alert('ซื้อสำเร็จ!');
        fetchShopData(); // Refresh data
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถซื้อได้');
      }
    } catch (err) {
      console.error('Failed to purchase:', err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with Coin Balance */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ร้านค้า</h1>
          <p className="text-gray-600">ซื้อไอเทมเพื่อตกแต่งโปรไฟล์</p>
        </div>
        <div className="bg-yellow-100 px-6 py-3 rounded-lg">
          <div className="text-sm text-gray-600">เหรียญของคุณ</div>
          <div className="text-2xl font-bold text-yellow-700">
            🪙 {userCoins}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const canAfford = userCoins >= item.price;

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Item Preview */}
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-6xl">
                  {item.type === 'theme' && '🎨'}
                  {item.type === 'badge' && '🏅'}
                  {item.type === 'frame' && '🖼️'}
                </div>
              </div>

              {/* Item Details */}
              <div className="p-4">
                {/* Type Badge */}
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {getItemTypeLabel(item.type)}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4">
                  {item.description}
                </p>

                {/* Price and Purchase Button */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-yellow-600">
                    🪙 {item.price}
                  </div>
                  <button
                    onClick={() => handlePurchase(item.id, item.price, item.name)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      canAfford
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'ซื้อ' : 'เหรียญไม่พอ'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ไม่มีสินค้าในร้านค้าขณะนี้
        </div>
      )}
    </div>
  );
}

export default Shop;
