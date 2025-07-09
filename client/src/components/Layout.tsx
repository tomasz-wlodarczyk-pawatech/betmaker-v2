import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F0]">
      <main className="flex-grow container mx-auto p-0 ">{children}</main>

      <Toaster />
    </div>
  );
}
