import { Layout } from './components/Layout';
import { Board as BoardComponent } from './components/Board';
import { useQuery } from '@tanstack/react-query';
import { Board } from './types';

function App() {
  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await fetch('/api/boards');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
  });

  return (
    <Layout>
      <div className="container py-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
            Loading Boards...
          </div>
        ) : boards && boards.length > 0 ? (
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{boards[0].title}</h1>
            <p className="text-muted-foreground mb-8">{boards[0].description}</p>
            <BoardComponent boardId={boards[0].id} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-destructive">
            Failed to load boards.
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;