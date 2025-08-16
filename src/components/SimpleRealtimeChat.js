import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const SimpleRealtimeChat = ({ chatId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      console.log('Fetching messages for chat:', chatId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        console.log('Messages fetched:', data);
        setMessages(data || []);
      }
    };

    fetchMessages();
  }, [chatId]);

  // Real-time subscription
  useEffect(() => {
    if (!chatId) return;

    console.log('Setting up real-time subscription for chat:', chatId);

    const channel = supabase
      .channel(`simple-chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        console.log('NEW MESSAGE RECEIVED:', payload.new);
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (!exists) {
            console.log('Adding new message to state');
            return [...prev, payload.new];
          }
          console.log('Message already exists, skipping');
          return prev;
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        console.log('MESSAGE UPDATED:', payload.new);
        setMessages(prev => prev.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        ));
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId || isLoading) return;

    setIsLoading(true);
    console.log('Sending message:', newMessage);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          type: 'text',
          content: newMessage.trim()
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
      } else {
        console.log('Message sent successfully:', data);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-white">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold">Simple Real-time Chat Test</h3>
        <p className="text-sm text-gray-600">Chat ID: {chatId}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg max-w-xs ${
              msg.sender_id === currentUserId
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {new Date(msg.created_at).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default SimpleRealtimeChat;
