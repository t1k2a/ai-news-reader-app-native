import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for user authentication
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: 'Authentication failed' });
    }
  });
  
  // API route for user registration
  app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Create new user
      const newUser = await storage.createUser({ username, password });
      
      res.status(201).json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
