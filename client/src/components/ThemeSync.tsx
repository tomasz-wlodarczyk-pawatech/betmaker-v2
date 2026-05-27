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
    // DEBUG: tymczasowe logi do diagnozy przepływu theme — usuń po naprawie.
    console.log(
      "[ThemeSync] listener aktywny | isTop=",
      window.self === window.top,
      "| data-theme na <html>=",
      document.documentElement.getAttribute("data-theme"),
    );

    const handleMessage = (event: MessageEvent<ThemeMessage>) => {
      // 1) KAŻDA wiadomość — zanim cokolwiek odfiltrujemy.
      console.log(
        "[ThemeSync] message:",
        event.data,
        "| origin=",
        event.origin,
        "| source===parent?",
        event.source === window.parent,
      );

      // 2) Bramka źródła (one-way: akceptujemy tylko od rodzica/hosta).
      if (event.source !== window.parent) {
        console.log("[ThemeSync] ↪ pominięte: source !== window.parent");
        return;
      }

      // 3) Bramka typu.
      if (event.data?.type !== "THEME_CHANGED") {
        console.log(
          "[ThemeSync] ↪ pominięte: type !== 'THEME_CHANGED' (dostałem:",
          event.data?.type,
          ")",
        );
        return;
      }

      // 4) Walidacja wartości.
      const theme = event.data.payload?.theme;
      if (!isValidTheme(theme)) {
        console.warn(
          "[ThemeSync] ⚠ THEME_CHANGED dotarł, ale payload.theme jest zły:",
          theme,
          "| pełny data:",
          event.data,
        );
        return;
      }

      // 5) Sukces — nakładamy theme (pawablox ustawi data-theme na <html>).
      console.log("[ThemeSync] ✅ setTheme(", theme, ")");
      setTheme(theme);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setTheme]);

  return null;
}
