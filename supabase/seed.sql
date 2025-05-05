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
    NULL -- Defaulting mcp_config
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
    NULL -- Defaulting mcp_config
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
    NULL -- Defaulting mcp_config
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
    NULL -- Defaulting mcp_config
  ); 
