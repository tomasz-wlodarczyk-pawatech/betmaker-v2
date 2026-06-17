import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import axios from "axios";

import {
  generateBetslipSchema,
  generateBookingCodeSchema,
  availableFiltersSchema,
  switchSelectionSchema,
  savedBetslipsPreferenceSchema,
} from "@shared/schema";
import {
  generateBetslip,
  findReplacementSelection,
  filterEvents,
} from "./services/betslipService";
import {
  getPopularEvents,
  getCategories,
  getPreferences,
  setPreferences,
} from "./services/pawagate";

// Build the league filter list from the football categories catalogue. The
// upstream nests competitions as `withRegions[].regions[].competitions[]`; we
// flatten each into the same `"<sport> - <region> - <competition>"` string the
// events carry in their `competition` field, so the selection still matches when
// the generator filters popular events. The `preferred` flag marks a competition
// as a popular league. `regionSlugs` maps each region's display name to its
// upstream slug so the client can resolve a country flag from it.
function extractLeaguesFromCategories(raw: unknown): {
  leagues: string[];
  popularLeagues: string[];
  regionSlugs: Record<string, string>;
} {
  const withRegions = (raw as { withRegions?: any[] })?.withRegions;
  if (!Array.isArray(withRegions)) {
    return { leagues: [], popularLeagues: [], regionSlugs: {} };
  }

  const leagueSet = new Set<string>();
  const popularSet = new Set<string>();
  const regionSlugs: Record<string, string> = {};

  for (const entry of withRegions) {
    const sport = entry?.category?.name;
    if (typeof sport !== "string") continue;
    for (const regionEntry of entry?.regions ?? []) {
      const region = regionEntry?.region?.name;
      if (typeof region !== "string") continue;
      const slug = regionEntry?.region?.slug;
      if (typeof slug === "string" && !(region in regionSlugs)) {
        regionSlugs[region] = slug;
      }
      for (const compEntry of regionEntry?.competitions ?? []) {
        const competition = compEntry?.competition;
        const name = competition?.name;
        if (typeof name !== "string") continue;
        const raw = `${sport} - ${region} - ${name}`;
        leagueSet.add(raw);
        if (competition?.preferred === true) {
          popularSet.add(raw);
        }
      }
    }
  }

  return {
    leagues: Array.from(leagueSet).sort(),
    popularLeagues: Array.from(popularSet).sort(),
    regionSlugs,
  };
}

// List of supported country codes
const SUPPORTED_COUNTRIES = [
  "ao",
  "bj",
  "bw",
  "cd",
  "cf",
  "cg",
  "ci",
  "cm",
  "ga",
  "gh",
  "ke",
  "lr",
  "ls",
  "mw",
  "mz",
  "ng",
  "rw",
  "sl",
  "sn",
  "tz",
  "ug",
  "zm",
  "zw",
];

// Pull the lobby session token out of the Authorization header. The token
// (`sid`) is passed to the miniapp by the App Lobby only when the user is
// logged in; the client forwards it here so this proxy can authenticate the
// preference calls upstream.
function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  return token || null;
}

