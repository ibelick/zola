export function LinkMarkdown({
  href,
  children,
  ...props
}: React.ComponentProps<"a">) {
  if (!href) return <span {...props}>{children}</span>

  const domain = href ? new URL(href).hostname : ""

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-muted text-muted-foreground hover:bg-muted-foreground/30 hover:text-primary inline-flex h-5 max-w-32 items-center gap-1 overflow-hidden rounded-full py-0 pr-2 pl-0.5 text-xs leading-none overflow-ellipsis whitespace-nowrap no-underline transition-colors duration-150"
    >
      <img
        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${href}`}
        alt="favicon"
        className="size-3.5 rounded-full"
      />
      <span className="overflow-hidden font-normal text-ellipsis whitespace-nowrap">
        {domain.replace("www.", "")}
      </span>
    </a>
  )
}
