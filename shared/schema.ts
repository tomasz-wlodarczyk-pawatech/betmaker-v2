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
  timeRange: z
    .enum(["whenever", "today", "3h", "48h", "72h"])
    .optional()
    .default("whenever"),
  selectionMode: z.enum(["all", "hot", "fav"]).optional().default("all"),
  minSelections: z.number().int().min(1).optional(),
  maxSelections: z.number().int().min(1).optional(),
  minLegOdds: z.number().positive().optional(),
  maxLegOdds: z.number().positive().optional(),
  randomMode: z.boolean().optional().default(false),
  // Generate only from these leagues/markets; an empty array means no restriction.
  selectedLeagues: z.array(z.string()).optional().default([]),
  selectedMarkets: z.array(z.string()).optional().default([]),
});

export const generateBookingCodeSchema = z.object({
  selectionIds: z.array(z.string()),
  brandIdentifier: z.string()
});

export const timeRangeSchema = z.enum([
  "whenever",
  "today",
  "3h",
  "48h",
  "72h",
]);

export const availableFiltersSchema = z.object({
  brandIdentifier: z.string(),
  timeRange: timeRangeSchema.default("whenever"),
});

// Saved betslips persisted to the user's miniapp preferences. The slips are
// stored opaquely (the gateway keeps the whole preference document as JSON), so
// they're validated loosely here — the client `SavedBetslip` shape is the real
// source of truth and the server only forwards the array.
export const savedBetslipsPreferenceSchema = z.object({
  brandIdentifier: z.string(),
  savedBetslips: z.array(z.unknown()),
});

// Swap a single leg of an already-generated betslip. `selectionMode` is kept as
// a loose string (the embedder may send values like "popular") and normalised
// server-side to hot-vs-all. `excludeEventIds` are the events already in the
// slip, so the replacement always comes from a fresh event (unrelated to the
// league/market selection below).
export const switchSelectionSchema = z.object({
  brandIdentifier: z.string(),
  currentSelectionId: z.string(),
  excludeEventIds: z.array(z.string()).optional().default([]),
  timeRange: timeRangeSchema.optional().default("whenever"),
  selectionMode: z.string().optional().default("all"),
  targetOdds: z.number(),
  currentTotalOdds: z.number(),
  replacedSelectionOdds: z.number(),
  // Keep the replacement within the same selected leagues/markets as the slip.
  selectedLeagues: z.array(z.string()).optional().default([]),
  selectedMarkets: z.array(z.string()).optional().default([]),
  minLegOdds: z.number().positive().optional(),
  maxLegOdds: z.number().positive().optional(),
});

export type GenerateBetslipRequest = z.infer<typeof generateBetslipSchema>;
export type GenerateBookingCodeRequest = z.infer<
  typeof generateBookingCodeSchema
>;
export type AvailableFiltersRequest = z.infer<typeof availableFiltersSchema>;
export type SavedBetslipsPreferenceRequest = z.infer<
  typeof savedBetslipsPreferenceSchema
>;
export type SwitchSelectionRequest = z.infer<typeof switchSelectionSchema>;
export type TimeRange = z.infer<typeof timeRangeSchema>;
