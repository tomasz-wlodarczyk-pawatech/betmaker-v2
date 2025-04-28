import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import axios from "axios";
import { generateBetslipSchema, generateBookingCodeSchema } from "@shared/schema";
import { generateBetslip } from "./services/betslipService";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to proxy the events data
  app.get("/api/events/popular", async (req, res) => {
    try {
      const response = await axios.get("https://list-events-pawa.replit.app/events/popular");
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events data" });
    }
  });

  // API endpoint to generate a betslip
  app.post("/api/betslip/generate", async (req, res) => {
    try {
      const { targetOdds } = generateBetslipSchema.parse(req.body);

      // Fetch events data
      const response = await axios.get("https://list-events-pawa.replit.app/events/popular");
      const events = response.data;

      // Generate betslip
      const betslip = await generateBetslip(events, targetOdds);
      
      if (!betslip) {
        return res.status(404).json({ message: "No suitable betslip found for the target odds" });
      }
      
      res.json(betslip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error generating betslip:", error);
      res.status(500).json({ message: "Failed to generate betslip" });
    }
  });

  // API endpoint to generate BetPawa booking code
  app.post("/api/booking/generate", async (req, res) => {
    try {
      const { selectionIds } = generateBookingCodeSchema.parse(req.body);

      // Call BetPawa API to generate booking code
      const response = await axios.post(
        'https://www.betpawa.com.gh/api/sportsbook/v2/booking-number',
        { selections: selectionIds },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-pawa-brand': 'betpawa-ghana',
            'x-pawa-language': 'en'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      console.error("Error generating booking code:", error);
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || "Failed to generate booking code";
        return res.status(status).json({ message });
      }
      
      res.status(500).json({ message: "Failed to generate booking code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
