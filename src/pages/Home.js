import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import StarRating from "../components/StarRating"; // ✅ Import StarRating

function Home() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        const { data: allUsers, error: userErr } = await supabase
          .from("profiles")
          .select(
            `
            *,
            province:province_id ( name_th ),
            district:district_id ( name_th )
          `
          )
          .neq("id", user?.id || "")
          .limit(20);

        if (userErr) throw userErr;

        if (allUsers && allUsers.length > 0) {
          const randomIndex = Math.floor(Math.random() * allUsers.length);
          setMatchedUser(allUsers[randomIndex]);
          setMentors(allUsers.filter((_, i) => i !== randomIndex));
        } else {
          setMatchedUser(null);
          setMentors([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleAutoMatchmaking = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      alert("กรุณาล็อกอินก่อนใช้งานฟังก์ชันนี้");
      navigate("/signin");
      return;
    }

    alert("กำลังค้นหาคู่แมตช์ที่ Win-Win ที่สุดสำหรับคุณ...");

    try {
      const { data: myProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("learn_tags, teach_tags")
        .eq("id", user.id)
        .single();

      if (profileErr) throw profileErr;

      if (!myProfile?.learn_tags?.length || !myProfile?.teach_tags?.length) {
        alert(
          "กรุณาตั้งค่า 'ทักษะที่อยากเรียน' และ 'ทักษะที่สามารถสอน' ในโปรไฟล์ของคุณให้ครบถ้วนก่อน"
        );
        navigate("/profile-setup");
        return;
      }

      // 1. ใช้ RPC หา ID ของโปรไฟล์ที่ตรงกัน
      const { data: initialMatches, error: matchErr } = await supabase.rpc(
        "find_reciprocal_matches",
        {
          p_user_id: user.id,
          p_my_learn_tags: myProfile.learn_tags,
          p_my_teach_tags_jsonb: myProfile.teach_tags,
        }
      );

      if (matchErr) throw matchErr;

      if (!initialMatches || initialMatches.length === 0) {
        navigate("/search", {
          state: {
            results: [],
            searchTerm: myProfile.learn_tags.join(", "),
          },
        });
        return;
      }

      // ✅ 2. นำ ID ที่ได้ มาดึงข้อมูลฉบับเต็มพร้อมชื่อจังหวัด/อำเภอ
      const matchedIds = initialMatches.map((p) => p.id);

      const { data: fullMatches, error: fullMatchesError } = await supabase
        .from("profiles")
        .select(
          `
          *,
          province:provinces!profiles_province_id_fkey(name_th),
          district:districts!profiles_district_id_fkey(name_th)
        `
        )
        .in("id", matchedIds);

      if (fullMatchesError) throw fullMatchesError;

      // 3. ส่งข้อมูลฉบับเต็มไปที่หน้า Search
      navigate("/search", {
        state: {
          results: fullMatches,
          searchTerm: myProfile.learn_tags.join(", "),
          prioritized: true,
        },
      });
    } catch (err) {
      console.error("Error during matchmaking:", err);
      alert("เกิดข้อผิดพลาดในการค้นหา");
    }
  };

  return (
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 items-center gap-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              แลกเปลี่ยน<span className="text-cyan-600">ความรู้</span>
              <br />
              กับคนที่ใช่ ✨
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              ค้นหา Mentor หรือ Mentee ที่มีทักษะตรงใจ
              แล้วเริ่มเส้นทางการเรียนรู้บทใหม่ของคุณได้เลยวันนี้
            </p>
            <button
              onClick={handleAutoMatchmaking}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              🔍 ค้นหาคู่แมทช์ของคุณ
            </button>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop"
              alt="People learning and collaborating"
              className="w-full max-w-lg mx-auto"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mentors/Mentees แนะนำ
          </h2>
          {loading ? (
            <p className="text-center">กำลังโหลดข้อมูลผู้ใช้...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {mentors.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-6 flex flex-col text-center group"
                >
                  <img
                    src={m.profile_pic_url || "https://i.pravatar.cc/150"}
                    alt={m.display_name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white ring-4 ring-gray-200 group-hover:ring-cyan-500 transition-all duration-300"
                  />
                  <h3 className="text-xl font-bold text-gray-900">
                    {m.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden break-words [word-break:break-word]">
                    {m.bio || "ไม่มีข้อมูลแนะนำตัว"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {m.district?.name_th}
                    {m.district?.name_th && m.province?.name_th ? ", " : ""}
                    {m.province?.name_th}
                  </p>

                  <StarRating
                    rating={m.rating || m.avg_rating || 0}
                    className="justify-center"
                  />

                  <div className="mt-4 flex-grow">
                    <p className="text-sm font-semibold text-gray-500 mb-2">
                      Teach
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {/* ตัดเอามาแสดงแค่  อันแรก */}
                      {m.teach_tags?.slice(0, 5).map((tagObj) => (
                        <div
                          key={tagObj.skill}
                          title={tagObj.level}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                        >
                          <span className="break-all">{tagObj.skill}</span>
                          <span className="bg-blue-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                            {tagObj.level.substring(0, 1)}
                          </span>
                        </div>
                      ))}
                      {/* ถ้ามีมากกว่า 5 อัน ให้แสดงป้าย + เพิ่ม */}
                      {m.teach_tags?.length > 5 && (
                        <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                          +{m.teach_tags.length - 3}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-500 mt-4 mb-2">
                      Learn
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {m.learn_tags?.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold break-all"
                        >
                          {tag}
                        </span>
                      ))}
                      {m.learn_tags?.length > 5 && (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                          +{m.learn_tags.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/profile/${m.id}`)}
                    className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    ดูโปรไฟล์
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {matchedUser && !loading && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Match ที่แนะนำสำหรับคุณ
            </h2>
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 p-1 rounded-2xl shadow-2xl">
              <div className="bg-white p-8 rounded-xl flex flex-col md:flex-row items-center gap-8">
                <img
                  src={
                    matchedUser.profile_pic_url || "https://i.pravatar.cc/150"
                  }
                  alt={matchedUser.display_name}
                  className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0"
                />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {matchedUser.display_name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {matchedUser.district?.name_th}
                    {matchedUser.district?.name_th &&
                    matchedUser.province?.name_th
                      ? ", "
                      : ""}
                    {matchedUser.province?.name_th}
                  </p>
                  <StarRating
                    rating={matchedUser.rating || matchedUser.avg_rating || 0}
                    className="justify-center md:justify-start"
                  />
                  <p className="text-gray-600 mb-4 mt-2 break-words [word-break:break-word]">
                    {matchedUser.bio}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {matchedUser.teach_tags?.slice(0, 5).map((tagObj) => (
                      <div
                        key={tagObj.skill}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        <span className="break-all">{tagObj.skill}</span>
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 rounded-full">
                          {tagObj.level}
                        </span>
                      </div>
                    ))}
                    {matchedUser.teach_tags?.length > 5 && (
                      <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                        +{matchedUser.teach_tags.length - 5}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${matchedUser.id}`)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 mt-4 md:mt-0 whitespace-nowrap"
                >
                  ดูโปรไฟล์และเริ่มแชท
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
