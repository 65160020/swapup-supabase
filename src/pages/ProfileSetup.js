// src/pages/ProfileSetup.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { uploadFileToCloudinary } from "../utils/cloudinary";
import Select from "react-select";

const presetBanners = [
  {
    name: "Sunset",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Ocean",
    url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Aurora",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop",
  },
  // ภาพเดียวหลายสี (gradient) ตามที่เลือกมา
  {
    name: "Multi-color Gradient",
    url: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFzdGVsJTIwZ3JhZGllbnR8ZW58MHx8MHx8fDA%3D",
  },
];

function ProfileSetup() {
  const navigate = useNavigate();
  // Form data states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [bannerPic, setBannerPic] = useState(null);
  const [certFiles, setCertFiles] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  // Tag states
  const [masterTagList, setMasterTagList] = useState([]);
  const [learnTags, setLearnTags] = useState([]);
  const [customLearnTag, setCustomLearnTag] = useState("");
  const [teachTags, setTeachTags] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Location states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const isLoadingProvinces = false; // ✅ อ่านอย่างเดียว แก้ no-unused-vars
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [initialProfileData, setInitialProfileData] = useState(null);

  // ✅ 1) โหลดข้อมูลครั้งเดียว
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
        return;
      }
      try {
        const [tagsRes, provincesRes, profileRes] = await Promise.all([
          supabase.from("tags").select("name"),
          supabase.from("provinces").select("id, name_th").order("name_th"),
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        ]);

        if (tagsRes.error) throw tagsRes.error;
        if (provincesRes.error) throw provincesRes.error;
        if (profileRes.error) throw profileRes.error;

        setMasterTagList(tagsRes.data.map((tag) => tag.name) || []);
        setProvinces(
          provincesRes.data.map((p) => ({ value: p.id, label: p.name_th }))
        );

        const profileData = profileRes.data;
        if (profileData) {
          setInitialProfileData(profileData);
          setName(profileData.display_name || "");
          setBio(profileData.bio || "");
          setProfilePreview(profileData.profile_pic_url);
          setBannerPreview(profileData.banner_url);
          setPortfolio(profileData.portfolio_urls || []);
          setTeachTags(profileData.teach_tags || []);
          setLearnTags(profileData.learn_tags || []);
        } else {
          setName(user.user_metadata.display_name || "");
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  // ✅ 2) ติด province เริ่มต้น
  useEffect(() => {
    if (initialProfileData?.province_id && provinces.length > 0) {
      const foundProvince = provinces.find(
        (p) => p.value === initialProfileData.province_id
      );
      if (foundProvince) setSelectedProvince(foundProvince);
    }
  }, [initialProfileData, provinces]);

  // ✅ 3) โหลด district เมื่อ province เปลี่ยน
  useEffect(() => {
    if (selectedProvince?.value) {
      setIsLoadingDistricts(true);
      const fetchDistricts = async () => {
        const { data, error } = await supabase
          .from("districts")
          .select("id, name_th")
          .eq("province_id", selectedProvince.value)
          .order("name_th");

        if (error) {
          console.error("Error fetching districts:", error);
          setDistricts([]);
        } else {
          const districtOptions = data.map((d) => ({
            value: d.id,
            label: d.name_th,
          }));
          setDistricts(districtOptions);

          if (
            initialProfileData?.district_id &&
            initialProfileData.province_id === selectedProvince.value
          ) {
            const foundDistrict = districtOptions.find(
              (d) => d.value === initialProfileData.district_id
            );
            if (foundDistrict) setSelectedDistrict(foundDistrict);
          }
        }
        setIsLoadingDistricts(false);
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince, initialProfileData]);

  // ✅ แสดง/ลบผลงานเดิมในหน้า setup (ลบจาก state ก่อนบันทึก)
  // ใหม่: เพิ่ม confirm ก่อนลบ
  const handleRemoveExistingPortfolio = (urlToRemove) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปผลงานนี้?")) {
      return;
    }
    setPortfolio((prev) =>
      prev.filter((u) => (u || "").trim() !== (urlToRemove || "").trim())
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProvince && !selectedDistrict) {
      alert("กรุณาเลือกอำเภอด้วยครับ");
      return;
    }
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let uploadedProfilePicUrl = profilePreview;
      if (profilePic) {
        uploadedProfilePicUrl = await uploadFileToCloudinary(profilePic);
      }

      let uploadedBannerUrl = bannerPreview;
      if (bannerPic) {
        uploadedBannerUrl = await uploadFileToCloudinary(bannerPic);
      }

      const uploadPromises = certFiles.map((item) =>
        uploadFileToCloudinary(item.file)
      );
      const newPortfolioUrls = await Promise.all(uploadPromises);

      // ✅ กันรูปซ้ำ
      const finalPortfolioUrls = Array.from(
        new Set([...(portfolio || []), ...newPortfolioUrls])
      );

      const profileToSave = {
        id: user.id,
        display_name: name,
        bio: bio,
        banner_url: uploadedBannerUrl,
        profile_pic_url: uploadedProfilePicUrl,
        teach_tags: teachTags,
        learn_tags: learnTags,
        portfolio_urls: finalPortfolioUrls,
        province_id: selectedProvince?.value || null,
        district_id: selectedDistrict?.value || null,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileToSave);
      if (profileError) throw profileError;

      await supabase.auth.updateUser({
        data: {
          display_name: name,
          ...(uploadedProfilePicUrl && { photo_url: uploadedProfilePicUrl }),
        },
      });

      alert("✅ บันทึกโปรไฟล์เรียบร้อย!");
      navigate("/my-profile");
    } catch (err) {
      console.error("Detailed error saving profile:", err);
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAddTeachSkill = () => {
    if (newSkill.trim() === "") return;
    if (
      teachTags.some(
        (tag) =>
          (tag?.skill || tag).toString().toLowerCase() ===
          newSkill.trim().toLowerCase()
      )
    ) {
      alert("คุณได้เพิ่มทักษะนี้ไปแล้ว");
      return;
    }
    setTeachTags([...teachTags, { skill: newSkill.trim(), level: skillLevel }]);
    setNewSkill("");
  };
  const handleRemoveTeachSkill = (skillToRemove) => {
    setTeachTags(
      teachTags.filter((tag) => (tag?.skill || tag) !== skillToRemove)
    );
  };
  const handleUpdateSkillLevel = (skillToUpdate, newLevel) => {
    setTeachTags(
      teachTags.map((tag) =>
        tag?.skill === skillToUpdate ? { ...tag, level: newLevel } : tag
      )
    );
  };
  const handleAddSuggestedSkill = (skillName) => {
    if (
      teachTags.some(
        (tag) =>
          (tag?.skill || tag).toString().toLowerCase() ===
          skillName.toLowerCase()
      )
    ) {
      alert("คุณได้เพิ่มทักษะนี้ไปแล้ว");
      return;
    }
    setTeachTags([...teachTags, { skill: skillName, level: "Beginner" }]);
  };
  const toggleLearnTag = (tag) => {
    setLearnTags(
      learnTags.includes(tag)
        ? learnTags.filter((t) => t !== tag)
        : [...learnTags, tag]
    );
  };
  const handleAddCustomLearnTag = () => {
    const tag = customLearnTag.trim();
    if (tag && !learnTags.includes(tag)) setLearnTags([...learnTags, tag]);
    setCustomLearnTag("");
  };
  const handleAddSuggestedLearnTag = (skillName) => {
    if (!learnTags.includes(skillName)) setLearnTags([...learnTags, skillName]);
  };
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };
  const handleBannerPicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPic(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };
  const handlePresetBannerSelect = (url) => {
    setBannerPreview(url);
    setBannerPic(null);
  };
  const handleCertFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setCertFiles(
      files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        กำลังโหลด...
      </div>
    );

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800">
          ตั้งค่าโปรไฟล์
        </h1>

        {/* Banner preview */}
        <div className="mb-6">
          <label className="block font-medium mb-2 text-center">
            รูปภาพ Banner
          </label>
          {/* ✅ ความสูงเท่ากับ MyProfile */}
          <div className="relative h-40 md:h-56 rounded-lg overflow-hidden shadow-md mb-2 bg-gray-200">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="banner preview"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                ไม่มี Banner
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerPicChange}
            className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            แนะนำขนาด ≥ 1200x400 pixels
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-600 text-center mb-2">
              หรือเลือกจาก Banner แนะนำ:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetBanners.map((banner) => (
                <div
                  key={banner.name}
                  onClick={() => handlePresetBannerSelect(banner.url)}
                  className="cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-cyan-500 hover:opacity-80 transition-all"
                  title={banner.name}
                >
                  <img
                    src={banner.url}
                    alt={banner.name}
                    className="w-full h-16 object-cover object-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile picture */}
        <div className="flex flex-col items-center mb-6 pt-6 border-t">
          <label className="block font-medium mb-2 text-center">
            รูปโปรไฟล์
          </label>
          <img
            src={profilePreview || "https://placehold.co/150"}
            alt="profile preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-md mb-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          <p className="text-xs text-gray-500 mt-1">แนะนำขนาด 1:1</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div>
            <label className="block font-medium mb-1">ชื่อของคุณ</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">เกี่ยวกับตัวคุณ</label>
            <textarea
              className="w-full border p-2 rounded-md"
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="แนะนำตัวเองสั้นๆ..."
            />
          </div>

          {/* Address */}
          <div className="pt-4 border-t">
            <label className="block font-medium mb-1">ที่อยู่</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="text-sm text-gray-600">
                  จังหวัด
                </label>
                <Select
                  id="province"
                  options={provinces}
                  value={selectedProvince}
                  onChange={(selectedOption) => {
                    if (selectedOption?.value !== selectedProvince?.value)
                      setSelectedDistrict(null);
                    setSelectedProvince(selectedOption);
                  }}
                  placeholder="เลือกจังหวัด..."
                  isClearable
                  isSearchable
                  isLoading={isLoadingProvinces}
                  noOptionsMessage={() => "ไม่พบข้อมูล"}
                />
              </div>
              <div>
                <label htmlFor="district" className="text-sm text-gray-600">
                  อำเภอ/เขต
                </label>
                <Select
                  id="district"
                  options={districts}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  placeholder="เลือกอำเภอ/เขต..."
                  isClearable
                  isSearchable
                  isLoading={isLoadingDistricts}
                  isDisabled={!selectedProvince}
                  noOptionsMessage={() => "ไม่พบข้อมูล"}
                />
              </div>
            </div>
          </div>

          {/* ✅ Existing portfolio preview + remove */}
          {Array.isArray(portfolio) && portfolio.length > 0 && (
            <div className="pt-4 border-t">
              <label className="block font-medium mb-2">
                ผลงานที่คุณอัปโหลดไว้
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {portfolio.map((imgUrl, idx) => (
                  <div key={`${imgUrl}-${idx}`} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={imgUrl}
                        alt={`portfolio-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPortfolio(imgUrl)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="ลบรูป"
                      title="ลบรูปนี้ออกจากรายการ"
                    >
                      &#x2715;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new portfolio */}
          <div className="pt-4 border-t">
            <label className="block font-medium mb-1">
              อัปโหลดใบรับรอง / รูปภาพผลงาน
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleCertFilesChange}
              className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
            {certFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {certFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square border rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.preview}
                      alt={`preview-${idx}`}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(item.preview)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills: teach */}
          <div className="pt-4 border-t">
            <label className="block font-medium mb-2">
              ทักษะที่คุณสามารถสอน
            </label>
            <div className="flex items-center gap-2 p-2 border rounded-lg mb-4">
              <input
                type="text"
                className="border-none p-2 rounded w-full focus:ring-0"
                placeholder="เช่น React, การตลาดออนไลน์"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <select
                className="border p-2 rounded-lg bg-gray-50 text-sm"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
              <button
                type="button"
                onClick={handleAddTeachSkill}
                className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                เพิ่ม
              </button>
            </div>
            <div className="space-y-2">
              {teachTags.map((tag, index) => {
                const skill = typeof tag === "string" ? tag : tag.skill;
                const level = typeof tag === "string" ? null : tag.level;
                return (
                  <div
                    key={`${skill}-${index}`}
                    className="flex justify-between items-center bg-blue-50 p-3 rounded-lg"
                  >
                    <span className="font-semibold text-blue-800">{skill}</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="border-gray-300 rounded-md text-sm bg-white"
                        value={level || "Beginner"}
                        onChange={(e) =>
                          handleUpdateSkillLevel(skill, e.target.value)
                        }
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeachSkill(skill)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 mt-4 border-t">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                หรือเลือกจากทักษะแนะนำ:
              </label>
              <div className="flex flex-wrap gap-2">
                {masterTagList
                  .filter(
                    (masterSkill) =>
                      !teachTags.some(
                        (added) =>
                          (added?.skill || added).toString().toLowerCase() ===
                          masterSkill.toLowerCase()
                      )
                  )
                  .map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleAddSuggestedSkill(skill)}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Skills: learn */}
          <div className="pt-4 border-t">
            <label className="block font-medium mb-2">
              ทักษะที่คุณอยากเรียน
            </label>
            <div className="flex mt-2 gap-2">
              <input
                type="text"
                className="border p-2 rounded-md w-full"
                placeholder="เพิ่มทักษะที่สนใจ"
                value={customLearnTag}
                onChange={(e) => setCustomLearnTag(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCustomLearnTag}
                className="bg-amber-500 text-white px-4 rounded-md hover:bg-amber-600"
              >
                เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-2 my-4">
              {learnTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleLearnTag(tag)}
                  className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                >
                  {tag} &times;
                </button>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                หรือเลือกจากทักษะแนะนำ:
              </label>
              <div className="flex flex-wrap gap-2">
                {masterTagList
                  .filter((masterSkill) => !learnTags.includes(masterSkill))
                  .map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleAddSuggestedLearnTag(skill)}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-300"
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-semibold">
              {error}
            </p>
          )}

          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
