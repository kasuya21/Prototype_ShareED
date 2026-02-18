import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

function Layout({ showSidebar = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default Layout;
