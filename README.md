# Parley

**Parley** is the AI conversation platform for Kennesaw State University faculty and staff.

![parley cover](./public/cover_parley.jpg)

## Features

- OpenAI integration with secure API key management
- Domain-restricted access for @kennesaw.edu users
- File uploads
- Clean, responsive UI with light/dark themes
- Built with Tailwind CSS, shadcn/ui, and prompt-kit
- Research-focused conversation templates
- Academic collaboration tools
- Usage tracking and analytics
- Single-threaded conversations for focused dialogue

## Quick Start

### Local Development

```bash
git clone https://github.com/kennesaw-edu/parley.git
cd parley
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key" >> .env.local
npm run dev
```

### Deployment

```bash
# Configure environment variables for production
# Deploy to Vercel or your preferred platform
vercel --prod
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/zola)

To unlock features like auth, file uploads, see [INSTALL.md](./INSTALL.md).

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
