import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--colors-background-default)",
      }}
    >
      <main
        style={{
          flex: "1 1 auto",
          width: "100%",
          maxWidth: "32rem",
          margin: "0 auto",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
