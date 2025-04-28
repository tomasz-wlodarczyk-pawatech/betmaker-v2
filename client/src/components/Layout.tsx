import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-secondary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">BetSlip Generator</h1>
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 max-w-5xl">
        {children}
      </main>

      <footer className="bg-neutral-dark text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} BetSlip Generator | All betting selections and odds are for demonstration purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
