import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

function Quests() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีกำหนด';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'ไม่มีกำหนด';
      return date.toLocaleString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'ไม่มีกำหนด';
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/quests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuests(data.quests);
      }
    } catch (err) {
      console.error('Failed to fetch quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (questId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/api/quests/${questId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`รับรางวัล ${data.coinsAwarded} เหรียญสำเร็จ!`);
        fetchQuests();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'ไม่สามารถรับรางวัลได้');
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ภารกิจรายวัน</h1>
        <p className="text-gray-600">ทำภารกิจเพื่อรับเหรียญรางวัล</p>
      </div>

      <div className="space-y-4">
        {quests.map((quest) => {
          const progress = (quest.currentAmount / quest.targetAmount) * 100;
          const isCompleted = quest.isCompleted;
          const isClaimed = quest.isClaimed;

          return (
            <div key={quest.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{quest.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{quest.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>ความคืบหน้า</span>
                      <span>{quest.currentAmount} / {quest.targetAmount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-yellow-600 font-medium">
                      🪙 {quest.reward} เหรียญ
                    </span>
                    {isClaimed && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        รับรางวัลแล้ว
                      </span>
                    )}
                    {isCompleted && !isClaimed && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                        เสร็จสมบูรณ์
                      </span>
                    )}
                  </div>
                </div>

                {isCompleted && !isClaimed && (
                  <button
                    onClick={() => handleClaimReward(quest.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    รับรางวัล
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                หมดอายุ: {formatDate(quest.expiresAt || quest.expires_at)}
              </div>
            </div>
          );
        })}
      </div>

      {quests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ไม่มีภารกิจในขณะนี้
        </div>
      )}
    </div>
  );
}

export default Quests;
