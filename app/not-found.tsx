export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">404 – Page not found</h1>
        <p className="text-muted-foreground mt-2">
          Sorry, this page doesn’t exist.
        </p>
      </div>
    </div>
  )
}
