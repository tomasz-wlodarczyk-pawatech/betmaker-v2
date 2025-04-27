import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import axios from "axios";
import { generateBetslipSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
