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

// Get incoming friend requests
friendsRouter.get("/requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  const requests = await storage.getFriendshipRequests(userId);
  
  return res.json(requests);
});

// Get outgoing friend requests
friendsRouter.get("/sent-requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = req.user!.id;
  
  // Get all friendships
  const allFriendships = await storage.getFriendships(userId);
  
  // Filter for outgoing pending requests
  const sentRequests = allFriendships.filter(
    f => f.userId === userId && f.status === "pending"
  );
  
  return res.json(sentRequests);
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
    // Check if there is already a friendship (in any status)
    const existingFriendships = await storage.getFriendships(userId);
    const existingFriendship = existingFriendships.find(f => 
      (f.userId === userId && f.friendId === friendId) || 
      (f.userId === friendId && f.friendId === userId)
    );

    if (existingFriendship) {
      if (existingFriendship.status === "pending") {
        if (existingFriendship.userId === userId) {
          // User already sent a request to this friend
          return res.status(400).json({ 
            error: "You already sent a friend request to this user" 
          });
        } else {
          // Friend already sent a request to the user
          return res.status(400).json({ 
            error: "This user has already sent you a friend request. Check your pending requests." 
          });
        }
      } else if (existingFriendship.status === "accepted") {
        return res.status(400).json({ error: "This user is already your friend" });
      } else if (existingFriendship.status === "rejected") {
        // If it was rejected, check who rejected it
        if (existingFriendship.userId === userId) {
          // The current user sent the initial request that was rejected
          return res.status(400).json({ 
            error: "This user has rejected your friend request" 
          });
        } else {
          // The current user rejected the other user's request
          // Allow sending a new request if the current user is the one who rejected
          const friendship = await storage.updateFriendshipStatus(existingFriendship.id, "pending");
          return res.status(201).json(friendship);
        }
      }
    }

    // No existing friendship, create a new one
    const friendship = await storage.createFriendship({
      userId,
      friendId,
      status: "pending"
    });
    
    return res.status(201).json(friendship);
  } catch (error) {
    console.error("Error creating friendship:", error);
    
    // Pass through specific error messages from the database layer
    if (error instanceof Error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }
    
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
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
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
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
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
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to remove friend" });
  }
});

export default friendsRouter;