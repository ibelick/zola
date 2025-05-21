# Zola

[zola.chat](https://zola.chat)

**Zola** is a free, open-source AI chat app with multi-model support.

[![Chat with this repo](https://zola.chat/button/github.svg)](https://zola.chat/?agent=github/ibelick/zola)

![zola screenshot](./public/cover_zola.webp)

## Features

- Multi-model support: OpenAI, Mistral, Claude, Gemini
- `@agent` mentions to customize behavior or chat with GitHub repos
- File uploads with context-aware answers
- Prompt suggestions to guide input
- Clean, responsive UI with light/dark themes
- Built with Tailwind, shadcn/ui, and prompt-kit
- Early support for tools and MCPs
- Fully open-source and self-hostable

## Installation

You can run Zola locally in seconds, all you need is an OpenAI API key.

```bash
git clone https://github.com/ibelick/zola.git
cd zola
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

To unlock features like auth, file uploads, and agents, see [INSTALL.md](./INSTALL.md).

## Built with

- [prompt-kit](https://prompt-kit.com/) — AI components
- [shadcn/ui](https://ui.shadcn.com) — core components
- [motion-primitives](https://motion-primitives.com) — animated components
- [vercel ai sdk](https://vercel.com/blog/introducing-the-vercel-ai-sdk) — model integration, AI features
- [supabase](https://supabase.com) — auth and storage

## Coming next

- more model support
- search
- improve agent / MCP layer and capabilities

## Sponsors

Zola is proudly sponsored by [Vercel](https://vercel.com),
the platform we use to build, preview, and ship the app.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/zola)

## License

Apache License 2.0

## Notes

This is a beta release. The codebase is evolving and may change.

```

```
