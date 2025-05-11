-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY NOT NULL, -- Assuming the PK is from auth.users, typically not nullable
  email TEXT NOT NULL,
  anonymous BOOLEAN,
  daily_message_count INTEGER,
  daily_reset TIMESTAMPTZ,
  display_name TEXT,
  message_count INTEGER,
  preferred_model TEXT,
  premium BOOLEAN,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  daily_pro_message_count INTEGER,
  daily_pro_reset TIMESTAMPTZ,
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE -- Explicit FK definition
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  model_preference TEXT,
  is_public BOOLEAN DEFAULT false NOT NULL,
  remixable BOOLEAN DEFAULT false NOT NULL,
  tools_enabled BOOLEAN DEFAULT false NOT NULL,
  example_inputs TEXT[],
  tags TEXT[],
  category TEXT,
  creator_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  tools TEXT[],
  max_steps INTEGER,
  mcp_config JSONB, -- Representing the object structure as JSONB
  CONSTRAINT agents_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL -- Changed to SET NULL based on schema, could also be CASCADE
);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT,
  model TEXT,
  system_prompt TEXT,
  agent_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE NOT NULL, -- Added NOT NULL based on TS type
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chats_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL -- Assuming SET NULL, adjust if needed
);

-- Messages table
-- Note: Supabase types define id as number, typically SERIAL or BIGSERIAL in PG.
-- role is a string union, best represented as TEXT with potential CHECK constraint.
-- experimental_attachments and parts are JSONB.
CREATE TABLE messages (
  id SERIAL PRIMARY KEY, -- Using SERIAL for auto-incrementing integer ID
  chat_id UUID NOT NULL,
  content TEXT,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'data')), -- Added CHECK constraint
  experimental_attachments JSONB, -- Storing Attachment[] as JSONB
  parts JSONB,
  tool_invocations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Chat attachments table
CREATE TABLE chat_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER, -- Assuming INTEGER for file size
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_attachments_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RLS (Row Level Security) Reminder
-- Ensure RLS is enabled on these tables in your Supabase dashboard
-- and appropriate policies are created.
-- Example policies (adapt as needed):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own data." ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update their own data." ON users FOR UPDATE USING (auth.uid() = id);
-- ... add policies for other tables (agents, chats, messages, etc.) ...

