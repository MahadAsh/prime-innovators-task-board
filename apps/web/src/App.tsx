function App() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 max-w-sm">
        <h1 className="text-2xl font-bold mb-2">System Online</h1>
        <p className="text-muted-foreground mb-4">
          Tailwind CSS, design tokens, and React are communicating perfectly.
        </p>
        <button className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-md font-medium">
          Initialize Kanban Board
        </button>
      </div>
    </div>
  )
}

export default App