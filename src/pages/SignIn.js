import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        remember: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleForgotPassword = async () => {
    const email = prompt("กรุณากรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน:");
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, // ใช้ origin ปัจจุบัน
      });
      if (error) throw error;
      alert('ตรวจสอบอีเมลของคุณสำหรับลิงก์รีเซ็ตรหัสผ่าน');
    } catch (err) {
      console.error("Error sending password reset email:", err.message);
      setError("ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error("ไม่สามารถยืนยันตัวตนผู้ใช้ได้");
      
      if (formData.remember) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle(); // ใช้ maybeSingle() ป้องกัน error
      
      if (profileError) throw profileError;

      if (profile) {
        navigate('/home');
      } else {
        navigate('/profile-setup');
      }

    } catch (err) {
      console.error("Sign in process error:", err.message);
      if (err.message.includes('Invalid login credentials')) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.message.includes('Email not confirmed')) {
        setError('กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-200 via-blue-100 to-yellow-100 relative">
      <img
        src={logo}
        alt="SwapUp Logo"
        className="absolute top-5 left-5 w-24 h-24 object-contain"
      />

      <button
        onClick={() => navigate('/signup')}
        className="absolute top-5 right-5 border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition"
      >
        SIGN UP
      </button>

      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">Log In to SwapUp</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Welcome back! Please enter your details.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="cursor-pointer"
              />
              <span>จำฉันไว้ในระบบ</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:underline"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded transition ${
              loading ? 'bg-gray-500' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        
        <div className="my-4 flex items-center gap-4">
            <hr className="flex-grow border-gray-300" />
            <span className="text-gray-500 text-sm">หรือเข้าสู่ระบบด้วย</span>
            <hr className="flex-grow border-gray-300" />
        </div>

        <div className="flex justify-center gap-6">
          <button className="border p-2 rounded-full hover:bg-gray-100 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          </button>
          <button className="border p-2 rounded-full hover:bg-gray-100 transition">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" alt="Facebook" className="w-6 h-6" />
          </button>
        </div>
      </div>
      <footer className="absolute bottom-5 text-center text-xs text-gray-600">
        © 2021 - 2025 All Rights Reserved. SwapUp
     </footer>
    </div>
  );
}

export default SignIn;