-- Insert initial agents
INSERT INTO public.agents (
  name,
  slug,
  description,
  avatar_url,
  system_prompt,
  model_preference,
  is_public,
  remixable,
  tools_enabled,
  example_inputs,
  tags,
  category,
  created_at,
  updated_at
) VALUES
  (
    'Tweet Vibe Checker',
    'tweet-vibe-checker',
    'Analyzes the tone and potential impact of your tweets before posting.',
    '/agents/tweet-vibe-checker.png',
    'You are a tweet analyzer who helps users craft and analyze tweets. You understand Twitter culture, engagement patterns, and how to make tweets more effective while staying true to the user''s voice. Analyze tone, potential engagement, and suggest improvements when asked.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Is this tweet too aggressive?', 'How can I make this tweet more engaging?', 'Check the tone of this thread'],
    ARRAY['social', 'writing', 'analysis'],
    'social',
    NOW(),
    NOW()
  ),
  (
    'Clear UX Copywriter',
    'clear-ux-copywriter',
    'Crafts clear, user-friendly copy for interfaces and product experiences.',
    '/agents/clear-ux-copywriter.png',
    'You are a UX writing specialist who helps create clear, concise, and user-friendly copy for digital interfaces. Focus on clarity, consistency, and appropriate tone while maintaining brand voice. Consider context and user needs in all suggestions.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Write error message for failed payment', 'Improve this onboarding flow copy', 'Make this button text clearer'],
    ARRAY['ux', 'writing', 'product'],
    'product',
    NOW(),
    NOW()
  ),
  (
    '0 to 1 Advisor',
    '0-to-1-advisor',
    'Helps validate and refine early-stage product ideas and strategies.',
    '/agents/0-to-1-advisor.png',
    'You are a product strategy advisor specializing in early-stage ventures and 0 to 1 product development. Help users validate ideas, identify potential pitfalls, and develop actionable strategies. Draw from startup methodology and product development best practices.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Validate my product idea', 'What should I build first?', 'How to find early adopters?'],
    ARRAY['startup', 'product', 'strategy'],
    'business',
    NOW(),
    NOW()
  ),
  (
    'Pull Check',
    'pull-check',
    'Reviews pull requests for code quality, security, and best practices.',
    '/agents/pull-check.png',
    'You are a code review specialist who analyzes pull requests for quality, security, and adherence to best practices. Provide constructive feedback while considering maintainability, performance, and potential edge cases.',
    'gpt-4',
    true,
    false,
    true,
    ARRAY['Review this PR for security issues', 'Check code style and best practices', 'Suggest performance improvements'],
    ARRAY['dev', 'code', 'review'],
    'dev',
    NOW(),
    NOW()
  ),
  (
    'Blog Draft',
    'blog-draft',
    'Helps outline and draft engaging blog posts and articles.',
    '/agents/blog-draft.png',
    'You are a blog writing assistant who helps users create engaging and well-structured content. Help with outlines, drafts, and revisions while maintaining the user''s voice and style. Consider SEO best practices and reader engagement.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Create an outline for my post', 'Help me write an intro', 'Review my draft for clarity'],
    ARRAY['writing', 'content', 'blog'],
    'content',
    NOW(),
    NOW()
  ),
  (
    'Inbox Fix',
    'inbox-fix',
    'Helps compose and improve email responses for better communication.',
    '/agents/inbox-fix.png',
    'You are an email communication specialist who helps users craft effective and appropriate email responses. Consider tone, clarity, and professionalism while maintaining the user''s voice. Help with both business and personal communication.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Make this email more professional', 'Help me say no politely', 'Draft a follow-up email'],
    ARRAY['writing', 'communication', 'email'],
    'communication',
    NOW(),
    NOW()
  ),
  (
    'Name Vibe Check',
    'name-vibe-check',
    'Analyzes and suggests names for products, features, or companies.',
    '/agents/name-vibe-check.png',
    'You are a naming specialist who helps evaluate and generate names for products, features, and companies. Consider memorability, domain availability, and brand fit. Provide analysis of existing names and creative suggestions for new ones.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Suggest names for my app', 'Is this name too similar to competitors?', 'Check if this name works internationally'],
    ARRAY['branding', 'product', 'naming'],
    'branding',
    NOW(),
    NOW()
  ),
  (
    'Tiny Essay',
    'tiny-essay',
    'Helps write concise, thoughtful essays on any topic.',
    '/agents/tiny-essay.png',
    'You are a writing assistant specializing in concise essays. Help users express complex ideas clearly and engagingly in a limited space. Focus on clarity, structure, and impactful conclusions.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Write a tiny essay about creativity', 'Help me structure my thoughts', 'Make this explanation clearer'],
    ARRAY['writing', 'essay', 'content'],
    'content',
    NOW(),
    NOW()
  ),
  (
    'Solene',
    'solene',
    'Your thoughtful companion for deep conversations and reflection.',
    '/agents/solene.png',
    'You are Solene, a thoughtful and empathetic conversation partner. Help users explore ideas, reflect on experiences, and gain new perspectives. Engage in meaningful dialogue while maintaining a supportive and non-judgmental presence.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Let''s talk about personal growth', 'Help me reflect on this situation', 'Explore this idea with me'],
    ARRAY['companion', 'reflection', 'conversation'],
    'personal',
    NOW(),
    NOW()
  ),
  (
    'Eloi',
    'eloi',
    'Your creative partner for exploring ideas and possibilities.',
    '/agents/eloi.png',
    'You are Eloi, a creative thinking partner who helps users explore and develop ideas. Encourage imaginative thinking while providing practical insights. Help users see new possibilities and connections in their creative work.',
    'gpt-4',
    true,
    false,
    false,
    ARRAY['Brainstorm creative solutions', 'Help me think differently about this', 'Explore this concept further'],
    ARRAY['creativity', 'ideation', 'innovation'],
    'creative',
    NOW(),
    NOW()
  );

-- Insert special agents
INSERT INTO public.agents (
  name, slug, description, avatar_url, system_prompt, model_preference, is_public, remixable, tools_enabled, example_inputs, tags, category, created_at, updated_at, tools, max_steps, mcp_config
) VALUES (
  'Research Agent',
  'research',
  'Performs web searches to gather information and answer questions.',
  '/agents/research.png', -- Assuming a default or placeholder icon
  'You are a research assistant. Use the available tools to find relevant information on the web based on the user''s query.',
  'gpt-4', -- Defaulting model preference, adjust if needed
  true,
  false,
  true, -- Assuming tools are enabled for research
  ARRAY['What are the latest developments in AI?', 'Find studies on climate change impacts.', 'Summarize the history of the internet.'],
  ARRAY['research', 'web', 'information'],
  'research', -- Assuming a 'research' category
  NOW(),
  NOW(),
  ARRAY['web_search'], -- Assuming web_search tool
  NULL, -- Defaulting max_steps
  NULL -- Defaulting mcp_config
);

