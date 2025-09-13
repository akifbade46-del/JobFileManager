import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertJobFileSchema } from "@shared/schema";
import { z } from "zod";

// Simple in-memory rate limiting (for production, use Redis-based solution)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// Rate limiting middleware for login
function rateLimitLogin(req: any, res: any, next: any) {
  const clientKey = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(clientKey);
  
  if (attempts) {
    // Reset if window expired
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(clientKey);
    } else if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({ 
        error: "Too many login attempts. Please try again later.",
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - attempts.lastAttempt)) / 1000)
      });
    }
  }
  
  next();
}

// Update login attempts counter
function updateLoginAttempts(clientKey: string, success: boolean) {
  const now = Date.now();
  const attempts = loginAttempts.get(clientKey) || { count: 0, lastAttempt: now };
  
  if (success) {
    // Reset on successful login
    loginAttempts.delete(clientKey);
  } else {
    // Increment failed attempts
    attempts.count += 1;
    attempts.lastAttempt = now;
    loginAttempts.set(clientKey, attempts);
  }
}

// Extend express session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: string;
    userEmail: string;
    userName: string;
  }
}

// Middleware for authentication
function requireAuth(app: Express, req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware for role-based access
function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication Routes
  // ==================
  
  // Login
  app.post("/api/auth/login", rateLimitLogin, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      console.log(`Login attempt for email: ${email}`);
      
      // Check if user exists first
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        console.log(`User not found for email: ${email}`);
        updateLoginAttempts(req.ip || 'unknown', false);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      console.log(`User found: ${existingUser.email}, status: ${existingUser.status}, hash length: ${existingUser.password.length}`);
      
      const user = await storage.validateUserCredentials(email, password);
      
      if (!user) {
        console.log(`Password validation failed for email: ${email}`);
        updateLoginAttempts(req.ip || 'unknown', false);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (user.status !== 'active') {
        console.log(`User account not active: ${email}, status: ${user.status}`);
        updateLoginAttempts(req.ip || 'unknown', false);
        return res.status(401).json({ error: "Account is not active" });
      }
      
      // SECURITY: Regenerate session to prevent session fixation attacks
      const userData = {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        // Store user info in new session
        req.session.userId = userData.id;
        req.session.userRole = userData.role;
        req.session.userEmail = userData.email;
        req.session.userName = userData.name;
        
        // Save session before responding
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: "Internal server error" });
          }
          
          console.log(`Login successful for user: ${userData.email}`);
          updateLoginAttempts(req.ip || 'unknown', true);
          
          res.json({ 
            success: true, 
            user: { 
              id: userData.id, 
              name: userData.name, 
              email: userData.email, 
              role: userData.role, 
              status: user.status 
            } 
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      updateLoginAttempts(req.ip || 'unknown', false);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // Create new user (status defaults to 'pending')
      const newUser = await storage.createUser(userData);
      
      res.status(201).json({ 
        success: true, 
        message: "User created successfully. Account is pending approval.",
        user: { 
          id: newUser.id, 
          name: newUser.name, 
          email: newUser.email, 
          role: newUser.role, 
          status: newUser.status 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", requireAuth.bind(null, app), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          status: user.status 
        } 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
  
  // User Management Routes (Admin only)
  // ==================================
  
  // Get all users
  app.get("/api/users", requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update user (Admin only)
  app.put("/api/users/:id", requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const updateUserSchema = insertUserSchema.partial().omit({ password: true });
      const validatedUpdates = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(id, validatedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete user (Admin only)
  app.delete("/api/users/:id", requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Don't allow admin to delete themselves
      if (id === req.session.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Client Management Routes
  // ======================
  
  // Get all clients
  app.get("/api/clients", requireAuth.bind(null, app), async (req, res) => {
    try {
      const { type, search } = req.query;
      const clients = await storage.getAllClients(
        type as string, 
        search as string
      );
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create client
  app.post("/api/clients", requireAuth.bind(null, app), async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid client data", details: error.errors });
      }
      console.error("Create client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update client
  app.put("/api/clients/:id", requireAuth.bind(null, app), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const updateClientSchema = insertClientSchema.partial();
      const validatedUpdates = updateClientSchema.parse(req.body);
      
      const updatedClient = await storage.updateClient(id, validatedUpdates);
      if (!updatedClient) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid client data", details: error.errors });
      }
      console.error("Update client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete client
  app.delete("/api/clients/:id", requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Job File Management Routes
  // ========================
  
  // Get all job files
  app.get("/api/job-files", requireAuth.bind(null, app), async (req, res) => {
    try {
      const { status, search } = req.query;
      const userRole = req.session.userRole;
      const userId = userRole === 'user' ? req.session.userId : undefined;
      
      const jobFiles = await storage.getAllJobFiles(
        status as string, 
        search as string, 
        userId
      );
      res.json(jobFiles);
    } catch (error) {
      console.error("Get job files error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get single job file
  app.get("/api/job-files/:id", requireAuth.bind(null, app), async (req, res) => {
    try {
      const { id } = req.params;
      const jobFile = await storage.getJobFile(id);
      
      if (!jobFile) {
        return res.status(404).json({ error: "Job file not found" });
      }
      
      // Check if user can access this job file
      const userRole = req.session.userRole;
      if (userRole === 'user' && jobFile.preparedBy !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get job file items
      const items = await storage.getJobFileItems(id);
      
      res.json({ ...jobFile, items });
    } catch (error) {
      console.error("Get job file error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create job file
  app.post("/api/job-files", requireAuth.bind(null, app), async (req, res) => {
    try {
      const jobFileData = {
        ...req.body,
        preparedBy: req.session.userId
      };
      
      // Validate against schema
      const validatedData = insertJobFileSchema.parse(jobFileData);
      
      const newJobFile = await storage.createJobFile(validatedData);
      res.status(201).json(newJobFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid job file data", details: error.errors });
      }
      console.error("Create job file error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update job file status (checkers and admins only)
  app.put("/api/job-files/:id/status", requireRole(['checker', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      const updatedJobFile = await storage.updateJobFileStatus(
        id, 
        status, 
        req.session.userId, 
        reason
      );
      
      if (!updatedJobFile) {
        return res.status(404).json({ error: "Job file not found" });
      }
      
      res.json(updatedJobFile);
    } catch (error) {
      console.error("Update job file status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Analytics Route
  // ==============
  
  // Get analytics data
  app.get("/api/analytics", requireRole(['admin', 'checker']), async (req, res) => {
    try {
      const { dateType, timeframe } = req.query;
      const analytics = await storage.getAnalyticsData(
        dateType as string, 
        timeframe as string
      );
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Activity Logs
  // =============
  
  // Get activity logs
  app.get("/api/activity-logs", requireRole(['admin', 'checker']), async (req, res) => {
    try {
      const { jobFileId, limit } = req.query;
      const logs = await storage.getActivityLogs(
        jobFileId as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Development/Setup Routes
  // ========================
  
  // Create initial admin user (only if no users exist)
  app.post("/api/setup/admin", async (req, res) => {
    try {
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Users already exist. Admin setup not needed." });
      }
      
      // Use deterministic password - either from env variable or known default
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      const adminData = {
        name: req.body.name || "System Administrator", 
        email: req.body.email || "admin@system.com",
        password: adminPassword, // Use deterministic password
        role: 'admin' as const,
        status: 'active' as const
      };
      
      console.log(`Creating admin with email: ${adminData.email}`);
      const admin = await storage.createUser(adminData);
      console.log(`Admin created successfully with hash length: ${admin.password.length}`);
      
      res.json({ 
        success: true, 
        message: `Initial admin user created successfully. Login with email: ${admin.email} and password: admin123`,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          status: admin.status
        }
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
