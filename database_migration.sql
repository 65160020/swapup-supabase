-- Database Migration Script for MatchPage Real-time Chat Features
-- Run this in your Supabase SQL Editor

-- 1. Add is_read column to messages table if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 2. Add reactions column to messages table for message reactions
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 3. Add reply_to column to messages table for reply functionality
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;

-- 4. Add index for better performance on unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender_read 
ON messages(chat_id, sender_id, is_read);

-- 5. Add index for better performance on chat ordering
CREATE INDEX IF NOT EXISTS idx_chats_last_message_timestamp 
ON chats(last_message_timestamp DESC);

-- 6. Add index for better performance on reactions queries
CREATE INDEX IF NOT EXISTS idx_messages_reactions 
ON messages USING GIN (reactions);

-- 7. Add index for reply functionality
CREATE INDEX IF NOT EXISTS idx_messages_reply_to 
ON messages(reply_to);

-- 8. Update existing messages to be marked as read (optional - for existing data)
-- Uncomment the line below if you want to mark all existing messages as read
-- UPDATE messages SET is_read = true WHERE is_read IS NULL;

-- 9. Create a function to automatically mark messages as read when fetched
CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_id_param UUID, user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = true 
  WHERE chat_id = chat_id_param 
    AND sender_id != user_id_param 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable Row Level Security (RLS) for messages if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policy for messages (users can only see messages in chats they participate in)
CREATE POLICY IF NOT EXISTS "Users can view messages in their chats" ON messages
FOR SELECT USING (
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = ANY(participants)
  )
);

-- 12. Create RLS policy for inserting messages
CREATE POLICY IF NOT EXISTS "Users can insert messages in their chats" ON messages
FOR INSERT WITH CHECK (
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = ANY(participants)
  )
  AND sender_id = auth.uid()
);

-- 13. Create RLS policy for updating messages (for read status and reactions)
CREATE POLICY IF NOT EXISTS "Users can update messages in their chats" ON messages
FOR UPDATE USING (
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = ANY(participants)
  )
) WITH CHECK (
  chat_id IN (
    SELECT id FROM chats 
    WHERE auth.uid() = ANY(participants)
  )
);

-- 14. Create function to get message with reply information
CREATE OR REPLACE FUNCTION get_messages_with_replies(chat_id_param UUID)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  sender_id UUID,
  content TEXT,
  type TEXT,
  is_read BOOLEAN,
  reactions JSONB,
  reply_to UUID,
  reply_content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.chat_id,
    m.sender_id,
    m.content,
    m.type,
    m.is_read,
    m.reactions,
    m.reply_to,
    rm.content as reply_content,
    m.created_at,
    m.updated_at
  FROM messages m
  LEFT JOIN messages rm ON m.reply_to = rm.id
  WHERE m.chat_id = chat_id_param
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
