import { useState, useEffect } from 'react';
import { getToken } from '../utils/auth';

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = getToken();
      
      // Fetch all achievements
      const allResponse = await fetch('http://localhost:3000/api/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch user's achievements
      const userResponse = await fetch('http://localhost:3000/api/users/me/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (allResponse.ok && userResponse.ok) {
        const allData = await allResponse.json();
        const userData = await userResponse.json();
        
        setAchievements(allData.achievements);
        setUserAchievements(userData.achievements);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUserProgress = (achievementId) => {
    const userAch = userAchievements.find(ua => ua.achievement_id === achievementId);
    return userAch?.progress || 0;
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ความสำเร็จ</h1>
        <p className="text-gray-600">
          ปลดล็อก {userAchievements.length} จาก {achievements.length} ความสำเร็จ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getUserProgress(achievement.id);
          const progressPercent = (progress / achievement.target) * 100;

          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                unlocked ? 'border-2 border-yellow-400' : 'opacity-75'
              }`}
            >
              {/* Badge Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
                    unlocked ? 'bg-yellow-100' : 'bg-gray-200'
                  }`}
                >
                  {unlocked ? achievement.badge || '🏆' : '🔒'}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-center mb-2">
                {achievement.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm text-center mb-4">
                {achievement.description}
              </p>

              {/* Progress Bar (for locked achievements) */}
              {!unlocked && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{progress} / {achievement.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Reward */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  🪙 {achievement.reward} เหรียญ
                </span>
              </div>

              {/* Unlocked Status */}
              {unlocked && (
                <div className="mt-4 text-center">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    ✓ ปลดล็อกแล้ว
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ไม่มีความสำเร็จในขณะนี้
        </div>
      )}
    </div>
  );
}

export default Achievements;
