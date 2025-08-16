import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { uploadFileToCloudinary } from "../utils/cloudinary";

const MessageBubble = ({
  msg,
  currentUserId,
  onReaction,
  onReply,
  onDelete,
  currentUserProfile,
  otherUserProfile,
}) => {
  const isMe = msg.sender_id === currentUserId;
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Debug logs for profile pictures (only log once per component)
  if (msg.id && !window.debugLogged) {
    console.log("🔍 MessageBubble Profile Debug:", {
      currentUserProfile: currentUserProfile?.profile_image,
      otherUserProfile: otherUserProfile?.profile_image,
    });
    window.debugLogged = true;
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderContent = () => {
    switch (msg.type) {
      case "image":
        return (
          <img
            src={msg.content}
            alt="sent"
            className="max-w-xs rounded-lg shadow-md"
          />
        );
      case "video":
        return (
          <video
            src={msg.content}
            controls
            className="max-w-xs rounded-lg shadow-md"
          />
        );
      case "meet":
        return (
          <a
            href={msg.content}
            target="_blank"
            rel="noreferrer"
            className="underline break-words"
          >
            Google Meet: {msg.content}
          </a>
        );
      case "reply":
        try {
          const replyData = JSON.parse(msg.content);
          return (
            <div>
              <div className="bg-gray-100 border-l-4 border-cyan-500 p-2 mb-2 rounded">
                <p className="text-xs text-gray-600 mb-1">ตอบกลับ:</p>
                <p className="text-sm text-gray-800">
                  {replyData.replyTo.content}
                </p>
              </div>
              <p className="break-words">{replyData.text}</p>
            </div>
          );
        } catch {
          return <p className="break-words">{msg.content}</p>;
        }
      default:
        return <p className="break-words">{msg.content}</p>;
    }
  };

  return (
    <div
      className={`flex items-end gap-2 my-3 ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      <div className="flex flex-col max-w-sm md:max-w-md relative group/message">
        {/* Message with options */}
        <div
          onDoubleClick={() => setShowReactions(!showReactions)}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowOptions(!showOptions);
          }}
          className="cursor-pointer"
        >
          <div
            className={`px-4 py-2 rounded-2xl relative transition-all duration-200 ${
              isMe
                ? "bg-cyan-600 text-white rounded-br-none hover:shadow-md"
                : "bg-gray-200 text-gray-800 rounded-bl-none hover:shadow"
            }`}
          >
            {renderContent()}

            {/* Message options button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all duration-200 hover:bg-gray-700 hover:scale-110"
            >
              ⋮
            </button>

            {/* Quick reaction button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions(!showReactions);
              }}
              className="absolute -top-2 -left-2 opacity-0 group-hover/message:opacity-100 bg-white text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transition-all duration-200 hover:bg-gray-100 hover:scale-110"
            >
              😊
            </button>
          </div>
        </div>

        {/* Message Options Menu */}
        {showOptions && (
          <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-2 right-0 top-8">
            <button
              onClick={() => {
                onReply(msg);
                setShowOptions(false);
              }}
              className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
            >
              💬 ตอบกลับ
            </button>
            <button
              onClick={() => {
                setShowReactions(!showReactions);
                setShowOptions(false);
              }}
              className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
            >
              😊 เพิ่มรีแอคชั่น
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(msg.content);
                setShowOptions(false);
              }}
              className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
            >
              📋 คัดลอก
            </button>
            {isMe && (
              <button
                onClick={() => {
                  if (
                    window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้?")
                  ) {
                    onDelete(msg.id);
                  }
                  setShowOptions(false);
                }}
                className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm text-red-500"
              >
                🗑️ ลบข้อความ
              </button>
            )}
          </div>
        )}
        <div
          className={`text-xs text-gray-500 mt-1 px-2 ${
            isMe ? "text-right" : "text-left"
          }`}
        >
          {formatTime(msg.created_at)}
          {isMe && (
            <span className="ml-2">
              {msg.is_read ? (
                <span className="text-blue-500">✓✓</span>
              ) : (
                <span className="text-gray-400">✓</span>
              )}
              {console.log(
                `Message ${msg.id} is_read:`,
                msg.is_read,
                "content:",
                msg.content.substring(0, 20) + "..."
              )}
            </span>
          )}
        </div>

        {/* Message Reactions */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-2">
            {Object.entries(msg.reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReaction(msg.id, emoji)}
                className="bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors duration-200"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-gray-600">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Reaction Menu */}
        {showReactions && (
          <div className="absolute z-10 bg-white border rounded-full shadow-lg p-1 flex gap-1 -top-8 left-0 right-0 mx-auto w-max">
            {["😍", "😂", "😢", "😡", "👍", "👋"].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(msg.id, emoji);
                  setShowReactions(false);
                }}
                className="hover:bg-gray-100 p-1 rounded-full text-lg transform transition-transform hover:scale-125 hover:-translate-y-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewModal = ({ userToReview, onClose, onSubmit }) => {
  const [overall, setOverall] = useState(0);
  const [text, setText] = useState("");

  const CATEGORIES = [
    { key: "voice_tone", label: "น้ำเสียงน่าฟัง (Voice tone)" },
    { key: "relevance", label: "ตรงประเด็น (Relevance)" },
    { key: "politeness", label: "ใช้คำสุภาพ (Politeness)" },
    { key: "open_mindedness", label: "เปิดใจรับฟัง (Open-mindedness)" },
    { key: "friendliness", label: "ความเป็นมิตร (Friendliness)" },
    { key: "creativity", label: "ความคิดสร้างสรรค์ (Creativity)" },
    { key: "problem_solving", label: "การแก้ปัญหา (Problem-solving)" },
  ];

  const [scores, setScores] = useState(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]))
  );

  const setScore = (key, val) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const StarRow = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          className={`text-2xl cursor-pointer transition-transform hover:scale-125 ${
            i <= value ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );

  const handleSubmit = () => {
    if (overall === 0) {
      alert("กรุณาให้คะแนนรวมอย่างน้อย 1 ดาว");
      return;
    }
    onSubmit({
      rating: overall,
      text,
      ...scores, // ใส่คะแนนรายมิติทั้งหมด
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">
          รีวิวคุณ {userToReview.display_name}
        </h2>

        {/* ดาวรวม */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-1 font-semibold">คะแนนรวม</p>
          <StarRow value={overall} onChange={setOverall} />
        </div>

        {/* คะแนนรายมิติ */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between">
              <p className="text-sm text-gray-700 mr-3">{cat.label}</p>
              <StarRow
                value={scores[cat.key]}
                onChange={(v) => setScore(cat.key, v)}
              />
            </div>
          ))}
        </div>

        {/* ความคิดเห็น */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="แสดงความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
          className="w-full border p-2 rounded-lg mt-4 focus:ring-2 focus:ring-cyan-500"
          rows={3}
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
          >
            ส่งรีวิว
          </button>
        </div>
      </div>
    </div>
  );
};

function MatchPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [messageToReply, setMessageToReply] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [unreadCounts] = useState({}); // ✅ กัน no-undef: ยังไม่คำนวณจริง อ่านเป็น 0
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const presenceRef = useRef(null);
  const audioRef = useRef(null);
  const isScrolledToBottom = useRef(true);
  const lastMessageCount = useRef(0);

  // Initialize notification sound & presence
  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    );
    audioRef.current.volume = 0.3;

    const setupPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      presenceRef.current = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      presenceRef.current
        .on("presence", { event: "sync" }, () => {
          const state = presenceRef.current.presenceState();
          const onlineUsersMap = {};
          Object.entries(state).forEach(([_, presenceEntries]) => {
            presenceEntries.forEach(({ user_id, online_at }) => {
              onlineUsersMap[user_id] = { isOnline: true, lastSeen: online_at };
            });
          });
          setOnlineUsers((prev) => ({ ...prev, ...onlineUsersMap }));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceRef.current.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();
    return () => {
      if (presenceRef.current) presenceRef.current.unsubscribe();
    };
  }, [currentUserId]);

  // Scroll tracking
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
    isScrolledToBottom.current = isAtBottom;
  };

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current && isScrolledToBottom.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Search filter
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = messages.filter((msg) =>
        (msg.content || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, searchTerm]);

  useEffect(() => {
    if (messages.length === 0) return;
    const isNewMessage = messages.length > lastMessageCount.current;
    lastMessageCount.current = messages.length;
    if (isNewMessage && isScrolledToBottom.current) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 500);
    }
  }, [chatId, messages.length]);

  // Load current user & profile
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          console.log("👤 Loading current user profile:", profile);
          console.log(
            "👤 Current user profile image URL:",
            profile.profile_image
          );
          setCurrentUserProfile(profile);
        } else {
          console.error("❌ Error loading current user profile:", error);
        }
      } else {
        navigate("/signin");
      }
    };
    getUser();
  }, [navigate]);

  // Fetch chat rooms (with filter: hide rooms both-reviewed)
  useEffect(() => {
    if (!currentUserId) return;

    const fetchChatRooms = async () => {
      console.log("🔄 Fetching chat rooms...");
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select(
          "id, participants, last_message_text, last_message_timestamp, created_at, status, reviewed_by"
        )
        .contains("participants", [currentUserId])
        .neq("status", "closed");

      if (chatsError) {
        console.error("❌ Error fetching chats:", chatsError);
        return;
      }

      const sortedChats =
        chatsData?.sort((a, b) => {
          const aTime = a.last_message_timestamp || a.created_at;
          const bTime = b.last_message_timestamp || b.created_at;
          return new Date(bTime) - new Date(aTime);
        }) || [];

      const otherUserIds = sortedChats
        .map((chat) => chat.participants.find((id) => id !== currentUserId))
        .filter(Boolean);

      if (otherUserIds.length === 0) {
        setChatRooms([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, profile_pic_url")
        .in("id", otherUserIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
        return;
      }

      const profilesMap = new Map(profilesData.map((p) => [p.id, p]));
      const rooms = sortedChats
        .map((chat) => {
          const otherUserId = chat.participants.find(
            (id) => id !== currentUserId
          );
          const otherUser = profilesMap.get(otherUserId);
          return { ...chat, otherUser };
        })
        .filter((room) => room.otherUser);

      // 🔒 ซ่อนห้องที่ reviewed_by ครบทุก participants แม้ status ยังไม่กลายเป็น 'closed'
      const filteredRooms = rooms.filter((room) => {
        const rev = Array.isArray(room.reviewed_by) ? room.reviewed_by : [];
        const parts = Array.isArray(room.participants) ? room.participants : [];
        return !parts.every((uid) => rev.includes(uid));
      });

      console.log("✅ Chat rooms updated (filtered):", filteredRooms.length);
      setChatRooms(filteredRooms);
    };

    fetchChatRooms();
    const chatRoomsInterval = setInterval(fetchChatRooms, 2000);
    window.refreshChatRooms = fetchChatRooms;

    return () => {
      console.log("🧹 Cleaning up chat rooms polling");
      clearInterval(chatRoomsInterval);
    };
  }, [currentUserId]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!chatId || !currentUserId) {
      setMessages([]);
      return;
    }

    console.log("💬 Setting up polling chat for:", chatId);

    const fetchMessages = async () => {
      if (!chatId) return;

      console.log("📥 Fetching messages for chat:", chatId);

      try {
        // First, fetch messages
        const { data: messagesData, error: fetchError } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (fetchError) {
          console.error("❌ Error fetching messages:", fetchError);
          return;
        }

        console.log(`✅ Fetched ${messagesData?.length || 0} messages`);

        // Update messages in state
        setMessages(messagesData || []);

        // Check for unread messages from other users
        if (messagesData && messagesData.length > 0) {
          // Log first 3 messages for debugging
          console.log(
            "Sample messages (first 3):",
            messagesData.slice(0, 3).map((m) => ({
              id: m.id,
              content: m.content?.substring(0, 20) + "...",
              sender_id: m.sender_id,
              is_read: m.is_read,
              created_at: m.created_at,
            }))
          );

          const unreadMessages = messagesData.filter(
            (msg) => !msg.is_read && msg.sender_id !== currentUserId
          );

          console.log(
            `📩 Found ${unreadMessages.length} unread messages from other users`
          );

          // If there are unread messages, mark them as read
          if (unreadMessages.length > 0) {
            console.log("🔍 Marking messages as read...");
            console.log(
              "Unread message IDs:",
              unreadMessages.map((m) => m.id)
            );

            try {
              // Call the database function to mark messages as read
              console.log("Calling mark_messages_as_read with:", {
                chat_id_param: chatId,
                user_id_param: currentUserId,
              });

              const { data: markReadResult, error: markReadError } =
                await supabase.rpc("mark_messages_as_read", {
                  chat_id_param: chatId,
                  user_id_param: currentUserId,
                });

              if (markReadError) {
                console.error(
                  "❌ Error marking messages as read:",
                  markReadError
                );
              } else {
                console.log(
                  "✅ Successfully marked messages as read. Result:",
                  markReadResult
                );

                // Refresh messages to get updated read status
                console.log(
                  "Refreshing messages to get updated read status..."
                );
                const { data: updatedMessages, error: refreshError } =
                  await supabase
                    .from("messages")
                    .select("*")
                    .eq("chat_id", chatId)
                    .order("created_at", { ascending: true });

                if (refreshError) {
                  console.error("❌ Error refreshing messages:", refreshError);
                } else if (updatedMessages) {
                  // Verify if messages were actually marked as read
                  const stillUnread = updatedMessages.filter(
                    (msg) => !msg.is_read && msg.sender_id !== currentUserId
                  );
                  console.log(
                    `After update: ${stillUnread.length} messages still unread`
                  );

                  if (stillUnread.length > 0) {
                    console.log(
                      "Sample unread messages after update:",
                      stillUnread.slice(0, 3).map((m) => ({
                        id: m.id,
                        content: m.content?.substring(0, 20) + "...",
                        sender_id: m.sender_id,
                        is_read: m.is_read,
                      }))
                    );
                  }

                  console.log("🔄 Updating UI with read status");
                  setMessages(updatedMessages);
                }
              }
            } catch (error) {
              console.error("❌ Exception in mark as read process:", error);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error in fetchMessages:", error);
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up polling
    const messagesInterval = setInterval(fetchMessages, 2000);

    const typingChannel = supabase
      .channel(`typing:${chatId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          setTypingUsers((prev) => ({
            ...prev,
            [payload.userId]: payload.isTyping,
          }));
          if (payload.isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => ({ ...prev, [payload.userId]: false }));
            }, 3000);
          }
        }
      })
      .subscribe();

    return () => {
      console.log("🧹 Cleaning up polling intervals...");
      clearInterval(messagesInterval);
      supabase.removeChannel(typingChannel);
    };
  }, [chatId, currentUserId, chatRooms]);

  const sendMessage = async (type, content) => {
    if (!currentUserId || !chatId || !content.trim()) return;

    // กันส่งข้อความเมื่อห้องรอรีวิว/ปิดแล้ว
    const active = chatRooms.find((c) => c.id === chatId);
    if (active?.status === "ended" || active?.status === "closed") {
      alert("ห้องนี้ปิดการสนทนาแล้ว (กำลังรอรีวิว/จบแล้ว)");
      return;
    }

    console.log("Sending message:", { type, content, chatId, currentUserId });

    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        type: type,
        content: content,
      })
      .select();

    if (error) {
      console.error("Send message error:", error);
      return;
    }

    console.log("Message sent successfully:", data);

    const lastMessageText =
      type === "text"
        ? content
        : `[${type.charAt(0).toUpperCase() + type.slice(1)}]`;

    const { error: chatUpdateError } = await supabase
      .from("chats")
      .update({
        last_message_text: lastMessageText,
        last_message_timestamp: new Date().toISOString(),
      })
      .eq("id", chatId);

    if (chatUpdateError) {
      console.error("Error updating chat:", chatUpdateError);
    } else {
      console.log("Chat updated successfully");
      if (window.refreshChatRooms) {
        setTimeout(() => window.refreshChatRooms(), 100);
      }
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      console.log("Adding reaction:", { messageId, emoji });
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        console.error("Message not found:", messageId);
        return;
      }

      const currentReactions = message.reactions || {};
      const newReactions = { ...currentReactions };

      if (newReactions[emoji]) {
        delete newReactions[emoji];
      } else {
        newReactions[emoji] = 1;
      }

      const updatedMessages = messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: Object.keys(newReactions).length ? newReactions : null,
            }
          : msg
      );
      setMessages(updatedMessages);

      const { error } = await supabase
        .from("messages")
        .update({
          reactions: Object.keys(newReactions).length > 0 ? newReactions : null,
        })
        .eq("id", messageId);

      if (error) {
        console.error("Error updating reaction:", error);
      } else {
        console.log("Reaction updated successfully");
      }
    } catch (err) {
      console.error("Error handling reaction:", err);
    }
  };

  const handleReplyToMessage = (message) => {
    setMessageToReply(message);
    document.querySelector('input[placeholder="พิมพ์ข้อความ..."]')?.focus();
  };

  const sendReplyMessage = async (content) => {
    if (!messageToReply) {
      return sendMessage("text", content);
    }

    const replyContent = {
      text: content,
      replyTo: {
        id: messageToReply.id,
        content: messageToReply.content,
        sender_id: messageToReply.sender_id,
      },
    };

    await sendMessage("reply", JSON.stringify(replyContent));
    setMessageToReply(null);
  };

  const handleTyping = (value) => {
    setNewMessage(value);

    if (chatId) {
      supabase.channel(`typing:${chatId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping: value.length > 0 },
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (chatId) {
          supabase.channel(`typing:${chatId}`).send({
            type: "broadcast",
            event: "typing",
            payload: { userId: currentUserId, isTyping: false },
          });
        }
      }, 3000);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (messageToReply) {
      sendReplyMessage(newMessage);
    } else {
      sendMessage("text", newMessage);
    }

    setNewMessage("");
    setMessageToReply(null);

    if (chatId) {
      supabase.channel(`typing:${chatId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping: false },
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFileToCloudinary(file);
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";
      sendMessage(type, url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("ไม่สามารถอัปโหลดไฟล์ได้");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleEndChat = () => {
    const active = chatRooms.find((c) => c.id === chatId);
    const iReviewed =
      Array.isArray(active?.reviewed_by) &&
      active.reviewed_by.includes(currentUserId);

    if (iReviewed) {
      alert("คุณรีวิวแล้ว • กำลังรออีกฝ่าย");
      return;
    }
    if (active?.status === "closed") {
      alert("ห้องนี้จบแล้ว");
      return;
    }
    setReviewOpen(true);
  };

  // 🔁 แทนที่ของเดิมทั้งก้อน
  const handleSubmitReview = async (payload) => {
    // payload รองรับทั้งแบบเดิม { rating, text } และแบบใหม่ที่มีรายมิติ
    const {
      rating,
      text,
      voice_tone,
      relevance,
      politeness,
      open_mindedness,
      friendliness,
      creativity,
      problem_solving,
    } = payload || {};

    const active = chatRooms.find((c) => c.id === chatId);
    const otherId = active?.otherUser?.id;

    if (!currentUserId || !otherId) {
      alert("ไม่สามารถส่งรีวิวได้: ไม่พบผู้ใช้อีกฝั่ง");
      return;
    }

    // helper: ให้ค่า null ถ้าไม่ใช่ตัวเลข 1–5 (กันค่าเพี้ยน/รองรับกรณียังไม่ส่งรายมิติ)
    const dim = (v) => (typeof v === "number" && v >= 1 && v <= 5 ? v : null);

    try {
      // 1) INSERT รีวิว (อนุญาตรีวิวซ้ำ) + รายมิติ (ถ้าไม่ส่งมาจะเป็น null)
      const { error: insertErr } = await supabase.from("reviews").insert({
        reviewer_id: currentUserId,
        reviewee_id: otherId,
        rating, // ⭐ ใช้คำนวณค่าเฉลี่ยรวมเหมือนเดิม
        text,
        chat_id: chatId,
        voice_tone: dim(voice_tone),
        relevance: dim(relevance),
        politeness: dim(politeness),
        open_mindedness: dim(open_mindedness),
        friendliness: dim(friendliness),
        creativity: dim(creativity),
        problem_solving: dim(problem_solving),
      });

      if (insertErr) throw insertErr;

      // 2) อัปเดตคะแนนรวมของผู้ถูกรีวิว (คำนวณจากคอลัมน์ rating เดิม)
      const { data: reviewStats, error: statError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", otherId);

      if (statError) throw statError;

      const ratings = (reviewStats || []).map((r) => r.rating);
      const reviews_count = ratings.length;
      const averageRating =
        reviews_count > 0
          ? ratings.reduce((a, b) => a + b, 0) / reviews_count
          : 0;

      await supabase
        .from("profiles")
        .update({
          rating: averageRating,
          reviews_count: reviews_count,
        })
        .eq("id", otherId);

      // 3) อัปเดตสถานะห้อง/รีวิวแล้วของใคร
      const { data: chatRow, error: chatRowErr } = await supabase
        .from("chats")
        .select("id, participants, reviewed_by, status")
        .eq("id", chatId)
        .single();
      if (chatRowErr) throw chatRowErr;

      const participants = Array.isArray(chatRow.participants)
        ? chatRow.participants
        : [];
      const reviewedBy = Array.isArray(chatRow.reviewed_by)
        ? chatRow.reviewed_by
        : [];

      const alreadyReviewed = reviewedBy.includes(currentUserId);
      const newReviewedBy = alreadyReviewed
        ? reviewedBy
        : Array.from(new Set([...reviewedBy, currentUserId]));

      let newStatus = "ended";
      if (
        participants.length > 0 &&
        participants.every((p) => newReviewedBy.includes(p))
      ) {
        newStatus = "closed";
      }

      if (!alreadyReviewed || chatRow.status !== newStatus) {
        const { error: updateChatErr } = await supabase
          .from("chats")
          .update({
            reviewed_by: newReviewedBy,
            status: newStatus,
          })
          .eq("id", chatId);
        if (updateChatErr) throw updateChatErr;
      }

      setReviewOpen(false);
      alert("ขอบคุณสำหรับรีวิว!");

      if (window.refreshChatRooms) window.refreshChatRooms();
      if (newStatus === "closed") {
        navigate("/matches");
      }
    } catch (err) {
      console.error("Error during review submission:", err);
      alert("เกิดข้อผิดพลาดในการส่งรีวิว: " + err.message);
    }
  };

  // สถานะห้อง / ปิด input เมื่อ ended/closed
  const activeChat = chatRooms.find((c) => c.id === chatId);
  const iReviewed =
    Array.isArray(activeChat?.reviewed_by) &&
    activeChat.reviewed_by.includes(currentUserId);
  const inputDisabled =
    uploading ||
    activeChat?.status === "ended" ||
    activeChat?.status === "closed";

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r overflow-y-auto flex-col md:flex">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">ข้อความ</h2>
        </div>
        <div className="flex-1">
          {chatRooms.map((chat) => {
            const unreadCount = unreadCounts[chat.id] || 0;
            const someoneTyping = Object.values(typingUsers).some(
              (typing) => typing
            );

            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/matches/${chat.id}`)}
                className={`p-3 flex items-center gap-3 cursor-pointer border-l-4 relative ${
                  chat.id === chatId
                    ? "bg-cyan-50 border-cyan-500"
                    : "border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <img
                    src={
                      chat.otherUser?.profile_pic_url ||
                      "https://i.pravatar.cc/150"
                    }
                    className="w-12 h-12 rounded-full object-cover"
                    alt={chat.otherUser?.display_name}
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p
                      className={`font-semibold truncate ${
                        unreadCount > 0 ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {chat.otherUser?.display_name}
                    </p>
                    {chat.last_message_timestamp && (
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(
                          chat.last_message_timestamp
                        ).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <p
                      className={`text-sm truncate flex-1 ${
                        unreadCount > 0
                          ? "text-gray-900 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {chat.id === chatId && someoneTyping ? (
                        <span className="text-cyan-600 italic flex items-center">
                          <span className="mr-1">กำลังพิมพ์</span>
                          <span className="flex space-x-1">
                            <div className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce"></div>
                            <div
                              className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </span>
                        </span>
                      ) : (
                        chat.last_message_text || "เริ่มการสนทนา..."
                      )}
                    </p>

                    {/* Badge สถานะห้อง */}
                    {chat.status === "ended" && (
                      <span className="ml-2 px-2 py-0.5 text-[11px] rounded bg-orange-100 text-orange-700 whitespace-nowrap">
                        รอรีวิวอีกฝั่ง
                      </span>
                    )}
                    {chat.status === "closed" && (
                      <span className="ml-2 px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-600 whitespace-nowrap">
                        จบแล้ว
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-gray-100">
        {activeChat ? (
          <>
            <header className="p-4 flex justify-between items-center border-b bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    navigate(`/profile/${activeChat.otherUser.id}`)
                  }
                >
                  <img
                    src={
                      activeChat.otherUser.profile_pic_url ||
                      "https://i.pravatar.cc/150"
                    }
                    className="w-10 h-10 object-cover rounded-full"
                    alt={activeChat.otherUser.display_name}
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      onlineUsers[activeChat.otherUser.id]?.isOnline
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                    title={
                      onlineUsers[activeChat.otherUser.id]?.isOnline
                        ? "ออนไลน์"
                        : "ออฟไลน์"
                    }
                  ></span>
                </div>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    navigate(`/profile/${activeChat.otherUser.id}`)
                  }
                >
                  <div className="font-semibold text-gray-800">
                    {activeChat.otherUser.display_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeChat.status === "ended" ? (
                      <span className="text-orange-600">
                        กำลังรออีกฝ่ายรีวิว
                      </span>
                    ) : activeChat.status === "closed" ? (
                      <span className="text-gray-600">ห้องนี้จบแล้ว</span>
                    ) : onlineUsers[activeChat.otherUser.id]?.isOnline ? (
                      <span className="text-green-600">ออนไลน์</span>
                    ) : (
                      <span>ออฟไลน์</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  title="ค้นหาข้อความ"
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  🔍
                </button>

                {/* ปุ่ม/ป้ายสำหรับรีวิว */}
                {!iReviewed && activeChat?.status !== "closed" && (
                  <button
                    onClick={handleEndChat}
                    className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    จบและรีวิว
                  </button>
                )}
                {iReviewed && activeChat?.status === "ended" && (
                  <span className="px-3 py-1 text-xs rounded bg-orange-100 text-orange-700">
                    คุณรีวิวแล้ว • รออีกฝ่าย
                  </span>
                )}
              </div>
            </header>

            {/* Search Bar */}
            {showSearch && (
              <div className="p-3 border-b bg-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาในข้อความ..."
                    className="w-full p-2 pl-8 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <div className="absolute left-2 top-2.5 text-gray-400">
                    🔍
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 text-sm text-gray-600">
                    พบ {filteredMessages.length} ข้อความจาก {messages.length}{" "}
                    ข้อความ
                  </div>
                )}
              </div>
            )}

            {/* Message List */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    currentUserId={currentUserId}
                    onReaction={handleReaction}
                    onReply={handleReplyToMessage}
                    onDelete={async (messageId) => {
                      try {
                        const { error } = await supabase
                          .from("messages")
                          .delete()
                          .eq("id", messageId);
                        if (error) throw error;
                        setMessages((prev) =>
                          prev.filter((m) => m.id !== messageId)
                        );
                      } catch (error) {
                        console.error("Error deleting message:", error);
                        alert("เกิดข้อผิดพลาดในการลบข้อความ");
                      }
                    }}
                    currentUserProfile={currentUserProfile}
                    otherUserProfile={activeChat?.otherUser}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p>ยังไม่มีการสนทนา</p>
                  <p className="text-sm">ส่งข้อความทักทายเพื่อเริ่มการสนทนา</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t bg-white">
              {/* Reply Preview */}
              {messageToReply && (
                <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-1">
                      ตอบกลับข้อความ:
                    </div>
                    <div className="text-sm text-gray-800 truncate">
                      {messageToReply.content}
                    </div>
                  </div>
                  <button
                    onClick={() => setMessageToReply(null)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="p-3 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  hidden
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  title="แนบไฟล์"
                  disabled={uploading}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "📎"
                  )}
                </button>
                <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder={
                        messageToReply ? "ตอบกลับข้อความ..." : "พิมพ์ข้อความ..."
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      disabled={inputDisabled}
                    />
                    {messageToReply && (
                      <div className="absolute left-2 top-0 -mt-1 bg-cyan-100 text-cyan-700 text-xs px-1 rounded">
                        ตอบกลับ
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || inputDisabled}
                    className="bg-cyan-600 text-white font-semibold px-5 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {messageToReply ? "ตอบ" : "ส่ง"}
                  </button>
                </form>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-center p-4">
            <div className="hidden md:block">
              <p className="text-lg">เลือกห้องแชททางด้านซ้าย</p>
              <p>เพื่อเริ่มการสนทนา</p>
            </div>
          </div>
        )}
      </main>

      {reviewOpen && activeChat && (
        <ReviewModal
          userToReview={activeChat.otherUser}
          onClose={() => setReviewOpen(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}

export default MatchPage;
