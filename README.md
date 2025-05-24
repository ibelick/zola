# Zola

[zola.chat](https://zola.chat)

**Zola** is the open-source interface for AI chat.

[![Chat with this repo](https://zola.chat/button/github.svg)](https://zola.chat/?agent=github/ibelick/zola)

![zola screenshot](./public/cover_zola.webp)

## Features

- Multi-model support: OpenAI, Mistral, Claude, Gemini
- File uploads with context-aware answers
- Clean, responsive UI with light/dark themes
- Built with Tailwind, shadcn/ui, and prompt-kit
- Fully open-source and self-hostable
- Customizable: user system prompt, multiple layout options

## Agent Features (WIP)

- `@agent` mentions
- Early tool and MCP integration for agent workflows
- Foundation for more powerful, customizable agents (more coming soon)

## Installation

You can run Zola locally in seconds, all you need is an OpenAI API key.

```bash
git clone https://github.com/ibelick/zola.git
cd zola
npm install
echo "OPENAI_API_KEY=your-key" > .env.local
npm run dev
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibelick/zola)

To unlock features like auth, file uploads, and agents, see [INSTALL.md](./INSTALL.md).

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
