import React from 'react';
import Layout from '../components/Layout';

function Home() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          ยินดีต้อนรับสู่แพลตฟอร์มแชร์ความรู้
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-4">
            เริ่มต้นแชร์ความรู้และเรียนรู้จากผู้อื่น
          </p>
          <p className="text-gray-600">
            สร้างโพสต์ ทำภารกิจ และรับรางวัล!
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
