import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import axios from "axios";

import {
  generateBetslipSchema,
  generateBookingCodeSchema,
  availableFiltersSchema,
} from "@shared/schema";
import { generateBetslip } from "./services/betslipService";
import { getPopularEvents } from "./services/pawagate";

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
        excludedLeagues,
        excludedMarkets,
      } = generateBetslipSchema.parse(req.body);

      const raw = (await getPopularEvents(brandIdentifier)) as
        | unknown[]
        | { status?: string; data?: unknown[] };

      let events: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? ((raw as { data: unknown[] }).data as any[])
          : [];

      if (excludedLeagues.length > 0 || excludedMarkets.length > 0) {
        const leagueSet = new Set(excludedLeagues);
        const marketSet = new Set(excludedMarkets);
        events = events
          .filter((e: any) => !leagueSet.has(e?.competition))
          .map((e: any) => ({
            ...e,
            markets: Array.isArray(e?.markets)
              ? e.markets.filter((m: any) => !marketSet.has(m?.name))
              : e?.markets,
          }))
          .filter(
            (e: any) => Array.isArray(e?.markets) && e.markets.length > 0,
          );
      }

      const betslip = await generateBetslip(events, targetOdds, 0.15, {
        selectionMode,
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

      const raw = (await getPopularEvents(brandIdentifier)) as
        | unknown[]
        | { status?: string; data?: unknown[] };

      const events: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? ((raw as { data: unknown[] }).data as any[])
          : [];

      const leagueSet = new Set<string>();
      const marketSet = new Set<string>();
      for (const ev of events) {
        if (typeof ev?.competition === "string") {
          leagueSet.add(ev.competition);
        }
        if (Array.isArray(ev?.markets)) {
          for (const m of ev.markets) {
            if (typeof m?.name === "string") marketSet.add(m.name);
          }
        }
      }

      return res.json({
        leagues: Array.from(leagueSet).sort(),
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

  const httpServer = createServer(app);
  return httpServer;
}
