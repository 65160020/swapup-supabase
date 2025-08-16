import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import MyProfile from './pages/MyProfile';
import MatchPage from './pages/MatchPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import UpdatePassword from './pages/UpdatePassword'; // ✅ 1. Import เข้ามา

function App() {  
  return (
    <Router>
      <Routes>
        {/* --- หน้าที่ไม่มี Layout ส่วนกลาง --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/update-password" element={<UpdatePassword />} /> {/* ✅ 2. เพิ่ม Route */}

        {/* --- หน้าโปรไฟล์สาธารณะ (ไม่มี Layout ส่วนกลาง) --- */}
       

        {/* --- กลุ่มหน้าที่ใช้ Layout ส่วนกลาง (มี Header/Navbar) --- */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />

          {/* --- เส้นทางสำหรับหน้าแชท --- */}
          <Route path="/matches" element={<MatchPage />} />        {/* หน้ารวมแชท */}
          <Route path="/matches/:chatId" element={<MatchPage />} />  {/* ห้องแชทที่เลือก */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;