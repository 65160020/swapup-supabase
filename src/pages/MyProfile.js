// src/pages/MyProfile.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import StarRating from "../components/StarRating";

// 🧱 Card wrapper
const Card = ({ children, className = "" }) => (
  <section className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
    {children}
  </section>
);

function MyProfile() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [dimAggs, setDimAggs] = useState(null);

  // tabs: overview | portfolio | reviews
  const [tab, setTab] = useState("overview");

  const calcAvg = (rows) =>
    rows.length
      ? rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rows.length
      : 0;

  const formatThaiDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const normalizeAggs = (row) => {
    if (!row) return null;
    const pick = (a, b) => row[a] ?? row[b] ?? 0;
    return {
      voice_tone: Number(pick("avg_voice_tone", "voice_tone")) || 0,
      relevance: Number(pick("avg_relevance", "relevance")) || 0,
      politeness: Number(pick("avg_politeness", "politeness")) || 0,
      open_mindedness:
        Number(pick("avg_open_mindedness", "open_mindedness")) || 0,
      friendliness: Number(pick("avg_friendliness", "friendliness")) || 0,
      creativity: Number(pick("avg_creativity", "creativity")) || 0,
      problem_solving:
        Number(pick("avg_problem_solving", "problem_solving")) || 0,
    };
  };

  // ✅ ทำให้ stable ด้วย useCallback
  const fetchAggs = useCallback(async (uid) => {
    const { data, error } = await supabase.rpc(
      "get_review_dimension_averages",
      { p_user_id: uid }
    );
    if (error) {
      console.error("RPC aggs error:", error);
      setDimAggs(null);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setDimAggs(normalizeAggs(row));
  }, []);

  // ✅ refreshReviews เป็น callback ที่อ้างถึง fetchAggs ที่ stable
  const refreshReviews = useCallback(
    async (uid) => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, rating, text, created_at, reviewee_id, reviewer:reviewer_id (display_name, profile_pic_url)"
        )
        .eq("reviewee_id", uid)
        .order("created_at", { ascending: false });

      if (!error) {
        const rows = data || [];
        setReviews(rows);
        setAverageRating(calcAvg(rows));
      }
      await fetchAggs(uid);
    },
    [fetchAggs]
  );

  const fetchAll = async () => {
    setLoading(true);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      navigate("/signin");
      return;
    }

    try {
      const [profileRes, reviewsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
            *,
            province:provinces!profiles_province_id_fkey(name_th),
            district:districts!profiles_district_id_fkey(name_th)
          `
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("reviews")
          .select(
            "id, rating, text, created_at, reviewee_id, reviewer:reviewer_id (display_name, profile_pic_url)"
          )
          .eq("reviewee_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      setUserProfile(profileRes.data);

      if (reviewsRes.error) throw reviewsRes.error;
      const rows = reviewsRes.data || [];
      setReviews(rows);
      setAverageRating(calcAvg(rows));

      await fetchAggs(user.id);
    } catch (e) {
      console.error("Profile fetch error:", e);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAverageRating(calcAvg(reviews));
  }, [reviews]);

  // ✅ ใส่ refreshReviews ใน dependency array (ตอนนี้ stable แล้ว)
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`my-reviews-${userProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
          filter: `reviewee_id=eq.${userProfile.id}`,
        },
        () => refreshReviews(userProfile.id)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reviews",
          filter: `reviewee_id=eq.${userProfile.id}`,
        },
        () => refreshReviews(userProfile.id)
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reviews",
          filter: `reviewee_id=eq.${userProfile.id}`,
        },
        () => refreshReviews(userProfile.id)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userProfile?.id, refreshReviews]);

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm("ลบภาพนี้หรือไม่?")) return;
    if (!userProfile?.portfolio_urls) return;

    const updated = userProfile.portfolio_urls.filter(
      (u) => u.trim() !== imageUrl.trim()
    );
    const { error } = await supabase
      .from("profiles")
      .update({ portfolio_urls: updated })
      .eq("id", userProfile.id);
    if (error) console.error("Error deleting image:", error);
    else setUserProfile((prev) => ({ ...prev, portfolio_urls: updated }));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Profile...
      </div>
    );
  if (!userProfile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Could not load profile.
      </div>
    );

  // quality badge
  const quality = (() => {
    const s = averageRating || 0;
    if (s >= 4.5)
      return { color: "bg-emerald-100 text-emerald-800", label: "ยอดเยี่ยม" };
    if (s >= 3.5) return { color: "bg-amber-100 text-amber-800", label: "ดี" };
    return { color: "bg-rose-100 text-rose-800", label: "ควรปรับปรุง" };
  })();

  return (
    <>
      {/* Modal รูป */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Selected work"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button className="absolute top-4 right-4 text-white text-4xl font-light">
            &times;
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Banner */}
        <div className="relative h-40 md:h-56 rounded-lg overflow-hidden shadow-lg">
          <img
            src={
              userProfile.banner_url ||
              "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop"
            }
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg" />
        </div>

        {/* Header */}
        <Card className="mx-4 -mt-16 md:-mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <img
              src={
                userProfile.profile_pic_url || "https://i.pravatar.cc/150?img=5"
              }
              alt={userProfile.display_name}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-md"
            />

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {userProfile.display_name}
              </h1>

              {/* ดาวเล็ก + จำนวนรีวิว */}
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={averageRating} size="w-4 h-4" />
                <span className="text-xs text-gray-500">
                  ({reviews.length} รีวิว)
                </span>
              </div>

              <p className="text-gray-600 mt-2 break-words">
                {userProfile.bio}
              </p>

              {userProfile.province && userProfile.district && (
                <div className="mt-2">
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {userProfile.district.name_th},{" "}
                      {userProfile.province.name_th}
                    </span>
                  </div>

                  {/* ปุ่มแก้ไขโปรไฟล์ */}
                  <button
                    onClick={() => navigate("/profile-setup")}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow"
                  >
                    ⚙️ แก้ไขโปรไฟล์
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Layout 2 คอลัมน์ */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar: คะแนนของฉัน + คะแนนเชิงลึก */}
          <div className="md:col-span-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                คะแนนของฉัน
              </h3>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">
                  {averageRating.toFixed(1)}
                  <span className="text-sm text-gray-500">/5</span>
                </div>
                <StarRating rating={averageRating} size="w-5 h-5" />
              </div>
              <div
                className={`inline-flex items-center gap-2 mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${quality.color}`}
              >
                {quality.label}
                <span className="text-[11px] text-current/80">
                  ({reviews.length} รีวิว)
                </span>
              </div>

              {/* ย่อ: มิติเด่น (top 2) */}
              {dimAggs && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">จุดเด่น</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dimAggs)
                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      .slice(0, 2)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                        >
                          {`${(v ?? 0).toFixed(1)}★ · ${
                            {
                              voice_tone: "น้ำเสียง",
                              relevance: "ตรงประเด็น",
                              politeness: "สุภาพ",
                              open_mindedness: "เปิดใจ",
                              friendliness: "เป็นมิตร",
                              creativity: "สร้างสรรค์",
                              problem_solving: "แก้ปัญหา",
                            }[k] || k
                          }`}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* คะแนนเชิงลึก */}
              {dimAggs && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    คะแนนเชิงลึก
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ["น้ำเสียงน่าฟัง", dimAggs.voice_tone],
                      ["ตรงประเด็น", dimAggs.relevance],
                      ["ใช้คำสุภาพ", dimAggs.politeness],
                      ["เปิดใจรับฟัง", dimAggs.open_mindedness],
                      ["ความเป็นมิตร", dimAggs.friendliness],
                      ["ความคิดสร้างสรรค์", dimAggs.creativity],
                      ["การแก้ปัญหา", dimAggs.problem_solving],
                    ].map(([label, val]) => {
                      const pct = Math.max(0, Math.min(5, val ?? 0)) * 20;
                      return (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">
                              {label}
                            </span>
                            <span className="text-sm font-semibold">
                              {(val ?? 0).toFixed(1)}/5
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-amber-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main: Tabs + Content */}
          <div className="md:col-span-8">
            <Card>
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                {[
                  { id: "overview", label: "ทักษะ" },
                  { id: "portfolio", label: "ผลงาน" },
                  { id: "reviews", label: "รีวิวทั้งหมด" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      tab === id
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === "overview" && (
                <div className="space-y-8">
                  {/* ทักษะ */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* สอน */}
                      <div>
                        <h3 className="font-semibold text-blue-600 mb-2">
                          สามารถสอน 👨‍🏫
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(userProfile?.teach_tags) &&
                          userProfile.teach_tags.length ? (
                            userProfile.teach_tags.map((tag, idx) => {
                              const skill =
                                typeof tag === "string" ? tag : tag?.skill;
                              const level =
                                typeof tag === "string" ? null : tag?.level;
                              return (
                                <span
                                  key={`${skill ?? "skill"}-${idx}`}
                                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2"
                                >
                                  <span>{skill ?? "ไม่ระบุ"}</span>
                                  {level && (
                                    <span className="bg-blue-500 text-white text-[11px] font-bold px-2 rounded-full">
                                      {level}
                                    </span>
                                  )}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      </div>
                      {/* อยากเรียน */}
                      <div>
                        <h3 className="font-semibold text-amber-600 mb-2">
                          อยากเรียน 🎓
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(userProfile?.learn_tags) &&
                          userProfile.learn_tags.length ? (
                            userProfile.learn_tags.map((item, idx) => (
                              <span
                                key={`${
                                  typeof item === "string"
                                    ? item
                                    : item?.skill ?? "skill"
                                }-${idx}`}
                                className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {typeof item === "string"
                                  ? item
                                  : item?.skill ?? "ไม่ระบุ"}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "portfolio" && (
                <div>
                  <h2 className="sr-only">ผลงาน</h2>
                  {Array.isArray(userProfile?.portfolio_urls) &&
                  userProfile.portfolio_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                      {userProfile.portfolio_urls.map((imgUrl, i) => (
                        <div key={i} className="relative group">
                          <div
                            className="rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow cursor-pointer aspect-w-1 aspect-h-1"
                            onClick={() => setSelectedImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Portfolio ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteImage(imgUrl)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="ลบรูป"
                          >
                            &#x2715;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      ยังไม่มีผลงาน ลองอัปโหลดสักชิ้นใน “อัปโหลดผลงาน” ด้านบน
                    </div>
                  )}
                </div>
              )}

              {tab === "reviews" && (
                <div>
                  {/* Header สรุปรีวิว */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      รีวิวทั้งหมด
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-900 tabular-nums">
                        {averageRating.toFixed(1)}
                        <span className="text-sm text-gray-500">/5</span>
                      </div>
                      <StarRating rating={averageRating} size="w-4 h-4" />
                      <span
                        className={`hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${quality.color}`}
                      >
                        {quality.label}
                        <span className="text-[11px] text-current/80">
                          ({reviews.length} รีวิว)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200/70 mb-4" />

                  {reviews.length ? (
                    <div className="space-y-6">
                      {reviews.map((r) => (
                        <div key={r.id} className="flex items-start gap-4">
                          <img
                            className="w-12 h-12 rounded-full object-cover ring-1 ring-gray-200"
                            src={
                              r.reviewer?.profile_pic_url ||
                              "https://i.pravatar.cc/150"
                            }
                            alt={r.reviewer?.display_name || "Reviewer"}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-gray-900 truncate">
                                {r.reviewer?.display_name || "ผู้ใช้ไม่ระบุ"}
                              </p>
                              <StarRating rating={r.rating} size="w-4 h-4" />
                            </div>
                            <p className="text-gray-700 mt-1 break-words leading-relaxed">
                              {r.text}
                            </p>
                            <span className="block text-xs text-gray-400 mt-1">
                              {formatThaiDate(r.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">ยังไม่มีรีวิว</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default MyProfile;
