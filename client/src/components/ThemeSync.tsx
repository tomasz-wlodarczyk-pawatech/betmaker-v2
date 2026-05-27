import { useEffect } from "react";
import { useTheme } from "@aliengain/components";

type ThemeMessage = {
  type?: string;
  payload?: { theme?: string };
};

function isValidTheme(theme: unknown): theme is "light" | "dark" {
  return theme === "light" || theme === "dark";
}

// Listens for theme updates pushed by the embedding host and mirrors them onto
// the pawablox ThemeProvider. The initial theme is seeded from ?theme= in index.html;
// this only handles live changes. One-way: the iframe never sends theme messages back.
export default function ThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ThemeMessage>) => {
      if (event.source !== window.parent) return;
      if (event.data?.type !== "THEME_CHANGED") return;

      const theme = event.data.payload?.theme;
      if (isValidTheme(theme)) {
        setTheme(theme);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setTheme]);

  return null;
}
