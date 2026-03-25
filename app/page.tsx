export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-prose">
        <h1 className="text-3xl font-semibold tracking-tight">Project template</h1>
        <p className="text-muted-foreground">
          Claude Code has loaded <code className="text-sm bg-muted px-1.5 py-0.5 rounded">CLAUDE.md</code>.
          Open the Claude Code panel to begin the project setup routine.
        </p>
      </div>
    </main>
  )
}
