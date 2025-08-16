import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase'; // 👈 1. Import supabase
import logo from '../assets/logo.png';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 👇 2. แก้ไข handleSubmit ให้เรียกใช้ Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.agree) {
      setError('กรุณายอมรับเงื่อนไขและนโยบายความเป็นส่วนตัว');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            display_name: formData.firstName,
          }
        }
      });

      if (error) throw error;

      alert('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ');
      navigate('/signin');

    } catch (err) {
      console.error("Sign up error:", err);
      if (err.message.includes('User already registered')) {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-300 via-purple-300 to-yellow-200 relative">
      <img
        src={logo}
        alt="SwapUp Logo"
        className="absolute top-5 left-5 w-24 h-24 object-contain"
      />
      <button
        onClick={() => navigate('/signin')}
        className="absolute top-5 right-5 border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition"
      >
        SIGN IN
      </button>

      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">Sign up to SwapUp</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Quick & Simple way to Automate your payment</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            placeholder="ชื่อ นามสกุล"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="อีเมล"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            required
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            required
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            type="password"
            required
          />

          {/* 👇 7. แสดงข้อความ Error ถ้ามี */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <span>
              I agree to the <a href="#" className="text-blue-600 underline">Terms of Service</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a>.
            </span>
          </label>

          {/* 👇 8. ปรับปรุงปุ่มให้แสดงสถานะ Loading */}
          <button
            type="submit"
            disabled={loading}
            className={`bg-black text-white w-full py-2 rounded transition ${
              loading ? 'bg-gray-500' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">หรือ</div>

        <div className="flex justify-center gap-6">
          <button className="border p-2 rounded-full hover:bg-gray-100 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          </button>
          <button className="border p-2 rounded-full hover:bg-gray-100 transition">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" alt="Facebook" className="w-6 h-6" />
          </button>
        </div>
      </div>
      <footer className="text-xs text-gray-600 absolute bottom-5 text-center">
        © 2021 - 2025 All Rights Reserved. SwapUp
      </footer>
    </div>
  );
}

export default SignUp;