import { 
  type User, 
  type InsertUser, 
  type Client, 
  type InsertClient,
  type JobFile,
  type InsertJobFile,
  type JobFileItem,
  type InsertJobFileItem,
  type ActivityLog,
  type InsertActivityLog,
  users, 
  clients, 
  jobFiles, 
  jobFileItems,
  activityLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count } from "drizzle-orm";
import bcrypt from "bcrypt";

// Comprehensive storage interface for job file management system
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Authentication
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  
  // Client management
  getClient(id: string): Promise<Client | undefined>;
  getClientByName(name: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  getAllClients(typeFilter?: string, searchTerm?: string): Promise<Client[]>;
  
  // Job file management
  getJobFile(id: string): Promise<JobFile | undefined>;
  getJobFileByNo(jobFileNo: string): Promise<JobFile | undefined>;
  createJobFile(jobFile: InsertJobFile): Promise<JobFile>;
  updateJobFile(id: string, updates: Partial<InsertJobFile>): Promise<JobFile | undefined>;
  deleteJobFile(id: string): Promise<boolean>;
  getAllJobFiles(statusFilter?: string, searchTerm?: string, userId?: string): Promise<JobFile[]>;
  updateJobFileStatus(id: string, status: string, userId: string, reason?: string): Promise<JobFile | undefined>;
  
  // Job file items
  getJobFileItems(jobFileId: string): Promise<JobFileItem[]>;
  createJobFileItem(item: InsertJobFileItem): Promise<JobFileItem>;
  updateJobFileItem(id: string, updates: Partial<InsertJobFileItem>): Promise<JobFileItem | undefined>;
  deleteJobFileItem(id: string): Promise<boolean>;
  
  // Analytics
  getAnalyticsData(dateType?: string, timeframe?: string): Promise<any>;
  
  // Activity logging
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(jobFileId?: string, limit?: number): Promise<ActivityLog[]>;
  
  // Bulk import methods for data migration
  bulkCreateUsers(users: InsertUser[]): Promise<User[]>;
  bulkCreateClients(clients: InsertClient[]): Promise<Client[]>;
  bulkCreateJobFiles(jobFiles: InsertJobFile[]): Promise<JobFile[]>;
  
  // Export methods for data backup
  exportUsersToJSON(): Promise<string>;
  exportClientsToJSON(): Promise<string>;
  exportJobFilesToJSON(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Authentication
  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Client management
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.name, name));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  async getAllClients(typeFilter?: string, searchTerm?: string): Promise<Client[]> {
    let query = db.select().from(clients);
    
    const conditions = [];
    
    if (typeFilter && typeFilter !== 'all') {
      conditions.push(or(eq(clients.type, typeFilter as any), eq(clients.type, 'both')));
    }
    
    if (searchTerm) {
      conditions.push(
        or(
          like(clients.name, `%${searchTerm}%`),
          like(clients.contact, `%${searchTerm}%`),
          like(clients.email, `%${searchTerm}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(clients.lastJobDate));
  }

  // Job file management
  async getJobFile(id: string): Promise<JobFile | undefined> {
    const [jobFile] = await db.select().from(jobFiles).where(eq(jobFiles.id, id));
    return jobFile || undefined;
  }

  async getJobFileByNo(jobFileNo: string): Promise<JobFile | undefined> {
    const [jobFile] = await db.select().from(jobFiles).where(eq(jobFiles.jobFileNo, jobFileNo));
    return jobFile || undefined;
  }

  async createJobFile(insertJobFile: InsertJobFile): Promise<JobFile> {
    const [jobFile] = await db
      .insert(jobFiles)
      .values(insertJobFile)
      .returning();
    
    // Log the activity
    await this.logActivity({
      jobFileId: jobFile.id,
      userId: jobFile.preparedBy,
      action: 'created',
      newStatus: 'pending',
      details: `Job file ${jobFile.jobFileNo} created`
    });
    
    return jobFile;
  }

  async updateJobFile(id: string, updates: Partial<InsertJobFile>): Promise<JobFile | undefined> {
    const [jobFile] = await db
      .update(jobFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobFiles.id, id))
      .returning();
    return jobFile || undefined;
  }

  async deleteJobFile(id: string): Promise<boolean> {
    const result = await db.delete(jobFiles).where(eq(jobFiles.id, id));
    return result.rowCount > 0;
  }

  async getAllJobFiles(statusFilter?: string, searchTerm?: string, userId?: string): Promise<JobFile[]> {
    let query = db.select().from(jobFiles);
    
    const conditions = [];
    
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(eq(jobFiles.status, statusFilter as any));
    }
    
    if (searchTerm) {
      conditions.push(
        or(
          like(jobFiles.jobFileNo, `%${searchTerm}%`),
          like(jobFiles.shipperName, `%${searchTerm}%`),
          like(jobFiles.consigneeName, `%${searchTerm}%`)
        )
      );
    }
    
    if (userId) {
      // For non-admin users, show only their own files unless they're checkers/admins
      conditions.push(eq(jobFiles.preparedBy, userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(jobFiles.updatedAt));
  }

  async updateJobFileStatus(id: string, status: string, userId: string, reason?: string): Promise<JobFile | undefined> {
    const currentJobFile = await this.getJobFile(id);
    if (!currentJobFile) return undefined;
    
    const updates: Partial<InsertJobFile> = { 
      status: status as any,
      updatedAt: new Date()
    };
    
    // Set appropriate user based on status
    if (status === 'checked') {
      updates.checkedBy = userId;
      updates.checkedAt = new Date();
    } else if (status === 'approved') {
      updates.approvedBy = userId;
      updates.approvedAt = new Date();
    } else if (status === 'rejected') {
      updates.rejectedBy = userId;
      updates.rejectedAt = new Date();
      updates.rejectionReason = reason;
    }
    
    const [jobFile] = await db
      .update(jobFiles)
      .set(updates)
      .where(eq(jobFiles.id, id))
      .returning();
    
    // Log the activity
    if (jobFile) {
      await this.logActivity({
        jobFileId: jobFile.id,
        userId: userId,
        action: status,
        oldStatus: currentJobFile.status,
        newStatus: status as any,
        details: reason || `Job file ${status}`
      });
    }
    
    return jobFile || undefined;
  }

  // Job file items
  async getJobFileItems(jobFileId: string): Promise<JobFileItem[]> {
    return await db.select().from(jobFileItems).where(eq(jobFileItems.jobFileId, jobFileId));
  }

  async createJobFileItem(insertItem: InsertJobFileItem): Promise<JobFileItem> {
    const [item] = await db
      .insert(jobFileItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateJobFileItem(id: string, updates: Partial<InsertJobFileItem>): Promise<JobFileItem | undefined> {
    const [item] = await db
      .update(jobFileItems)
      .set(updates)
      .where(eq(jobFileItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteJobFileItem(id: string): Promise<boolean> {
    const result = await db.delete(jobFileItems).where(eq(jobFileItems.id, id));
    return result.rowCount > 0;
  }

  // Analytics - simplified implementation
  async getAnalyticsData(dateType?: string, timeframe?: string): Promise<any> {
    // Get basic counts
    const [{ totalJobs }] = await db.select({ 
      totalJobs: count() 
    }).from(jobFiles);

    const [{ totalUsers }] = await db.select({ 
      totalUsers: count() 
    }).from(users);

    const [{ totalClients }] = await db.select({ 
      totalClients: count() 
    }).from(clients);

    // Get job status breakdown
    const statusCounts = await db
      .select({
        status: jobFiles.status,
        count: count()
      })
      .from(jobFiles)
      .groupBy(jobFiles.status);

    return {
      totalJobs,
      totalUsers,
      totalClients,
      statusBreakdown: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Activity logging
  async logActivity(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getActivityLogs(jobFileId?: string, limit: number = 50): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);
    
    if (jobFileId) {
      query = query.where(eq(activityLogs.jobFileId, jobFileId));
    }
    
    return await query
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  // Bulk import methods for data migration
  async bulkCreateUsers(insertUsers: InsertUser[]): Promise<User[]> {
    if (insertUsers.length === 0) return [];
    
    // Hash passwords for all users
    const usersWithHashedPasswords = await Promise.all(
      insertUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    
    return await db.transaction(async (tx) => {
      const createdUsers: User[] = [];
      
      // Insert in batches of 100 to avoid query limits
      for (let i = 0; i < usersWithHashedPasswords.length; i += 100) {
        const batch = usersWithHashedPasswords.slice(i, i + 100);
        const batchResults = await tx
          .insert(users)
          .values(batch)
          .returning();
        createdUsers.push(...batchResults);
      }
      
      return createdUsers;
    });
  }

  async bulkCreateClients(insertClients: InsertClient[]): Promise<Client[]> {
    if (insertClients.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const createdClients: Client[] = [];
      
      // Insert in batches of 100 to avoid query limits
      for (let i = 0; i < insertClients.length; i += 100) {
        const batch = insertClients.slice(i, i + 100);
        const batchResults = await tx
          .insert(clients)
          .values(batch)
          .returning();
        createdClients.push(...batchResults);
      }
      
      return createdClients;
    });
  }

  async bulkCreateJobFiles(insertJobFiles: InsertJobFile[]): Promise<JobFile[]> {
    if (insertJobFiles.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const createdJobFiles: JobFile[] = [];
      
      // Insert in batches of 50 for job files (larger records)
      for (let i = 0; i < insertJobFiles.length; i += 50) {
        const batch = insertJobFiles.slice(i, i + 50);
        const batchResults = await tx
          .insert(jobFiles)
          .values(batch)
          .returning();
        createdJobFiles.push(...batchResults);
        
        // Log activities for each job file created
        for (const jobFile of batchResults) {
          await tx.insert(activityLogs).values({
            jobFileId: jobFile.id,
            userId: jobFile.preparedBy,
            action: 'created',
            newStatus: 'pending',
            details: `Job file ${jobFile.jobFileNo} created via bulk import`
          });
        }
      }
      
      return createdJobFiles;
    });
  }

  // Export methods for data backup
  async exportUsersToJSON(): Promise<string> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Remove sensitive data (passwords) from export
    const safeUsers = allUsers.map(user => ({
      ...user,
      password: '[REDACTED]'
    }));
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      type: 'users',
      count: safeUsers.length,
      data: safeUsers
    }, null, 2);
  }

  async exportClientsToJSON(): Promise<string> {
    const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      type: 'clients',
      count: allClients.length,
      data: allClients
    }, null, 2);
  }

  async exportJobFilesToJSON(): Promise<string> {
    const allJobFiles = await db.select().from(jobFiles).orderBy(desc(jobFiles.createdAt));
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      type: 'jobFiles',
      count: allJobFiles.length,
      data: allJobFiles
    }, null, 2);
  }
}

export const storage = new DatabaseStorage();
