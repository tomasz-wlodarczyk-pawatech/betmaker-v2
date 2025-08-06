import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import axios from "axios";
import { Response } from "express";

const COUNTRIES_CACHE_KEY = "betpawa_countries";
const COUNTRIES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchCountriesFromApi(): Promise<any> {
  const response = await axios.get(
    "https://www.betpawa.com/api/brand/v1/countries/betpawa",
  );
  return response.data;
}
import {
  generateBetslipSchema,
  generateBookingCodeSchema,
} from "@shared/schema";
import { generateBetslip } from "./services/betslipService";

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

      const { targetOdds, brandIdentifier } = generateBetslipSchema.parse(
        req.body,
      );

      // Fetch events data
      const response = await axios.get(
        `https://pawagate.replit.app/api/sportsbook-plus/v1/events/popular`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-MiniApp-Env": "staging",
            "x-pawa-brand": `${brandIdentifier}`,
            Origin: "https://bet-maker-stg.replit.app",
          },
        },
      );

      // Check if the response has the new format with status and data fields
      let events;
      if (
        response.data.status === "success" &&
        Array.isArray(response.data.data)
      ) {
        events = response.data.data;
      } else {
        // Handle legacy format or unexpected response
        events = Array.isArray(response.data) ? response.data : [];
      }

      // Generate betslip
      const betslip = await generateBetslip(events, targetOdds);

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

  // Mapping of country codes to BetPawa API brand names
  const COUNTRY_BRANDS: Record<string, string> = {
    ao: "betpawa-angola",
    bj: "betpawa-benin",
    bw: "betpawa-botswana",
    cd: "betpawa-drc",
    cf: "betpawa-car",
    cg: "betpawa-congo",
    ci: "betpawa-ivory-coast",
    cm: "betpawa-cameroon",
    ga: "betpawa-gabon",
    gh: "betpawa-ghana", // default
    ke: "betpawa-kenya",
    lr: "betpawa-liberia",
    ls: "betpawa-lesotho",
    mw: "betpawa-malawi",
    mz: "betpawa-mozambique",
    ng: "betpawa-nigeria",
    rw: "betpawa-rwanda",
    sl: "betpawa-sierra-leone",
    sn: "betpawa-senegal",
    tz: "betpawa-tanzania",
    ug: "betpawa-uganda",
    zm: "betpawa-zambia",
    zw: "betpawa-zimbabwe",
  };

  // Mapping of country codes to BetPawa domains
  const COUNTRY_DOMAINS: Record<string, string> = {
    ao: "betpawa.ao",
    bj: "betpawa.bj",
    bw: "betpawa.co.bw",
    cd: "betpawa.cd",
    cf: "betpawa.cf",
    cg: "betpawa.cg",
    ci: "betpawa.ci",
    cm: "betpawa.cm",
    ga: "betpawa.ga",
    gh: "betpawa.com.gh", // default
    ke: "betpawa.co.ke",
    lr: "betpawa.com.lr",
    ls: "betpawa.co.ls",
    mw: "betpawa.mw",
    mz: "betpawa.co.mz",
    ng: "betpawa.ng",
    rw: "betpawa.rw",
    sl: "betpawa.sl",
    sn: "betpawa.sn",
    tz: "betpawa.co.tz",
    ug: "betpawa.ug",
    zm: "betpawa.co.zm",
    zw: "betpawa.co.zw",
  };

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

      const responseDomain = await axios.get(
        `https://pawagate.replit.app/api/brand/v1/countries/betpawa`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-MiniApp-Env": "staging",
            "x-pawa-brand": `${brandIdentifier}`,
            Origin: "https://bet-maker-stg.replit.app",
          },
        },
      );

      const domainData = responseDomain.data.find(
        (e: any) => e.brandIdentifier === brandIdentifier,
      ).rootDomain;

      const response = await axios.post(
        `https://pawagate.replit.app/api/sportsbook/v2/booking-number`,
        { selections: selectionIds },
        {
          headers: {
            "Content-Type": "application/json",
            "X-MiniApp-Env": "staging",
            "x-pawa-brand": brandIdentifier,
            "x-pawa-language": "en",
            Origin: "https://bet-maker-stg.replit.app",
          },
        },
      );

      return res.json({
        bookingCode: response.data.code,
        domain: domainData,
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

  const httpServer = createServer(app);
  return httpServer;
}
