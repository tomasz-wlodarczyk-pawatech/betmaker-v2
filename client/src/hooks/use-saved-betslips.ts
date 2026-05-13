import { useCallback, useEffect, useState } from "react";
import { BetSlipSelection } from "@/types";

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

function read(): SavedBetslip[] {
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

function write(next: SavedBetslip[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l(next));
}

export function useSavedBetslips() {
  const [slips, setSlips] = useState<SavedBetslip[]>(() => read());

  useEffect(() => {
    listeners.add(setSlips);
    return () => {
      listeners.delete(setSlips);
    };
  }, []);

  const add = useCallback((slip: Omit<SavedBetslip, "id" | "savedAt">) => {
    const next: SavedBetslip = {
      ...slip,
      id: `${slip.bookingCode}-${Date.now()}`,
      savedAt: Date.now(),
    };
    const existing = read();
    if (existing.some((s) => s.bookingCode === next.bookingCode)) {
      return next;
    }
    write([next, ...existing]);
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((s) => s.id !== id));
  }, []);

  return { slips, add, remove };
}
