import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertFriendshipSchema } from "@shared/schema";

const friendsRouter = Router();

// Get current user's friends
friendsRouter.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const friendships = await storage.getFriendships(userId, "accepted");
  
  return res.json(friendships);
});

// Get pending friend requests
friendsRouter.get("/requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const requests = await storage.getFriendshipRequests(userId);
  
  return res.json(requests);
});

// Search for users to add as friends
friendsRouter.get("/search", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const query = req.query.q as string;
  if (!query || query.length < 3) {
    return res.status(400).json({ error: "Search query must be at least 3 characters" });
  }

  const users = await storage.searchUsers(query, req.user!.id);
  return res.json(users);
});

// Send a friend request
friendsRouter.post("/request", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const friendId = z.object({ friendId: z.number() }).parse(req.body).friendId;
  
  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot send a friend request to yourself" });
  }

  try {
    const friendship = await storage.createFriendship({
      userId,
      friendId,
      status: "pending"
    });
    
    return res.status(201).json(friendship);
  } catch (error) {
    console.error("Error creating friendship:", error);
    return res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept a friend request
friendsRouter.post("/accept/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const friendshipId = parseInt(req.params.id);
  
  try {
    const friendship = await storage.updateFriendshipStatus(friendshipId, "accepted");
    return res.json(friendship);
  } catch (error) {
    console.error("Error accepting friendship:", error);
    return res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Reject a friend request
friendsRouter.post("/reject/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const friendshipId = parseInt(req.params.id);
  
  try {
    const friendship = await storage.updateFriendshipStatus(friendshipId, "rejected");
    return res.json(friendship);
  } catch (error) {
    console.error("Error rejecting friendship:", error);
    return res.status(500).json({ error: "Failed to reject friend request" });
  }
});

// Remove a friend
friendsRouter.delete("/:friendId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const friendId = parseInt(req.params.friendId);
  
  try {
    await storage.deleteFriendship(userId, friendId);
    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting friendship:", error);
    return res.status(500).json({ error: "Failed to remove friend" });
  }
});

export default friendsRouter;