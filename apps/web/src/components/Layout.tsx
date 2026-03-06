import { useEffect } from "react";
import { KanbanSquare, User, Moon, Sun } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "../types";
import AnimatedBackground from "./AnimatedBackground";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme, activeUserId } = useAppStore();

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
  });

  const activeUser = users?.find((u) => u.id === activeUserId);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background/10 backdrop-blur-3xl dark:bg-background/70 dark:backdrop-blur-none text-foreground transition-all duration-300 relative">
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <AnimatedBackground speed={1.0} hueShift={0} noiseIntensity={0.05} scanlineIntensity={0.0} scanlineFrequency={0.0} warpAmount={2.0} />
      </div>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-foreground transition-colors">
            <KanbanSquare className="h-6 w-6" />
            <span>PrimeInnovators Board</span>
          </div>

          <nav className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 dark:border-zinc-200 bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center overflow-hidden border">
                {activeUser?.avatarUrl ? (
                  <img
                    src={activeUser.avatarUrl}
                    alt={activeUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="hidden sm:inline-block">
                {activeUser?.name || "Loading..."}
              </span>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};