// Get country code from request or default to 'gh'
function getCountryCode(req: Request): string | null {
  const countryCode = req.params.country?.toLowerCase();

  if (!countryCode) {
    return null;
  }

  if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
    return null;
  }

  return countryCode;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy endpoint for fetching country data

  // Country-specific API endpoint to generate a betslip
  app.post("/api/:country/betslip/generate", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const {
        targetOdds,
        brandIdentifier,
        selectionMode,
        minSelections,
        maxSelections,
        minLegOdds,
        maxLegOdds,
        timeRange,
        selectedLeagues,
        selectedMarkets,
      } = generateBetslipSchema.parse(req.body);

      const raw = (await getPopularEvents(brandIdentifier)) as
        | unknown[]
        | { status?: string; data?: unknown[] };

      const allEvents: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? ((raw as { data: unknown[] }).data as any[])
          : [];

      const events = filterEvents(allEvents, {
        selectedLeagues,
        selectedMarkets,
        timeRange,
      });

      const betslip = await generateBetslip(events, targetOdds, 0.15, {
        selectionMode,
        minSelections,
        maxSelections,
        minLegOdds,
        maxLegOdds,
      });

      if (!betslip) {
        return res
          .status(404)
          .json({ message: "No suitable betslip found for the target odds" });
      }

      res.json(betslip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error generating betslip:", error);
      res.status(500).json({ message: "Failed to generate betslip" });
    }
  });

  // Country-specific API endpoint to generate BetPawa booking code
  app.post("/api/:country/booking/generate", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const { selectionIds, brandIdentifier } = generateBookingCodeSchema.parse(
        req.body,
      );

      const pawagateBase =
        process.env.PAWAGATE_BASE_URL || "https://miniapps.betpawa.com";
      const miniappEnv = process.env.MINIAPP_ENV || "production";
      const appOrigin = process.env.APP_ORIGIN || "";

      const responseDomain = await axios.get(
        `${pawagateBase}/api/brand/v1/countries/betpawa`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-miniapp-env": miniappEnv,
            "x-pawa-brand": brandIdentifier,
            ...(appOrigin ? { Origin: appOrigin } : {}),
          },
        },
      );

      const domainData = responseDomain.data.find(
        (e: any) => e.brandIdentifier === brandIdentifier,
      )?.rootDomain;

      const response = await axios.post(
        `${pawagateBase}/api/sportsbook/v2/booking-number`,
        { selections: selectionIds },
        {
          headers: {
            "Content-Type": "application/json",
            "x-miniapp-env": miniappEnv,
            "x-pawa-brand": brandIdentifier,
            "x-pawa-language": "en",
            ...(appOrigin ? { Origin: appOrigin } : {}),
          },
        },
      );

      return res.json({
        bookingCode: response.data.code,
        domain: domainData
          ? `https://${domainData}`
          : "http://gh.staging.betpawa.local:3000",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }

      console.error("Error generating booking code:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to generate booking code";
        return res.status(status).json({ message });
      }

      res.status(500).json({ message: "Failed to generate booking code" });
    }
  });

  // Country-specific API endpoint to swap a single leg of a betslip
  app.post("/api/:country/selection/switch", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const {
        brandIdentifier,
        currentSelectionId,
        excludeEventIds,
        selectionMode,
        targetOdds,
        currentTotalOdds,
        replacedSelectionOdds,
        timeRange,
        selectedLeagues,
        selectedMarkets,
        minLegOdds,
        maxLegOdds,
      } = switchSelectionSchema.parse(req.body);

      const raw = (await getPopularEvents(brandIdentifier)) as
        | unknown[]
        | { status?: string; data?: unknown[] };

      const allEvents: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? ((raw as { data: unknown[] }).data as any[])
          : [];

      const events = filterEvents(allEvents, {
        selectedLeagues,
        selectedMarkets,
        timeRange,
      });

      const selection = findReplacementSelection(events, {
        excludeEventIds,
        currentSelectionId,
        replacedSelectionOdds,
        targetOdds,
        currentTotalOdds,
        selectionMode,
        minLegOdds,
        maxLegOdds,
      });

      // No replacement is an expected soft outcome (e.g. every fresh event is
      // already in the slip), so return 200 with a null selection rather than
      // an error the client would surface as a failure.
      return res.json({ selection });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error switching selection:", error);
      res.status(500).json({ message: "Failed to switch selection" });
    }
  });

  app.post("/api/:country/filters/available", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const { brandIdentifier } = availableFiltersSchema.parse(req.body);

      // Leagues come from the football categories catalogue (full competition
      // list with a `preferred` popularity flag); markets stay derived from the
      // popular events. The categories call is non-fatal — if it fails we fall
      // back to the leagues present in the popular events so the panel still
      // works.
      const [rawEvents, rawCategories] = await Promise.all([
        getPopularEvents(brandIdentifier),
        getCategories(brandIdentifier).catch((err) => {
          console.error("Error fetching categories:", err);
          return null;
        }),
      ]);

      const events: any[] = Array.isArray(rawEvents)
        ? rawEvents
        : Array.isArray((rawEvents as { data?: unknown[] })?.data)
          ? ((rawEvents as { data: unknown[] }).data as any[])
          : [];

      const marketSet = new Set<string>();
      const fallbackLeagueSet = new Set<string>();
      for (const ev of events) {
        if (typeof ev?.competition === "string") {
          fallbackLeagueSet.add(ev.competition);
        }
        if (Array.isArray(ev?.markets)) {
          for (const m of ev.markets) {
            if (typeof m?.name === "string") marketSet.add(m.name);
          }
        }
      }

      let { leagues, popularLeagues, regionSlugs } =
        extractLeaguesFromCategories(rawCategories);
      if (leagues.length === 0) {
        leagues = Array.from(fallbackLeagueSet).sort();
        popularLeagues = [];
        regionSlugs = {};
      }

      return res.json({
        leagues,
        popularLeagues,
        regionSlugs,
        markets: Array.from(marketSet).sort(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }

      console.error("Error fetching filters:", error);
      res.status(500).json({ message: "Failed to fetch filters" });
    }
  });

  // Read the user's saved betslips from their miniapp preferences. Requires a
  // logged-in session token (forwarded as a Bearer header by the client).
  app.get("/api/:country/preferences/betslips", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const brand =
        typeof req.query.brand === "string" ? req.query.brand : undefined;

      const prefs = await getPreferences(token, brand);
      const savedBetslips = Array.isArray(prefs.savedBetslips)
        ? prefs.savedBetslips
        : [];

      return res.json({ savedBetslips });
    } catch (error) {
      const upstream = error as { status?: number; body?: string };
      console.error(
        "Error fetching saved betslips from preferences:",
        upstream?.status,
        upstream?.body,
        error,
      );
      return res.status(502).json({
        message: "Failed to load saved betslips",
        upstreamStatus: upstream?.status ?? null,
        upstreamBody:
          typeof upstream?.body === "string"
            ? upstream.body.slice(0, 500)
            : undefined,
      });
    }
  });

  // Persist the user's saved betslips to their miniapp preferences. POST on the
  // gateway overwrites the whole preference document, so we read it first and
  // merge the new `savedBetslips` array in, preserving any other keys.
  app.put("/api/:country/preferences/betslips", async (req, res) => {
    try {
      const countryCode = getCountryCode(req);

      if (!countryCode) {
        return res.status(400).json({
          message:
            "Invalid country code. Supported countries: " +
            SUPPORTED_COUNTRIES.join(", "),
        });
      }

      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { savedBetslips, brandIdentifier } =
        savedBetslipsPreferenceSchema.parse(req.body);

      const prefs = await getPreferences(token, brandIdentifier);
      await setPreferences(
        token,
        { ...prefs, savedBetslips },
        brandIdentifier,
      );

      return res.json({ savedBetslips });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      const upstream = error as { status?: number; body?: string };
      console.error(
        "Error saving betslips to preferences:",
        upstream?.status,
        upstream?.body,
        error,
      );
      return res.status(502).json({
        message: "Failed to save betslips",
        upstreamStatus: upstream?.status ?? null,
        upstreamBody:
          typeof upstream?.body === "string"
            ? upstream.body.slice(0, 500)
            : undefined,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
