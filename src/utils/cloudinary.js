import axios from "axios";

// เปลี่ยนชื่อฟังก์ชันให้สื่อความหมายมากขึ้น
export const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "swapup_unsigned");
  
  // 👇 **บรรทัดที่เพิ่มเข้ามา:** บอกให้ Cloudinary ตรวจจับประเภทไฟล์เอง
  formData.append("resource_type", "auto"); 

  try {
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/djyctshoy/upload", // อย่าลืมใส่ cloud_name ของคุณ
      formData
    );
    return res.data.secure_url;
  } catch (error) {
    console.error("Upload to Cloudinary failed:", error);
    return null;
  }
};