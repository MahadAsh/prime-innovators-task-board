import { Layout } from "./components/Layout";
import { Board as BoardComponent } from "./components/Board";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Board } from "./types";
import { useState, useEffect } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import { Link, Check } from "lucide-react";
import { useAppStore } from "./store/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";

function LoginModal() {
  const { activeUserId, setActiveUser } = useAppStore();
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  // Create a mutation to add a new user to the mock DB
  const createUserMutation = useMutation({
    mutationFn: async (userName: string) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName }),
      });
      return res.json();
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActiveUser(newUser.id);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createUserMutation.mutate(name.trim());
    }
  };

  return (
    <Dialog open={!activeUserId}>
      <DialogContent hideCloseButton className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to PrimeInnovators Board</DialogTitle>
          <DialogDescription>
            Please enter your name to join the workspace and start
            collaborating.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mahad or Saeed"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={createUserMutation.isPending}
          />
          <DialogFooter>
            <button
              type="submit"
              disabled={!name.trim() || createUserMutation.isPending}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {createUserMutation.isPending ? "Joining..." : "Join Board"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BoardRoute() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const [boardTitle, setBoardTitle] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Fetch the specific board instead of all boards
  const {
    data: board,
    isLoading,
    error,
  } = useQuery<Board>({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards`);
      if (!res.ok) throw new Error("Network response was not ok");
      const boards: Board[] = await res.json();
      const found = boards.find((b) => b.id === boardId);
      if (!found) throw new Error("Board not found");
      return found;
    },
    enabled: !!boardId,
  });

  const updateBoardMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Board>;
    }) => {
      const res = await fetch(`/api/boards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  useEffect(() => {
    if (board) {
      setBoardTitle(board.title);
    }
  }, [board]);

  const handleSaveTitle = () => {
    if (board && boardTitle !== board.title && boardTitle.trim()) {
      updateBoardMutation.mutate({
        id: board.id,
        updates: { title: boardTitle.trim() },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
        Loading Board...
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Failed to load board.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <input
          value={boardTitle}
          onChange={(e) => setBoardTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={handleKeyDown}
          placeholder="Enter your Project Name..."
          className="text-3xl font-bold bg-transparent border border-transparent hover:border-input hover:bg-secondary/30 outline-none focus:border-ring focus:bg-background rounded px-2 py-2 -ml-2 w-full max-w-[600px] text-foreground transition-all cursor-text placeholder:text-muted-foreground/50 placeholder:font-normal leading-normal"
        />
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded border border-border transition-colors flex-shrink-0"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Link className="w-4 h-4" />
          )}
          {isCopied ? "Copied Link" : "Share"}
        </button>
      </div>
      <p className="text-muted-foreground mb-8 px-2 -ml-2">
        {board.description}
      </p>
      <BoardComponent boardId={board.id} />
    </div>
  );
}

function DefaultRedirect() {
  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await fetch("/api/boards");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
  });

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
        Loading Workspace...
      </div>
    );

  if (boards && boards.length > 0) {
    return <Navigate to={`/b/${boards[0].id}`} replace />;
  }

  return (
    <div className="flex-1 flex items-center justify-center text-destructive">
      No boards found.
    </div>
  );
}

function App() {
  return (
    <Layout>
      <LoginModal />
      <div className="container py-6 flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/b/:boardId" element={<BoardRoute />} />
        </Routes>
      </div>
    </Layout>
  );
}

export default App;
