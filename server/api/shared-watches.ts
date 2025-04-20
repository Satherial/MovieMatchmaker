import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertSharedWatchSchema } from "@shared/schema";

const sharedWatchesRouter = Router();

// Get all shared watches for the current user
sharedWatchesRouter.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userId = req.user!.id;
    const sharedWatches = await storage.getSharedWatches(userId);
    return res.json(sharedWatches);
  } catch (error) {
    console.error("Error fetching shared watches:", error);
    return res.status(500).json({ error: "Failed to retrieve shared watches" });
  }
});

// Create a new shared watch
sharedWatchesRouter.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { movieId, watchedWithUserId, watchedAt, notes } = z.object({
      movieId: z.number(),
      watchedWithUserId: z.number(),
      watchedAt: z.string().default(() => new Date().toISOString()),
      notes: z.string().optional()
    }).parse(req.body);
    
    const userId = req.user!.id;
    
    // Verify the movie exists
    const movie = await storage.getMovie(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    
    // Verify the friend exists
    const friend = await storage.getUser(watchedWithUserId);
    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if they are friends
    const friendships = await storage.getFriendships(userId, "accepted");
    const isFriend = friendships.some(f => 
      (f.userId === userId && f.friendId === watchedWithUserId) || 
      (f.userId === watchedWithUserId && f.friendId === userId)
    );
    
    if (!isFriend) {
      return res.status(403).json({ error: "You can only share watch activity with friends" });
    }
    
    // Record in watch history for both users
    await storage.addToWatchHistory({
      userId,
      movieId,
      watchedAt: new Date(watchedAt)
    });
    
    await storage.addToWatchHistory({
      userId: watchedWithUserId,
      movieId,
      watchedAt: new Date(watchedAt)
    });
    
    // Create the shared watch record
    const sharedWatch = await storage.addSharedWatch({
      userId,
      movieId,
      watchedWithUserId,
      watchedAt: new Date(watchedAt),
      notes: notes || null
    });
    
    return res.status(201).json(sharedWatch);
  } catch (error) {
    console.error("Error creating shared watch:", error);
    return res.status(500).json({ error: "Failed to create shared watch" });
  }
});

// Delete a shared watch record
sharedWatchesRouter.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const sharedWatchId = parseInt(req.params.id);
    await storage.removeSharedWatch(sharedWatchId);
    return res.status(204).end();
  } catch (error) {
    console.error("Error removing shared watch:", error);
    return res.status(500).json({ error: "Failed to remove shared watch" });
  }
});

export default sharedWatchesRouter;