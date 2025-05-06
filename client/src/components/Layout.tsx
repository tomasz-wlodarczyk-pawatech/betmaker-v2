import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header based on PDF */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="text-primary font-bold text-lg">KSH 882.10</div>
          <nav className="hidden md:flex space-x-8">
            <button className="font-bold uppercase">Sports</button>
            <button className="uppercase">Live Now</button>
            <button className="uppercase">Casino</button>
          </nav>
          <div className="md:hidden">MENU</div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto space-x-6 py-3 -mx-4 px-4">
            <div className="flex items-center justify-center min-w-[80px] px-3 py-1 font-medium">
              <span>Live Now</span>
            </div>
            <div className="flex items-center justify-center min-w-[80px] px-3 py-1 font-medium">
              <span>Boosted</span>
            </div>
            <div className="flex items-center justify-center min-w-[80px] px-3 py-1 font-medium">
              <span>Champions L</span>
            </div>
            <div className="flex items-center justify-center min-w-[80px] px-3 py-1 font-medium">
              <span>Premier Leag</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Title */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <h1 className="font-bold text-lg uppercase">Football</h1>
        </div>
      </div>

      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <button className="flex flex-col items-center text-xs">
              <span>Menu</span>
            </button>
            <button className="flex flex-col items-center text-xs">
              <span>Sports</span>
            </button>
            <button className="flex flex-col items-center text-xs">
              <span>Betslip</span>
            </button>
            <button className="flex flex-col items-center text-xs">
              <span>My Bets</span>
            </button>
            <button className="flex flex-col items-center text-xs">
              <span>Account</span>
            </button>
          </div>
        </div>
      </nav>
      
      <Toaster />
    </div>
  );
}
