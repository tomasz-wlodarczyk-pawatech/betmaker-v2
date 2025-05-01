import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-center items-center bg-secondary text-white border-b">
        <img src="/assets/bplabslogo.png" alt="BP Labs Logo" className="h-10" />
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 max-w-5xl">
        {children}
      </main>

      <footer className="bg-neutral-dark text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} BetSlip Generator | All betting selections and odds are for demonstration purposes only.</p>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}
