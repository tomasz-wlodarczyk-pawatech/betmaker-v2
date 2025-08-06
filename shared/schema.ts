import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the Betslip table
export const betslips = pgTable("betslips", {
  id: serial("id").primaryKey(),
  targetOdds: numeric("target_odds").notNull(),
  actualOdds: numeric("actual_odds").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define the Selection table
export const selections = pgTable("selections", {
  id: serial("id").primaryKey(),
  betslipId: integer("betslip_id")
    .notNull()
    .references(() => betslips.id),
  selectionId: text("selection_id").notNull(),
  eventId: text("event_id").notNull(),
  eventName: text("event_name").notNull(),
  competition: text("competition").notNull(),
  marketName: text("market_name").notNull(),
  selectionName: text("selection_name").notNull(),
  odds: numeric("odds").notNull(),
  startTime: timestamp("start_time").notNull(),
});

// Zod schemas for validation
export const insertBetslipSchema = createInsertSchema(betslips).pick({
  targetOdds: true,
  actualOdds: true,
});

export const insertSelectionSchema = createInsertSchema(selections).pick({
  betslipId: true,
  selectionId: true,
  eventId: true,
  eventName: true,
  competition: true,
  marketName: true,
  selectionName: true,
  odds: true,
  startTime: true,
});

// Types for use in the app
export type InsertBetslip = z.infer<typeof insertBetslipSchema>;
export type InsertSelection = z.infer<typeof insertSelectionSchema>;
export type Betslip = typeof betslips.$inferSelect;
export type Selection = typeof selections.$inferSelect;

// Additional types for the API
export const generateBetslipSchema = z.object({
  targetOdds: z.number().min(2).max(1000),
  brandIdentifier: z.string(),
});

export const generateBookingCodeSchema = z.object({
  selectionIds: z.array(z.string()),
  brandIdentifier: z.string()
});

export type GenerateBetslipRequest = z.infer<typeof generateBetslipSchema>;
export type GenerateBookingCodeRequest = z.infer<
  typeof generateBookingCodeSchema
>;
