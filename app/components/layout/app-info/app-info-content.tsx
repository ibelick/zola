export function AppInfoContent() {
  return (
    <div className="space-y-4">
      <p className="text-foreground leading-relaxed">
        <span className="font-medium">Parley</span> is the AI conversation platform
        for Kennesaw State University faculty and staff.
        <br />
        Built specifically for academic research and collaboration.
        <br />
        Powered by OpenAI's advanced models with secure, university-managed access.
        <br />
      </p>
      <p className="text-foreground leading-relaxed">
        Designed for academic excellence with research-focused features,
        unlimited usage for KSU community, and enterprise-grade security.
      </p>
      <p className="text-foreground text-xs opacity-70">
        Based on the open-source{" "}
        <a
          href="https://github.com/ibelick/zola"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Zola project
        </a>{" "}
        by @ibelick
      </p>
    </div>
  )
}
