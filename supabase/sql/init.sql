-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users and roles for Supabase
CREATE USER supabase_auth_admin WITH PASSWORD 'root' SUPERUSER;
CREATE USER supabase_admin WITH PASSWORD 'root' SUPERUSER;
CREATE USER authenticator WITH PASSWORD 'yourpassword' NOINHERIT;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

-- Grant roles to authenticator
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Create database schema for messaging
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS _realtime;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS graphql_public;

-- Set up Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';

-- Messages table
CREATE TABLE public.messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    content text NOT NULL,
    conversation_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversations table to track conversation metadata
CREATE TABLE public.conversations (
    id text PRIMARY KEY,
    user1_id text NOT NULL,
    user2_id text NOT NULL,
    last_message_id uuid,
    last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Message attachments table (for future file sharing)
CREATE TABLE public.message_attachments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        auth.uid()::text = sender_id OR 
        auth.uid()::text = receiver_id
    );

CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id
    );

CREATE POLICY "Users can update their own messages or messages sent to them" ON public.messages
    FOR UPDATE USING (
        auth.uid()::text = sender_id OR 
        auth.uid()::text = receiver_id
    );

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid()::text = user1_id OR 
        auth.uid()::text = user2_id
    );

CREATE POLICY "Users can create conversations where they are a participant" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid()::text = user1_id OR 
        auth.uid()::text = user2_id
    );

CREATE POLICY "Users can update their conversations" ON public.conversations
    FOR UPDATE USING (
        auth.uid()::text = user1_id OR 
        auth.uid()::text = user2_id
    );

-- RLS Policies for message attachments
CREATE POLICY "Users can view attachments in their messages" ON public.message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages 
            WHERE messages.id = message_attachments.message_id 
            AND (messages.sender_id = auth.uid()::text OR messages.receiver_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert attachments to their messages" ON public.message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages 
            WHERE messages.id = message_attachments.message_id 
            AND messages.sender_id = auth.uid()::text
        )
    );

-- Functions for realtime subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_message() 
RETURNS TRIGGER AS $$
BEGIN
    -- Update or create conversation
    INSERT INTO public.conversations (id, user1_id, user2_id, last_message_id, last_message_at, updated_at)
    VALUES (
        NEW.conversation_id,
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id),
        NEW.id,
        NEW.created_at,
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new messages
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message();

-- Function to get conversation for two users
CREATE OR REPLACE FUNCTION get_conversation_id(user1_id text, user2_id text) 
RETURNS text AS $$
BEGIN
    RETURN LEAST(user1_id, user2_id) || '_' || GREATEST(user1_id, user2_id);
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_id_param text, user_id_param text) 
RETURNS void AS $$
BEGIN
    UPDATE public.messages 
    SET is_read = true, updated_at = timezone('utc'::text, now())
    WHERE conversation_id = conversation_id_param 
    AND receiver_id = user_id_param 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Grant permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO public.messages (sender_id, receiver_id, content, conversation_id) VALUES
-- ('test-user-1', 'test-user-2', 'Hello from user 1!', 'test-user-1_test-user-2'),
-- ('test-user-2', 'test-user-1', 'Hi back from user 2!', 'test-user-1_test-user-2');
