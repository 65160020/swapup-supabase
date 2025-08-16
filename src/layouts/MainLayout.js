import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      try {
        const { error } = await supabase.auth.signOut(); 
        if (error) throw error;
        navigate('/signin');
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error);
      }
    }
  };

  const getLinkClass = (path) => {
    // แก้ไขให้ไฮไลท์ /matches และ /matches/ใดๆ เหมือนกัน
    const baseMatchPath = '/matches';
    if (location.pathname.startsWith(baseMatchPath) && path.startsWith(baseMatchPath)) {
      return 'font-bold text-cyan-700';
    }
    return location.pathname === path
      ? 'font-bold text-cyan-700'
      : 'text-gray-600 hover:text-cyan-700';
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen">
      {/* --- Header --- */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center space-x-2">
            <img src={logo} alt="SwapUp Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-gray-800 hidden sm:block">SwapUp</span>
          </Link>
          <nav className="flex items-center space-x-6 text-base">
            <Link to="/home" className={getLinkClass('/home')}>หน้าแรก</Link>
            <Link to="/my-profile" className={getLinkClass('/my-profile')}>โปรไฟล์</Link>
            <Link to="/matches" className={getLinkClass('/matches')}>ข้อความ</Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              ออกจากระบบ
            </button>
          </nav>
        </div>
      </header>

      {/* --- ส่วนแสดงเนื้อหาของแต่ละหน้า --- */}
      <main>
        <Outlet /> {/* 👈 **ต้องมีบรรทัดนี้** */}
      </main>
    </div>
  );
};

export default MainLayout;