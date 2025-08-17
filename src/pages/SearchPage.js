import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import Select from "react-select";
import StarRating from "../components/StarRating";

function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || ""
  );
  const [results, setResults] = useState(location.state?.results || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!location.state?.results);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [currentUserSkills, setCurrentUserSkills] = useState({
    teach: [],
    learn: [],
  });

  useEffect(() => {
    const fetchCurrentUserSkills = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("teach_tags, learn_tags")
          .eq("id", user.id)
          .single();

        if (profile) {
          const teachSkills = (profile.teach_tags || []).map((t) =>
            t.skill.toLowerCase()
          );
          setCurrentUserSkills({
            teach: teachSkills,
            learn: (profile.learn_tags || []).map((l) => l.toLowerCase()),
          });
        }
      }
    };
    fetchCurrentUserSkills();
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name_th")
        .order("name_th");
      if (!error) {
        setProvinces(data.map((p) => ({ value: p.id, label: p.name_th })));
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince?.value) {
      const fetchDistricts = async () => {
        const { data, error } = await supabase
          .from("districts")
          .select("id, name_th")
          .eq("province_id", selectedProvince.value)
          .order("name_th");
        if (!error) {
          setDistricts(data.map((d) => ({ value: d.id, label: d.name_th })));
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
    setSelectedDistrict(null);
    setSearchTerm(""); // ✅ ล้างคำค้นหาเมื่อเลือกจังหวัดใหม่
  }, [selectedProvince]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() && !selectedProvince && !selectedDistrict) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("profiles")
        .select(
          `
          *,
          province:provinces!profiles_province_id_fkey(name_th),
          district:districts!profiles_district_id_fkey(name_th)
        `
        )
        .neq("id", currentUser?.id || "");

      if (searchTerm.trim()) {
        query = query.contains("searchable_tags", [
          searchTerm.trim().toLowerCase(),
        ]);
      }
      if (selectedProvince?.value) {
        query = query.eq("province_id", selectedProvince.value);
      }
      if (selectedDistrict?.value) {
        query = query.eq("district_id", selectedDistrict.value);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการค้นหา:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">
        ค้นหา Mentor หรือ Mentee
      </h1>

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วยทักษะ เช่น React, Python..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-cyan-700 disabled:bg-gray-400"
          >
            {loading ? "..." : "ค้นหา"}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <Select
            className="w-full"
            options={provinces}
            value={selectedProvince}
            onChange={setSelectedProvince}
            placeholder="ฟิลเตอร์ตามจังหวัด..."
            isClearable
          />
          <Select
            className="w-full"
            options={districts}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            placeholder="ฟิลเตอร์ตามอำเภอ..."
            isClearable
            isDisabled={!selectedProvince}
          />
        </div>
      </form>

      <div className="max-w-4xl mx-auto">
        {loading && <p className="text-center">กำลังค้นหา...</p>}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-gray-500">
            ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((user) => (
            <div
              key={user.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center"
            >
              <img
                src={
                  user.profile_pic_url ||
                  `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.display_name}`
                }
                alt={user.display_name}
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-cyan-100"
              />
              <h2 className="text-xl font-bold">{user.display_name}</h2>

              <div className="flex items-center gap-2 my-1">
                <StarRating rating={user.rating || 0} size="w-4 h-4" />
                <span className="text-xs text-gray-500">
                  ({user.reviews_count || 0} รีวิว)
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2 h-4">
                {user.district?.name_th}
                {user.district?.name_th && user.province?.name_th ? ", " : ""}
                {user.province?.name_th}
              </p>

              <p className="text-sm text-gray-500 mb-4 h-16 break-words [word-break:break-word] overflow-hidden">
                {user.bio?.substring(0, 115) || "ไม่มีข้อมูล"}...
              </p>

              <div className="w-full text-left mb-4">
                <p className="font-semibold text-xs text-blue-600 mb-1">สอน:</p>
                <div className="flex flex-wrap gap-1">
                  {user.teach_tags?.slice(0, 5).map((tagObj) => {
                    const isMatchForMe = currentUserSkills.learn.includes(
                      tagObj.skill.toLowerCase()
                    );
                    return (
                      <div
                        key={tagObj.skill}
                        title={tagObj.level}
                        className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5 ${
                          isMatchForMe
                            ? "bg-green-200 text-green-800 ring-1 ring-green-400"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <span>{tagObj.skill}</span>
                        <span
                          className={`text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                            isMatchForMe
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {tagObj.level.substring(0, 1)}
                        </span>
                      </div>
                    );
                  })}
                  {user.teach_tags?.length > 5 && (
                    <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      +{user.teach_tags.length - 5}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full text-left mb-4">
                <p className="font-semibold text-xs text-amber-600 mb-1">
                  เรียน:
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.learn_tags?.slice(0, 5).map((tag) => {
                    const isMatchForThem = currentUserSkills.teach.includes(
                      tag.toLowerCase()
                    );
                    return (
                      <span
                        key={tag}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isMatchForThem
                            ? "bg-purple-200 text-purple-800 ring-1 ring-purple-400"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                  {user.learn_tags?.length > 5 && (
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      +{user.learn_tags.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate(`/profile/${user.id}`)}
                className="mt-auto w-full bg-gray-800 text-white font-semibold py-2 rounded-lg hover:bg-black"
              >
                ดูโปรไฟล์
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
