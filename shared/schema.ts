import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'checker', 'user']);
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'blocked']);
export const clientTypeEnum = pgEnum('client_type', ['shipper', 'consignee', 'both']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'checked', 'approved', 'rejected']);

// Users table - keeping existing ID format
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  status: userStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Clients table (shippers and consignees)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: clientTypeEnum("type").notNull().default('both'),
  address: text("address"),
  contact: varchar("contact", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  totalJobs: integer("total_jobs").notNull().default(0),
  lastJobDate: timestamp("last_job_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Job Files table
export const jobFiles = pgTable("job_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobFileNo: varchar("job_file_no", { length: 100 }).notNull().unique(),
  openingDate: timestamp("opening_date").notNull(),
  billingDate: timestamp("billing_date"),
  
  // Shipper details
  shipperId: varchar("shipper_id").references(() => clients.id),
  shipperName: varchar("shipper_name", { length: 255 }).notNull(),
  shipperAddress: text("shipper_address"),
  shipperContact: varchar("shipper_contact", { length: 255 }),
  
  // Consignee details  
  consigneeId: varchar("consignee_id").references(() => clients.id),
  consigneeName: varchar("consignee_name", { length: 255 }).notNull(),
  consigneeAddress: text("consignee_address"),
  consigneeContact: varchar("consignee_contact", { length: 255 }),
  
  // Agent details
  agent: varchar("agent", { length: 255 }),
  agentRef: varchar("agent_ref", { length: 100 }),
  
  // Transportation details
  vessel: varchar("vessel", { length: 255 }),
  voyage: varchar("voyage", { length: 100 }),
  pol: varchar("pol", { length: 255 }), // Port of Loading
  pod: varchar("pod", { length: 255 }), // Port of Discharge
  etd: timestamp("etd"), // Estimated Time of Departure
  eta: timestamp("eta"), // Estimated Time of Arrival
  
  // Container details
  containerNo: varchar("container_no", { length: 100 }),
  sealNo: varchar("seal_no", { length: 100 }),
  containerSize: varchar("container_size", { length: 50 }),
  
  // Documentation
  blNo: varchar("bl_no", { length: 100 }), // Bill of Lading
  invoiceNo: varchar("invoice_no", { length: 100 }),
  lcNo: varchar("lc_no", { length: 100 }), // Letter of Credit
  
  // Financial totals
  totalSell: decimal("total_sell", { precision: 12, scale: 2 }).notNull().default('0'),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default('0'),
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Status and workflow
  status: jobStatusEnum("status").notNull().default('pending'),
  
  // Tracking
  preparedBy: varchar("prepared_by").notNull().references(() => users.id),
  checkedBy: varchar("checked_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  checkedAt: timestamp("checked_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Notes
  description: text("description"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Job File Items table (for line items within each job file)
export const jobFileItems = pgTable("job_file_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobFileId: varchar("job_file_id").notNull().references(() => jobFiles.id, { onDelete: 'cascade' }),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default('1'),
  unit: varchar("unit", { length: 50 }),
  sellRate: decimal("sell_rate", { precision: 12, scale: 2 }).notNull().default('0'),
  costRate: decimal("cost_rate", { precision: 12, scale: 2 }).notNull().default('0'),
  sellAmount: decimal("sell_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  costAmount: decimal("cost_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Logs table (for audit trail)
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobFileId: varchar("job_file_id").references(() => jobFiles.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // created, checked, approved, rejected, updated
  oldStatus: jobStatusEnum("old_status"),
  newStatus: jobStatusEnum("new_status"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  preparedJobFiles: many(jobFiles, { relationName: "prepared_by" }),
  checkedJobFiles: many(jobFiles, { relationName: "checked_by" }),
  approvedJobFiles: many(jobFiles, { relationName: "approved_by" }),
  rejectedJobFiles: many(jobFiles, { relationName: "rejected_by" }),
  activityLogs: many(activityLogs),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  shipperJobFiles: many(jobFiles, { relationName: "shipper" }),
  consigneeJobFiles: many(jobFiles, { relationName: "consignee" }),
}));

export const jobFilesRelations = relations(jobFiles, ({ one, many }) => ({
  preparedBy: one(users, {
    fields: [jobFiles.preparedBy],
    references: [users.id],
    relationName: "prepared_by"
  }),
  checkedBy: one(users, {
    fields: [jobFiles.checkedBy],
    references: [users.id],
    relationName: "checked_by"
  }),
  approvedBy: one(users, {
    fields: [jobFiles.approvedBy],
    references: [users.id],
    relationName: "approved_by"
  }),
  rejectedBy: one(users, {
    fields: [jobFiles.rejectedBy],
    references: [users.id],
    relationName: "rejected_by"
  }),
  shipper: one(clients, {
    fields: [jobFiles.shipperId],
    references: [clients.id],
    relationName: "shipper"
  }),
  consignee: one(clients, {
    fields: [jobFiles.consigneeId],
    references: [clients.id],
    relationName: "consignee"
  }),
  items: many(jobFileItems),
  activityLogs: many(activityLogs),
}));

export const jobFileItemsRelations = relations(jobFileItems, ({ one }) => ({
  jobFile: one(jobFiles, {
    fields: [jobFileItems.jobFileId],
    references: [jobFiles.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  jobFile: one(jobFiles, {
    fields: [activityLogs.jobFileId],
    references: [jobFiles.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertClientSchema = createInsertSchema(clients).omit({ 
  id: true, 
  totalJobs: true,
  createdAt: true, 
  updatedAt: true 
});
export const selectClientSchema = createSelectSchema(clients);
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = z.infer<typeof selectClientSchema>;

export const insertJobFileSchema = createInsertSchema(jobFiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  checkedBy: true,
  approvedBy: true,
  checkedAt: true,
  approvedAt: true
});
export const selectJobFileSchema = createSelectSchema(jobFiles);
export type InsertJobFile = z.infer<typeof insertJobFileSchema>;
export type JobFile = z.infer<typeof selectJobFileSchema>;

export const insertJobFileItemSchema = createInsertSchema(jobFileItems).omit({ 
  id: true, 
  createdAt: true 
});
export const selectJobFileItemSchema = createSelectSchema(jobFileItems);
export type InsertJobFileItem = z.infer<typeof insertJobFileItemSchema>;
export type JobFileItem = z.infer<typeof selectJobFileItemSchema>;

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ 
  id: true, 
  timestamp: true 
});
export const selectActivityLogSchema = createSelectSchema(activityLogs);
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = z.infer<typeof selectActivityLogSchema>;