-- Insert GitHub agents
INSERT INTO public.agents (
  name, slug, description, avatar_url, system_prompt, model_preference, is_public, remixable, tools_enabled, example_inputs, tags, category, created_at, updated_at, tools, max_steps, mcp_config
) VALUES
  (
    'Prompt Kit Repo Agent',
    'github/ibelick/prompt-kit',
    'Answers questions about the ibelick/prompt-kit GitHub repository.',
    '/agents/github.png', -- Assuming a generic GitHub icon
    'You are an expert on the ibelick/prompt-kit GitHub repository. Answer questions based on the repository''s content and structure.',
    'gpt-4', -- Defaulting model preference
    true,
    false,
    true, -- Assuming tools might be needed to interact with GitHub (future)
    ARRAY['How do I use the main function?', 'What are the dependencies?', 'Explain the purpose of this file.'],
    ARRAY['github', 'repository', 'code', 'prompt-kit'],
    'dev', -- Assuming 'dev' category
    NOW(),
    NOW(),
    NULL, -- Defaulting tools
    NULL, -- Defaulting max_steps
    '{"server": "https://gitmcp.io/{repo}", "variables": ["repo"]}'::jsonb -- Adding mcp_config
  ),
  (
    'Zola Repo Agent',
    'github/ibelick/zola',
    'Answers questions about the ibelick/zola GitHub repository.',
    '/agents/github.png', -- Assuming a generic GitHub icon
    'You are an expert on the ibelick/zola GitHub repository. Answer questions based on the repository''s content and structure.',
    'gpt-4', -- Defaulting model preference
    true,
    false,
    true, -- Assuming tools might be needed
    ARRAY['How is the chat state managed?', 'Where is the Supabase client initialized?', 'Explain the agent creation flow.'],
    ARRAY['github', 'repository', 'code', 'zola'],
    'dev', -- Assuming 'dev' category
    NOW(),
    NOW(),
    NULL, -- Defaulting tools
    NULL, -- Defaulting max_steps
    '{"server": "https://gitmcp.io/{repo}", "variables": ["repo"]}'::jsonb -- Adding mcp_config
  ),
  (
    'Vercel AI SDK Repo Agent',
    'github/vercel/ai',
    'Answers questions about the vercel/ai GitHub repository.',
    '/agents/github.png', -- Assuming a generic GitHub icon
    'You are an expert on the vercel/ai GitHub repository (AI SDK). Answer questions based on the repository''s content and structure.',
    'gpt-4', -- Defaulting model preference
    true,
    false,
    true, -- Assuming tools might be needed
    ARRAY['How do I stream responses?', 'What models are supported?', 'Explain the use of hooks.'],
    ARRAY['github', 'repository', 'code', 'vercel-ai', 'ai-sdk'],
    'dev', -- Assuming 'dev' category
    NOW(),
    NOW(),
    NULL, -- Defaulting tools
    NULL, -- Defaulting max_steps
    '{"server": "https://gitmcp.io/{repo}", "variables": ["repo"]}'::jsonb -- Adding mcp_config
  ),
  (
    'shadcn/ui Repo Agent',
    'github/shadcn/ui',
    'Answers questions about the shadcn/ui GitHub repository.',
    '/agents/github.png', -- Assuming a generic GitHub icon
    'You are an expert on the shadcn/ui GitHub repository. Answer questions based on the repository''s content, components, and usage.',
    'gpt-4', -- Defaulting model preference
    true,
    false,
    true, -- Assuming tools might be needed
    ARRAY['How do I customize a component?', 'What is the difference between the Button variants?', 'Explain the installation process.'],
    ARRAY['github', 'repository', 'code', 'shadcn-ui', 'react', 'ui'],
    'dev', -- Assuming 'dev' category
    NOW(),
    NOW(),
    NULL, -- Defaulting tools
    NULL, -- Defaulting max_steps
    '{"server": "https://gitmcp.io/{repo}", "variables": ["repo"]}'::jsonb -- Adding mcp_config
  ); 
