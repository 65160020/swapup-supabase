import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // สมมติว่าคุณมีไฟล์ logo อยู่
import { Link as ScrollLink } from 'react-scroll';

function LandingPage() {
  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
  <div className="container mx-auto flex justify-between items-center p-4">
    <Link to="/" className="flex items-center space-x-2">
      <img src={logo} alt="SwapUp Logo" className="w-10 h-10 object-contain" />
      <span className="text-2xl font-bold text-gray-800">SwapUp</span>
    </Link>

    <nav className="hidden md:flex items-center space-x-6 text-base font-medium">
      <ScrollLink
        to="features"
        smooth={true}
        duration={600}
        offset={-70}
        className="cursor-pointer text-gray-600 hover:text-cyan-600 transition-colors"
      >
        คุณสมบัติ
      </ScrollLink>

      <ScrollLink
        to="testimonials"
        smooth={true}
        duration={600}
        offset={-70}
        className="cursor-pointer text-gray-600 hover:text-cyan-600 transition-colors"
      >
        รีวิวจากผู้ใช้
      </ScrollLink>

      <Link to="/signin" className="text-gray-600 hover:text-cyan-600 transition-colors">เข้าสู่ระบบ</Link>
      <Link to="/signup" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2 rounded-lg shadow-sm transition-transform hover:scale-105">
        สมัครสมาชิก
      </Link>
    </nav>
  </div>
</header>


      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-6 py-20 grid md:grid-cols-2 items-center gap-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              ปลดล็อกศักยภาพของคุณ
              <br />
              <span className="text-cyan-600">แลกเปลี่ยนทักษะกับผู้คนทั่วโลก</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              แพลตฟอร์มที่เชื่อมต่อผู้คนที่ต้องการเรียนรู้ทักษะใหม่ๆ กับผู้เชี่ยวชาญที่พร้อมจะแบ่งปันความรู้
            </p>
            <Link to="/signup">
              <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg transform transition hover:scale-105">
                เริ่มต้นใช้งานฟรี
              </button>
            </Link>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2574&auto=format&fit=crop"
              alt="People collaborating"
              className="rounded-lg shadow-xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">แพลตฟอร์มที่ใช่สำหรับคุณ</h2>
          <p className="text-gray-600 mb-12">ทุกสิ่งที่คุณต้องการสำหรับการเติบโต อยู่ที่นี่แล้ว</p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-cyan-100 text-cyan-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2">ค้นหาทักษะที่ตรงใจ</h3>
              <p className="text-gray-600">ระบบค้นหาอัจฉริยะ ช่วยให้คุณพบคู่แลกเปลี่ยนทักษะที่เหมาะสมกับความต้องการของคุณที่สุด</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-cyan-100 text-cyan-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2">เชื่อมต่อและเติบโต</h3>
              <p className="text-gray-600">เริ่มบทสนทนา, นัดหมายเวลา, และเริ่มต้นเส้นทางการเรียนรู้บทใหม่ของคุณได้ทันที</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-cyan-100 text-cyan-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2">ปลอดภัยและเชื่อถือได้</h3>
              <p className="text-gray-600">ระบบรีวิวและยืนยันตัวตน ช่วยให้คุณมั่นใจได้ในทุกการแลกเปลี่ยนความรู้</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">เสียงจากผู้ใช้งานของเรา</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 italic mb-4">"SwapUp เปลี่ยนชีวิตการเรียนรู้ของผมเลยครับ ผมได้เรียนรู้ทักษะ Python จาก Mentor ที่เก่งและใจดีมากๆ ตอนนี้ผมนำความรู้ไปต่อยอดในงานได้แล้ว"</p>
              <div className="flex items-center justify-center">
                <img src="https://i.pravatar.cc/150?img=1" alt="User 1" className="w-12 h-12 rounded-full mr-4"/>
                <div>
                  <p className="font-bold">สมชาย มั่นคง</p>
                  <p className="text-sm text-gray-500">Web Developer</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 italic mb-4">"ดีใจที่ได้แบ่งปันความรู้ด้านการตลาดดิจิทัลให้กับคนรุ่นใหม่ๆ ค่ะ เป็นแพลตฟอร์มที่ดีมากๆ ทำให้เราได้เจอเพื่อนใหม่ๆ ที่มีความสนใจเหมือนกัน"</p>
              <div className="flex items-center justify-center">
                <img src="https://i.pravatar.cc/150?img=45" alt="User 2" className="w-12 h-12 rounded-full mr-4"/>
                <div>
                  <p className="font-bold">อารยา ใจดี</p>
                  <p className="text-sm text-gray-500">Marketing Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-cyan-600 text-white">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมที่จะเริ่มต้นเส้นทางใหม่ของคุณแล้วหรือยัง?</h2>
          <p className="text-cyan-100 mb-8 text-lg">เข้าร่วมชุมชนแห่งการเรียนรู้และแบ่งปันของเราได้แล้ววันนี้</p>
          <Link to="/signup">
            <button className="bg-white text-cyan-600 font-bold text-lg px-8 py-3 rounded-lg shadow-lg transform transition hover:scale-105">
              สมัครสมาชิกเลย
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} SwapUp. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link to="/about" className="text-gray-400 hover:text-white">เกี่ยวกับเรา</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white">ติดต่อ</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-white">นโยบายความเป็นส่วนตัว</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;