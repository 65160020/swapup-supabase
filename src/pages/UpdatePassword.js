// src/pages/UpdatePassword.js

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function UpdatePassword() {
  const navigate = useNavigate();
  // ✅ 1. เปลี่ยน state ให้อยู่ใน object เดียวกันเพื่อจัดการง่ายขึ้น
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ 2. สร้างฟังก์ชัน handleChange เพื่ออัปเดต state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // ✅ 3. ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่ (ก่อนทำอย่างอื่น)
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return; // หยุดการทำงานทันที
    }

    // Supabase กำหนดให้รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: formData.password, // ✅ 4. ใช้รหัสผ่านจาก state object
    });

    setLoading(false);

    if (error) {
      console.error('Error updating password:', error.message);
      setError('ไม่สามารถอัปเดตรหัสผ่านได้: ' + error.message);
    } else {
      setSuccessMessage('อัปเดตรหัสผ่านสำเร็จ! กำลังนำคุณไปที่หน้าเข้าสู่ระบบ...');
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">ตั้งรหัสผ่านใหม่</h2>
        
        {successMessage ? (
          <p className="text-green-600 text-center">{successMessage}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              name="password" // ✅ 5. เพิ่ม name attribute
              placeholder="กรอกรหัสผ่านใหม่ของคุณ"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
            
            {/* ✅ 6. เพิ่มช่องยืนยันรหัสผ่าน */}
            <input
              type="password"
              name="confirmPassword"
              placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-cyan-500"
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3 rounded-lg transition ${
                loading ? 'bg-gray-500' : 'bg-black hover:bg-gray-800'
              }`}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UpdatePassword;