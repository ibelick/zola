# Parley

**Parley** is the AI conversation platform for Kennesaw State University faculty and staff.

Built with the open-source [Zola](https://github.com/ibelick/zola) project by [@ibelick](https://github.com/ibelick).

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
git clone https://github.com/ngoldbla/parley.git
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ngoldbla/parley)

To unlock features like auth, file uploads, see [INSTALL.md](./INSTALL.md).

## Built with

- [Zola](https://github.com/ibelick/zola) — open-source AI chat interface foundation
- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features
- [supabase](https://supabase.com) — auth and storage

## Sponsors

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

## Acknowledgments

This project is built upon the excellent open-source [Zola](https://github.com/ibelick/zola) project by [@ibelick](https://github.com/ibelick). Zola provides a robust foundation for AI chat interfaces with multi-model support and self-hosting capabilities.

**Original Project**: [github.com/ibelick/zola](https://github.com/ibelick/zola)

Parley customizes and extends Zola specifically for academic use at Kennesaw State University, with features tailored for faculty and staff research collaboration.

## License

Apache License 2.0

## Notes

This is a customized version for Kennesaw State University. For the original open-source project, visit [Zola](https://github.com/ibelick/zola).
