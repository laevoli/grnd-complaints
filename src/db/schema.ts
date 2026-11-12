import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// Admins table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  level: integer("level").notNull().default(1),
  photoUrl: text("photo_url"),
  onVacation: boolean("on_vacation").notNull().default(false),
  vacationStart: date("vacation_start"),
  vacationEnd: date("vacation_end"),
  instructionPassed: boolean("instruction_passed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  language: text("language").notNull().default("ru"),
  server: text("server").notNull().default("19"),
  complaintNumber: text("complaint_number").notNull(),
  reportedBy: text("reported_by").notNull(),
  reportedAgainst: text("reported_against").notNull(),
  processedBy: text("processed_by").notNull(),
  submittedAt: timestamp("submitted_at").notNull(),
  closedAt: timestamp("closed_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Warnings table
export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("player"),   // ← ДОБАВЛЕНО: "player" или "admin"
  playerName: text("player_name").notNull(),
  reason: text("reason").notNull(),
  complaintNumber: text("complaint_number"),
  issuedBy: text("issued_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users table (авторизация)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),      // хэш bcrypt
  role: text("role").notNull().default("admin"), // "owner" | "admin" | "viewer"
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pendingRegistrations = pgTable("pending_registrations", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  requestedRole: text("requested_role").notNull().default("viewer"),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const bonuses = pgTable("bonuses", {
  id: serial("id").primaryKey(),
  adminName: text("admin_name").notNull(),
  type: text("type").notNull(), // "norm_first" | "most_active"
  amount: integer("amount").notNull(),
  weekStart: text("week_start").notNull(),
  awardedBy: text("awarded_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});