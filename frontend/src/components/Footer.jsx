import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              Knowledge Sharing Platform
            </h3>
            <p className="text-sm text-gray-400">
              แพลตฟอร์มแชร์ความรู้ที่ช่วยให้คุณเรียนรู้และแบ่งปันความรู้กับผู้อื่น
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ลิงก์ด่วน</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link to="/popular" className="hover:text-white transition-colors">
                  ยอดนิยม
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  ค้นหา
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  ร้านค้า
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ติดต่อเรา</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@knowledgeshare.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Bangkok, Thailand</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {currentYear} Knowledge Sharing Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
