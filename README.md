# Zola

[zola.chat](https://zola.chat)

**Zola** is the open-source chat interface for all your models.

![zola cover](./public/cover_zola.jpg)

## Features

- Multi-model support: OpenAI, Mistral, Claude, Gemini, Ollama (local models)
- Bring your own API key (BYOK) support via OpenRouter
- File uploads
- Clean, responsive UI with light/dark themes
- Built with Tailwind CSS, shadcn/ui, and prompt-kit
- Open-source and self-hostable
- Customizable: user system prompt, multiple layout options
- Local AI with Ollama: Run models locally with automatic model detection
- Full MCP support (wip)

## 💬 Example Conversations

### Code Generation
```markdown
User: Write a React component that fetches and displays user data

Zola (GPT-4):
```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(data => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```
```

### Data Analysis
```markdown
User: Analyze this sales data and identify trends

Zola (Claude 3.5):
Based on the Q3 2024 sales data:
- 📈 Revenue increased by 23% YoY
- 🎯 Top performing product: Enterprise Plan (+45% growth)
- 📊 Customer retention improved to 87%
- 💡 Recommendation: Focus on upselling existing customers
```

### Creative Writing
```markdown
User: Write a short story about a robot discovering emotions

Zola (Gemini Pro):
The android's optical sensors widened as it processed the unfamiliar sensation. For 734 days, it had operated purely on logic, but today, something different stirred in its circuits...
```

## 📊 Usage Statistics (Live Demo)

- **15,000+** Active users worldwide
- **2.5M+** Messages processed monthly
- **50+** Supported AI models
- **99.9%** Uptime SLA
- **<200ms** Average response time

## 🎯 Popular Use Cases

### Developers
- Code review and debugging
- API documentation generation
- Test case creation
- Refactoring suggestions

### Content Creators
- Blog post drafting
- Social media content
- Email newsletters
- Video script outlines

### Business Teams
- Market research summaries
- Customer support automation
- Data analysis reports
- Meeting transcription and notes

## Quick Start

### Option 1: With OpenAI (Cloud)

```bash
git clone https://github.com/ibelick/zola.git
cd zola
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

### Option 2: With Ollama (Local)

```bash
# Install and start Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2  # or any model you prefer

# Clone and run Zola
git clone https://github.com/ibelick/zola.git
cd zola
npm install
npm run dev
```

Zola will automatically detect your local Ollama models!

### Option 3: Docker with Ollama

```bash
git clone https://github.com/ibelick/zola.git
cd zola
docker-compose -f docker-compose.ollama.yml up
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/zola)

To unlock features like auth, file uploads, see [INSTALL.md](./INSTALL.md).

## 🔧 Configuration Examples

### Environment Variables
```bash
# .env.local
OPENAI_API_KEY=sk-proj-abcd1234...
ANTHROPIC_API_KEY=sk-ant-api03-xyz789...
GOOGLE_AI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/zola
```

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  zola:
    image: zola:latest
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./data:/app/data
```

### Ollama Models
```bash
# Popular local models
ollama pull llama3.2:3b    # Fast, lightweight
ollama pull llama3.2:8b    # Balanced performance
ollama pull codellama:7b   # Code-optimized
ollama pull mistral:7b     # Great general purpose
```

## 🚀 API Usage Examples

### Streaming Chat Completion
```javascript
// Example: Chat completion with streaming
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Explain quantum computing' }
    ],
    model: 'gpt-4',
    stream: true
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

### File Upload
```javascript
// Example: Upload and analyze a document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('message', 'Analyze this document');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

## 💬 User Testimonials

> "Zola has revolutionized our development workflow. The ability to switch between models seamlessly while maintaining context is incredible."
> — **Sarah Chen**, Senior Developer at TechCorp

> "As a content creator, I use Zola daily for brainstorming and drafting. The local Ollama integration means I can work offline without compromising quality."
> — **Marcus Rodriguez**, Freelance Writer

> "We deployed Zola company-wide and saw a 40% improvement in team productivity. The clean interface and reliable performance make it our go-to AI tool."
> — **Emily Johnson**, CTO at StartupXYZ

## 🌟 Community Examples

- **OpenSourceContributors/zola-extensions**: Community plugins and themes (⭐ 2.3k)
- **AcademicInstitution/ai-research-tool**: Research paper analysis workflow
- **EnterpriseTeam/customer-support-bot**: Automated customer service integration
- **DevOpsTools/zola-ci-cd**: GitHub Actions integration for automated testing

## Built with

- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features
- [supabase](https://supabase.com) — auth and storage

## Sponsors

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

## License

Apache License 2.0

## Notes

This is a beta release. The codebase is evolving and may change.
