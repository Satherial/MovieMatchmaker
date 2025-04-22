import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertPlaylistShareSchema } from "@shared/schema";

const playlistSharesRouter = Router();

// Get shared playlists for current user
playlistSharesRouter.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userId = (req.user as any)!.id;
    const sharedPlaylists = await storage.getSharedPlaylists(userId);
    return res.json(sharedPlaylists);
  } catch (error) {
    console.error("Error fetching shared playlists:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve shared playlists" });
  }
});

// Get all public playlists
playlistSharesRouter.get("/public", async (req: Request, res: Response) => {
  try {
    const publicPlaylists = await storage.getPublicPlaylists();
    return res.json(publicPlaylists);
  } catch (error) {
    console.error("Error fetching public playlists:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve public playlists" });
  }
});

// Get all shares for a playlist
playlistSharesRouter.get(
  "/:playlistId",
  async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const playlistId = parseInt(req.params.playlistId);
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      // Check if user owns this playlist
      if (playlist.userId !== (req.user as any)!.id) {
        return res
          .status(403)
          .json({
            error: "You don't have permission to view this playlist's shares",
          });
      }

      const shares = await storage.getPlaylistShares(playlistId);
      return res.json(shares);
    } catch (error) {
      console.error("Error fetching playlist shares:", error);
      return res
        .status(500)
        .json({ error: "Failed to retrieve playlist shares" });
    }
  }
);

// Share a playlist with a user
playlistSharesRouter.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { playlistId, sharedWithUserId, canEdit } = z
      .object({
        playlistId: z.number(),
        sharedWithUserId: z.number(),
        canEdit: z.boolean().default(false),
      })
      .parse(req.body);

    const playlist = await storage.getPlaylist(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if user owns this playlist
    if (playlist.userId !== (req.user as any)!.id) {
      return res
        .status(403)
        .json({ error: "You don't have permission to share this playlist" });
    }

    // Ensure the user we're sharing with exists
    const sharedWithUser = await storage.getUser(sharedWithUserId);
    if (!sharedWithUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const share = await storage.sharePlaylistWithUser({
      playlistId,
      sharedWithUserId,
      canEdit,
    });

    return res.status(201).json(share);
  } catch (error) {
    console.error("Error sharing playlist:", error);
    return res.status(500).json({ error: "Failed to share playlist" });
  }
});

// Remove a share
playlistSharesRouter.delete(
  "/:playlistId/:userId",
  async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const playlistId = parseInt(req.params.playlistId);
      const sharedWithUserId = parseInt(req.params.userId);

      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      // Check if user owns this playlist
      if (playlist.userId !== (req.user as any)!.id) {
        return res
          .status(403)
          .json({
            error: "You don't have permission to modify this playlist's shares",
          });
      }

      await storage.removePlaylistShare(playlistId, sharedWithUserId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error removing playlist share:", error);
      return res.status(500).json({ error: "Failed to remove playlist share" });
    }
  }
);

export default playlistSharesRouter;
