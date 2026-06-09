import { useCallback, useEffect, useState } from "react";
import { BetSlipSelection } from "@/types";
import { COUNTRIES } from "@/lib/countries";
import {
  fetchSavedBetslipsFromPreferences,
  saveBetslipsToPreferences,
} from "@/lib/api";

const STORAGE_KEY = "betmaker.savedBetslips.v1";

export interface SavedBetslip {
  id: string;
  bookingCode: string;
  totalOdds: number;
  selections: BetSlipSelection[];
  mode: "all" | "hot" | "fav";
  time: "any" | "today" | "3h" | "48h" | "72h";
  domain: string;
  savedAt: number;
}

type Listener = (slips: SavedBetslip[]) => void;
const listeners = new Set<Listener>();
let cache: SavedBetslip[] | null = null;

function readLocal(): SavedBetslip[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SavedBetslip[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

// Update the in-memory cache, mirror it to localStorage (fast local store /
// logged-out fallback), and notify every mounted hook so the UI stays in sync.
function setSlips(next: SavedBetslip[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l(next));
}

// Lobby context for the preference API. `sid` is only present when the user is
// logged in to the lobby; without it we stay localStorage-only. The country
// segment is validated server-side but the upstream is keyed by brand, so a
// brand→country lookup (falling back to "gh") is sufficient.
function getPreferenceContext(): {
  token: string | null;
  brand: string | null;
  country: string;
} {
  if (typeof window === "undefined") {
    return { token: null, brand: null, country: "gh" };
  }
  const params = new URLSearchParams(window.location.search);
  const token = params.get("sid");
  const brand = params.get("brand");
  const country = (
    COUNTRIES.find((c) => c.brandIdentifier === brand)?.countryIso2Code || "gh"
  ).toLowerCase();
  return { token, brand, country };
}

// One-shot load of saved betslips from the user's preferences. When logged in
// and the server has slips, the server document is the source of truth and
// replaces the local cache (cross-device sync). An *empty* server document does
// NOT wipe local slips — the save stays additive, and the next add/remove syncs
// the local list up. Any failure (e.g. expired token) is swallowed so the
// existing localStorage list keeps working.
let prefsLoadStarted = false;
function ensurePrefsLoaded() {
  if (prefsLoadStarted) return;
  prefsLoadStarted = true;
  const { token, brand, country } = getPreferenceContext();
  if (!token || !brand) return;
  void (async () => {
    try {
      const remote = await fetchSavedBetslipsFromPreferences(
        country,
        brand,
        token,
      );
      if (remote.length > 0) {
        setSlips(remote);
      }
    } catch (err) {
      console.error("Failed to load saved betslips from preferences:", err);
    }
  })();
}

// Best-effort write-through to preferences after an optimistic local update.
// Logged-out users (no token) stay localStorage-only. On failure the optimistic
// local state is kept; the next load reconciles against the server.
function persistToPreferences(next: SavedBetslip[]) {
  const { token, brand, country } = getPreferenceContext();
  if (!token || !brand) return;
  void (async () => {
    try {
      await saveBetslipsToPreferences(country, brand, token, next);
    } catch (err) {
      console.error("Failed to sync saved betslips to preferences:", err);
    }
  })();
}

export function useSavedBetslips() {
  const [slips, setSlipsState] = useState<SavedBetslip[]>(() => readLocal());

  useEffect(() => {
    listeners.add(setSlipsState);
    ensurePrefsLoaded();
    return () => {
      listeners.delete(setSlipsState);
    };
  }, []);

  const add = useCallback((slip: Omit<SavedBetslip, "id" | "savedAt">) => {
    const next: SavedBetslip = {
      ...slip,
      id: `${slip.bookingCode}-${Date.now()}`,
      savedAt: Date.now(),
    };
    const existing = readLocal();
    if (existing.some((s) => s.bookingCode === next.bookingCode)) {
      return next;
    }
    const updated = [next, ...existing];
    setSlips(updated);
    persistToPreferences(updated);
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    const updated = readLocal().filter((s) => s.id !== id);
    setSlips(updated);
    persistToPreferences(updated);
  }, []);

  return { slips, add, remove };
}
