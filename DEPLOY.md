# Parley Deployment Guide
## Kennesaw State University AI Conversation Platform

This guide covers deploying Parley to Vercel for KSU faculty and staff.

## Prerequisites

- OpenAI API Key (KSU provided)
- Supabase account and project
- Vercel account
- Domain access (theparley.org)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and anon key from Settings > API

### 1.2 Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  anonymous BOOLEAN,
  daily_message_count INTEGER,
  daily_reset TIMESTAMPTZ,
  display_name TEXT,
  favorite_models TEXT[],
  message_count INTEGER,
  premium BOOLEAN,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  daily_pro_message_count INTEGER,
  daily_pro_reset TIMESTAMPTZ,
  system_prompt TEXT,
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  title TEXT,
  model TEXT,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE NOT NULL,
  pinned BOOLEAN DEFAULT FALSE NOT NULL,
  pinned_at TIMESTAMPTZ NULL,
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chats_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id UUID NOT NULL,
  user_id UUID,
  content TEXT,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'data')),
  experimental_attachments JSONB,
  parts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  message_group_id TEXT,
  model TEXT
);

-- Chat attachments table
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  layout TEXT DEFAULT 'fullscreen',
  prompt_suggestions BOOLEAN DEFAULT true,
  show_tool_invocations BOOLEAN DEFAULT true,
  show_conversation_previews BOOLEAN DEFAULT true,
  multi_model_enabled BOOLEAN DEFAULT false,
  hidden_models TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Storage Setup
1. Go to Storage in your Supabase dashboard
2. Create bucket: `chat-attachments` (public)
3. Create bucket: `avatars` (public)

### 1.4 Authentication Setup
1. Go to Authentication > Providers
2. Enable "Magic Link" authentication
3. **IMPORTANT**: In Authentication > Settings, set:
   - Site URL: `https://theparley.org`
   - Redirect URLs: `https://theparley.org/auth/callback`

## Step 2: Vercel Deployment

### 2.1 Import Project
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Set Framework Preset to "Next.js"

### 2.2 Environment Variables
In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
OPENAI_API_KEY=your_ksu_openai_api_key
CSRF_SECRET=generate_with_openssl_rand_hex_32
ENCRYPTION_KEY=generate_with_openssl_rand_base64_32
PARLEY_OFFICIAL=true
```

### 2.3 Domain Setup
1. In Vercel project settings > Domains
2. Add custom domain: `theparley.org`
3. Follow Vercel's DNS configuration instructions
4. Update KSU DNS records as instructed

## Step 3: Security Configuration

### 3.1 Generate Secrets
```bash
# Generate CSRF secret
openssl rand -hex 32

# Generate encryption key
openssl rand -base64 32
```

### 3.2 Supabase RLS (Row Level Security)
Enable RLS policies in Supabase:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Similar policies for other tables (customize as needed)
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);
```

## Step 4: Testing

### 4.1 Domain Whitelist Test
1. Try logging in with a @kennesaw.edu email
2. Try logging in with a non-KSU email (should fail)
3. Verify magic link email delivery

### 4.2 Functionality Test
1. Create a new conversation
2. Upload a file (test 20MB limit)
3. Test various OpenAI models
4. Verify usage tracking in Supabase

## Step 5: Monitoring

### 5.1 Supabase Monitoring
- Monitor database usage in Supabase dashboard
- Set up alerts for high usage
- Monitor storage usage for file uploads

### 5.2 Vercel Monitoring
- Monitor function execution time
- Track error rates
- Monitor bandwidth usage

### 5.3 OpenAI Usage
- Monitor API usage in OpenAI dashboard
- Set up billing alerts
- Track per-user usage via Supabase

## Maintenance

### Regular Tasks
- Monitor usage patterns
- Update OpenAI models as they become available
- Review user feedback and usage analytics
- Backup Supabase database regularly

### Updates
- Deploy updates via Git push to main branch
- Test in staging environment first
- Monitor deployment logs in Vercel

## Support

For technical issues:
- Check Vercel deployment logs
- Review Supabase logs
- Monitor OpenAI API status

For user support:
- Direct faculty/staff to email support or IT helpdesk
- Document common issues and solutions