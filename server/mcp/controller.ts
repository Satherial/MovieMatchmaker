import { Request, Response } from "express";
import { storage } from "../storage";
import {
  MCPResponse,
  MCPMovieFilterRequest,
  MCPAddToWatchHistoryRequest,
  MCPLoginRequest,
  MCPRegisterRequest,
  MCPPlaylistListResponse,
  MCPPlaylistResponse,
  MCPCreatePlaylistRequest,
  MCPUpdatePlaylistRequest,
  MCPAddToPlaylistRequest,
  MCPUpdatePlaylistItemRequest,
  MCPReorderPlaylistItemsRequest,
  MCPFriendRequestRequest,
  MCPSharePlaylistRequest,
  MCPSharedWatchRequest,
  MCPUserPreferencesRequest,
  MCPFriendListResponse,
  MCPFriendRequestsResponse,
  MCPUserSearchResponse,
  MCPPlaylistSharesResponse,
  MCPSharedWatchesResponse,
} from "./types";
import passport from "passport";
import { hashPassword } from "../auth";
import { insertUserSchema, insertPlaylistSchema } from "@shared/schema";

/**
 * MCP Controller - Handles requests from LLM models
 * This controller provides a consistent API for AI models to interact with
 * the movie recommendation system
 */
export class MCPController {
  // ====== Playlist Methods ======

  /**
   * Get user playlists
   */
  async getUserPlaylists(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to access playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const playlists = await storage.getUserPlaylists(userId);

      const response: MCPResponse<MCPPlaylistListResponse> = {
        success: true,
        data: {
          playlists,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching user playlists:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch playlists",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get a specific playlist with its movies
   */
  async getPlaylist(req: Request, res: Response) {
    try {
      const playlistId = Number(req.params.id);

      if (isNaN(playlistId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID",
        };
        return res.status(400).json(response);
      }

      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      // Check if the user has access to this playlist
      if (
        !playlist.isPublic &&
        req.isAuthenticated() &&
        playlist.userId !== (req.user as any).id
      ) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to view this playlist",
        };
        return res.status(403).json(response);
      }

      // Get playlist movies
      const movies = await storage.getPlaylistMovies(playlistId);

      // Get playlist items for additional metadata
      const playlistItems = await storage.getPlaylistItems(playlistId);

      // Map movies with their playlist item data (notes, sort order)
      const moviesWithPlaylistData = movies.map((movie) => {
        const playlistItem = playlistItems.find(
          (item) => item.movieId === movie.id
        );
        return {
          ...movie,
          playlistItem: playlistItem || undefined,
        };
      });

      // Get creator info
      const creator = await storage.getUser(playlist.userId);
      const creatorInfo = creator
        ? {
            id: creator.id,
            username: creator.username,
            fullName: creator.fullName,
            avatarUrl: creator.avatarUrl,
          }
        : undefined;

      const response: MCPResponse<MCPPlaylistResponse> = {
        success: true,
        data: {
          playlist,
          movies: moviesWithPlaylistData,
          creator: creatorInfo,
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error fetching playlist ${req.params.id}:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to create playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { name, description, isPublic } =
        req.body as MCPCreatePlaylistRequest;

      // Create a playlist object
      const playlistData = {
        userId,
        name,
        description: description || undefined,
        isPublic: isPublic === true,
      };

      // Validate the data
      const validation = insertPlaylistSchema.safeParse(playlistData);
      if (!validation.success) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist data",
        };
        return res.status(400).json(response);
      }

      // Create the playlist
      const playlist = await storage.createPlaylist(validation.data);

      const response: MCPResponse<any> = {
        success: true,
        data: playlist,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error creating playlist:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to create playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update an existing playlist
   */
  async updatePlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to update playlists",
        };
        return res.status(401).json(response);
      }

      const playlistId = Number(req.params.id);
      const userId = (req.user as any).id;

      if (isNaN(playlistId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to update this playlist",
        };
        return res.status(403).json(response);
      }

      // Extract update data
      const { name, description, isPublic } =
        req.body as MCPUpdatePlaylistRequest;

      // Create update object with only provided fields
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      // Update the playlist
      const updatedPlaylist = await storage.updatePlaylist(
        playlistId,
        updateData
      );

      const response: MCPResponse<any> = {
        success: true,
        data: updatedPlaylist,
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error updating playlist ${req.params.id}:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to update playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to delete playlists",
        };
        return res.status(401).json(response);
      }

      const playlistId = Number(req.params.id);
      const userId = (req.user as any).id;

      if (isNaN(playlistId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to delete this playlist",
        };
        return res.status(403).json(response);
      }

      // Delete the playlist
      await storage.deletePlaylist(playlistId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Playlist deleted successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error deleting playlist ${req.params.id}:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to delete playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Add a movie to a playlist
   */
  async addMovieToPlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to modify playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { playlistId, movieId, notes, sortOrder } =
        req.body as MCPAddToPlaylistRequest;

      if (isNaN(Number(playlistId)) || isNaN(Number(movieId))) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID or movie ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(Number(playlistId));

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to modify this playlist",
        };
        return res.status(403).json(response);
      }

      // Check if movie exists
      const movie = await storage.getMovie(Number(movieId));

      if (!movie) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Movie not found",
        };
        return res.status(404).json(response);
      }

      // Get existing items to determine sort order
      const existingItems = await storage.getPlaylistItems(Number(playlistId));
      const nextSortOrder =
        sortOrder !== undefined ? sortOrder : existingItems.length + 1;

      // Add movie to playlist
      const playlistItem = await storage.addMovieToPlaylist({
        playlistId: Number(playlistId),
        movieId: Number(movieId),
        notes: notes || undefined,
        sortOrder: nextSortOrder,
      });

      const response: MCPResponse<any> = {
        success: true,
        data: {
          ...playlistItem,
          movie,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error adding movie to playlist:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to add movie to playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Remove a movie from a playlist
   */
  async removeMovieFromPlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to modify playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const playlistId = Number(req.params.playlistId);
      const movieId = Number(req.params.movieId);

      if (isNaN(playlistId) || isNaN(movieId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID or movie ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to modify this playlist",
        };
        return res.status(403).json(response);
      }

      // Remove movie from playlist
      await storage.removeMovieFromPlaylist(playlistId, movieId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Movie removed from playlist successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error removing movie from playlist:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to remove movie from playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Reorder playlist items
   */
  async reorderPlaylistItems(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to modify playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const playlistId = Number(req.params.id);
      const { itemIds } = req.body as MCPReorderPlaylistItemsRequest;

      if (isNaN(playlistId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID",
        };
        return res.status(400).json(response);
      }

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid item IDs provided for reordering",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to modify this playlist",
        };
        return res.status(403).json(response);
      }

      // Reorder playlist items
      await storage.reorderPlaylistItems(playlistId, itemIds);

      // Get updated playlist items
      const updatedItems = await storage.getPlaylistItems(playlistId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          items: updatedItems,
          message: "Playlist items reordered successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error reordering playlist items:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to reorder playlist items",
      };
      res.status(500).json(response);
    }
  }

  // ====== Friends Methods ======

  /**
   * Get user's friends
   */
  async getFriends(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to access friends",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;

      // Get accepted friendships
      const friendships = await storage.getFriendships(userId, "accepted");

      // Enhance with user details
      const friendsWithDetails = await Promise.all(
        friendships.map(async (friendship) => {
          const friendId =
            friendship.userId === userId
              ? friendship.friendId
              : friendship.userId;
          const user = await storage.getUser(friendId);

          return {
            ...friendship,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : null,
          };
        })
      );

      const response: MCPResponse<MCPFriendListResponse> = {
        success: true,
        data: {
          friends: friendsWithDetails.filter((f) => f.user !== null) as any,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching friends:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch friends",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to access friend requests",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;

      // Get pending friend requests
      const friendRequests = await storage.getFriendshipRequests(userId);

      // Enhance with user details
      const requestsWithDetails = await Promise.all(
        friendRequests.map(async (request) => {
          const user = await storage.getUser(request.userId);

          return {
            ...request,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : null,
          };
        })
      );

      const response: MCPResponse<MCPFriendRequestsResponse> = {
        success: true,
        data: {
          requests: requestsWithDetails.filter((r) => r.user !== null) as any,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching friend requests:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch friend requests",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get sent friend requests
   */
  async getSentFriendRequests(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to access sent friend requests",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;

      // Get friendships where user is the sender and status is pending
      const friendships = await storage.getFriendships(userId);
      const sentRequests = friendships.filter(
        (f) => f.userId === userId && f.status === "pending"
      );

      // Enhance with user details
      const requestsWithDetails = await Promise.all(
        sentRequests.map(async (request) => {
          const user = await storage.getUser(request.friendId);

          return {
            ...request,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : null,
          };
        })
      );

      const response: MCPResponse<MCPFriendRequestsResponse> = {
        success: true,
        data: {
          requests: requestsWithDetails.filter((r) => r.user !== null) as any,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching sent friend requests:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch sent friend requests",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Search for users
   */
  async searchUsers(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to search users",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Search query must be at least 2 characters",
        };
        return res.status(400).json(response);
      }

      // Search for users excluding the current user
      const users = await storage.searchUsers(query, userId);

      // Map to the response format
      const formattedUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }));

      const response: MCPResponse<MCPUserSearchResponse> = {
        success: true,
        data: {
          users: formattedUsers,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error searching users:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to search users",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to send friend requests",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { friendId } = req.body as MCPFriendRequestRequest;

      if (isNaN(Number(friendId))) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid friend ID",
        };
        return res.status(400).json(response);
      }

      // Check if trying to add self
      if (userId === Number(friendId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You cannot add yourself as a friend",
        };
        return res.status(400).json(response);
      }

      // Check if friend exists
      const friend = await storage.getUser(Number(friendId));
      if (!friend) {
        const response: MCPResponse<any> = {
          success: false,
          error: "User not found",
        };
        return res.status(404).json(response);
      }

      // Check if already friends or request pending
      const existingFriendships = await storage.getFriendships(userId);
      const existingFriendship = existingFriendships.find(
        (f) =>
          (f.userId === userId && f.friendId === Number(friendId)) ||
          (f.userId === Number(friendId) && f.friendId === userId)
      );

      if (existingFriendship) {
        const statusMessage =
          existingFriendship.status === "accepted"
            ? "You are already friends with this user"
            : `A friend request is already ${existingFriendship.status}`;

        const response: MCPResponse<any> = {
          success: false,
          error: statusMessage,
        };
        return res.status(400).json(response);
      }

      // Create friendship
      const friendship = await storage.createFriendship({
        userId,
        friendId: Number(friendId),
        status: "pending",
      });

      const response: MCPResponse<any> = {
        success: true,
        data: {
          friendship,
          friend: {
            id: friend.id,
            username: friend.username,
            fullName: friend.fullName,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error sending friend request:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to send friend request",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to accept friend requests",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const friendshipId = Number(req.params.id);

      if (isNaN(friendshipId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid friendship ID",
        };
        return res.status(400).json(response);
      }

      // Get friendship and check if it exists and is pending
      const friendshipRequests = await storage.getFriendshipRequests(userId);
      const friendship = friendshipRequests.find((f) => f.id === friendshipId);

      if (!friendship) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Friend request not found",
        };
        return res.status(404).json(response);
      }

      // Update friendship status
      const updatedFriendship = await storage.updateFriendshipStatus(
        friendshipId,
        "accepted"
      );

      // Get friend details
      const friend = await storage.getUser(updatedFriendship.userId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          friendship: updatedFriendship,
          friend: friend
            ? {
                id: friend.id,
                username: friend.username,
                fullName: friend.fullName,
              }
            : null,
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error accepting friend request:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to accept friend request",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to reject friend requests",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const friendshipId = Number(req.params.id);

      if (isNaN(friendshipId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid friendship ID",
        };
        return res.status(400).json(response);
      }

      // Get friendship and check if it exists and is pending
      const friendshipRequests = await storage.getFriendshipRequests(userId);
      const friendship = friendshipRequests.find((f) => f.id === friendshipId);

      if (!friendship) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Friend request not found",
        };
        return res.status(404).json(response);
      }

      // Update friendship status
      const updatedFriendship = await storage.updateFriendshipStatus(
        friendshipId,
        "rejected"
      );

      const response: MCPResponse<any> = {
        success: true,
        data: {
          friendship: updatedFriendship,
          message: "Friend request rejected",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error rejecting friend request:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to reject friend request",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete a friendship
   */
  async deleteFriendship(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to remove friends",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const friendId = Number(req.params.friendId);

      if (isNaN(friendId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid friend ID",
        };
        return res.status(400).json(response);
      }

      // Delete friendship
      await storage.deleteFriendship(userId, friendId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Friendship removed successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error removing friendship:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to remove friendship",
      };
      res.status(500).json(response);
    }
  }

  // ====== Playlist Shares Methods ======

  /**
   * Get shares for a playlist
   */
  async getPlaylistShares(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to view playlist shares",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const playlistId = Number(req.params.playlistId);

      if (isNaN(playlistId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to view shares for this playlist",
        };
        return res.status(403).json(response);
      }

      // Get playlist shares
      const shares = await storage.getPlaylistShares(playlistId);

      // Enhance with user details
      const sharesWithDetails = await Promise.all(
        shares.map(async (share) => {
          const user = await storage.getUser(share.sharedWithUserId);

          return {
            ...share,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : null,
            playlist,
          };
        })
      );

      const response: MCPResponse<MCPPlaylistSharesResponse> = {
        success: true,
        data: {
          shares: sharesWithDetails.filter((s) => s.user !== null) as any,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching playlist shares:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch playlist shares",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get shared playlists
   */
  async getSharedPlaylists(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to view shared playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;

      // Get playlists shared with the user
      const sharedPlaylists = await storage.getSharedPlaylists(userId);

      const response: MCPResponse<MCPPlaylistListResponse> = {
        success: true,
        data: {
          playlists: sharedPlaylists,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching shared playlists:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch shared playlists",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get public playlists
   */
  async getPublicPlaylists(req: Request, res: Response) {
    try {
      // Get public playlists
      const publicPlaylists = await storage.getPublicPlaylists();

      const response: MCPResponse<MCPPlaylistListResponse> = {
        success: true,
        data: {
          playlists: publicPlaylists,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching public playlists:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch public playlists",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Share a playlist with a user
   */
  async sharePlaylist(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to share playlists",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { playlistId, sharedWithUserId, canEdit } =
        req.body as MCPSharePlaylistRequest;

      if (isNaN(Number(playlistId)) || isNaN(Number(sharedWithUserId))) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID or user ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(Number(playlistId));

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to share this playlist",
        };
        return res.status(403).json(response);
      }

      // Check if user exists
      const user = await storage.getUser(Number(sharedWithUserId));

      if (!user) {
        const response: MCPResponse<any> = {
          success: false,
          error: "User not found",
        };
        return res.status(404).json(response);
      }

      // Check if already shared
      const existingShares = await storage.getPlaylistShares(
        Number(playlistId)
      );
      const alreadyShared = existingShares.some(
        (share) => share.sharedWithUserId === Number(sharedWithUserId)
      );

      if (alreadyShared) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist is already shared with this user",
        };
        return res.status(400).json(response);
      }

      // Share playlist
      const share = await storage.sharePlaylistWithUser({
        playlistId: Number(playlistId),
        sharedWithUserId: Number(sharedWithUserId),
        canEdit: canEdit === true,
      });

      const response: MCPResponse<any> = {
        success: true,
        data: {
          share,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
          },
          playlist,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error sharing playlist:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to share playlist",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Remove playlist share
   */
  async removePlaylistShare(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to remove playlist shares",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const playlistId = Number(req.params.playlistId);
      const sharedWithUserId = Number(req.params.userId);

      if (isNaN(playlistId) || isNaN(sharedWithUserId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid playlist ID or user ID",
        };
        return res.status(400).json(response);
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Playlist not found",
        };
        return res.status(404).json(response);
      }

      if (playlist.userId !== userId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to modify shares for this playlist",
        };
        return res.status(403).json(response);
      }

      // Remove share
      await storage.removePlaylistShare(playlistId, sharedWithUserId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Playlist share removed successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error removing playlist share:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to remove playlist share",
      };
      res.status(500).json(response);
    }
  }

  // ====== Shared Watches Methods ======

  /**
   * Get shared watches
   */
  async getSharedWatches(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to view shared watches",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;

      // Get shared watches involving the user
      const sharedWatches = await storage.getSharedWatches(userId);

      // Enhance with movie and user details
      const enhancedSharedWatches = await Promise.all(
        sharedWatches.map(async (sharedWatch) => {
          const movie = await storage.getMovie(sharedWatch.movieId);
          const initiatedByUser = await storage.getUser(
            sharedWatch.initiatedByUserId
          );
          const watchedWithUser = await storage.getUser(
            sharedWatch.watchedWithUserId
          );

          return {
            ...sharedWatch,
            movie: movie || undefined,
            initiatedByUser: initiatedByUser
              ? {
                  id: initiatedByUser.id,
                  username: initiatedByUser.username,
                }
              : null,
            watchedWithUser: watchedWithUser
              ? {
                  id: watchedWithUser.id,
                  username: watchedWithUser.username,
                }
              : null,
          };
        })
      );

      // Filter out any with missing data
      const filteredSharedWatches = enhancedSharedWatches.filter(
        (sw) => sw.movie && sw.initiatedByUser && sw.watchedWithUser
      );

      const response: MCPResponse<MCPSharedWatchesResponse> = {
        success: true,
        data: {
          sharedWatches: filteredSharedWatches as any,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching shared watches:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch shared watches",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Add a shared watch
   */
  async addSharedWatch(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to create shared watches",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { movieId, watchedWithUserId, rating, notes } =
        req.body as MCPSharedWatchRequest;

      if (isNaN(Number(movieId)) || isNaN(Number(watchedWithUserId))) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid movie ID or user ID",
        };
        return res.status(400).json(response);
      }

      // Check if movie exists
      const movie = await storage.getMovie(Number(movieId));

      if (!movie) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Movie not found",
        };
        return res.status(404).json(response);
      }

      // Check if user exists and is a friend
      const user = await storage.getUser(Number(watchedWithUserId));

      if (!user) {
        const response: MCPResponse<any> = {
          success: false,
          error: "User not found",
        };
        return res.status(404).json(response);
      }

      // Verify friendship
      const friendships = await storage.getFriendships(userId, "accepted");
      const isFriend = friendships.some(
        (f) =>
          (f.userId === userId && f.friendId === Number(watchedWithUserId)) ||
          (f.userId === Number(watchedWithUserId) && f.friendId === userId)
      );

      if (!isFriend) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You can only share watches with friends",
        };
        return res.status(403).json(response);
      }

      // Add shared watch
      const sharedWatch = await storage.addSharedWatch({
        movieId: Number(movieId),
        initiatedByUserId: userId,
        watchedWithUserId: Number(watchedWithUserId),
        rating: rating || undefined,
        notes: notes || undefined,
      });

      // Add to both users' watch history
      await storage.addToWatchHistory({
        movieId: Number(movieId),
        userId,
        rating: rating || undefined,
        notes: notes || undefined,
      });

      await storage.addToWatchHistory({
        movieId: Number(movieId),
        userId: Number(watchedWithUserId),
        rating: rating || undefined,
        notes: notes || undefined,
      });

      const response: MCPResponse<any> = {
        success: true,
        data: {
          sharedWatch,
          movie,
          initiatedByUser: {
            id: userId,
            username: (req.user as any).username,
          },
          watchedWithUser: {
            id: user.id,
            username: user.username,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error adding shared watch:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to add shared watch",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Remove a shared watch
   */
  async removeSharedWatch(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to remove shared watches",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const sharedWatchId = Number(req.params.id);

      if (isNaN(sharedWatchId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid shared watch ID",
        };
        return res.status(400).json(response);
      }

      // Get shared watches for the user
      const sharedWatches = await storage.getSharedWatches(userId);
      const sharedWatch = sharedWatches.find((sw) => sw.id === sharedWatchId);

      if (!sharedWatch) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Shared watch not found",
        };
        return res.status(404).json(response);
      }

      // Check if user is involved in this shared watch
      if (
        sharedWatch.initiatedByUserId !== userId &&
        sharedWatch.watchedWithUserId !== userId
      ) {
        const response: MCPResponse<any> = {
          success: false,
          error: "You don't have permission to remove this shared watch",
        };
        return res.status(403).json(response);
      }

      // Remove shared watch
      await storage.removeSharedWatch(sharedWatchId);

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Shared watch removed successfully",
        },
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error removing shared watch:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to remove shared watch",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to access preferences",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const preferences = await storage.getUserPreferences(userId);

      if (!preferences) {
        const response: MCPResponse<any> = {
          success: false,
          error: "No preferences found",
        };
        return res.status(404).json(response);
      }

      // Parse preferences if it's a JSON string
      try {
        const parsedPreferences = JSON.parse(preferences);

        const response: MCPResponse<any> = {
          success: true,
          data: parsedPreferences,
        };

        return res.json(response);
      } catch (e) {
        // If it's not valid JSON, return as is
        const response: MCPResponse<any> = {
          success: true,
          data: { preferences },
        };

        return res.json(response);
      }
    } catch (error) {
      console.error("MCP Error fetching user preferences:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch preferences",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required to update preferences",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const { preferences } = req.body as MCPUserPreferencesRequest;

      // Convert to string if an object is provided
      const preferencesString =
        typeof preferences === "object"
          ? JSON.stringify(preferences)
          : preferences;

      const updatedUser = await storage.saveUserPreferences(
        userId,
        preferencesString
      );

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;

      const response: MCPResponse<any> = {
        success: true,
        data: userWithoutPassword,
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error updating user preferences:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to update preferences",
      };
      res.status(500).json(response);
    }
  }
  /**
   * Get a list of movies with optional filtering
   */
  async getMovies(req: Request, res: Response) {
    try {
      const filters = req.body as MCPMovieFilterRequest;

      // Get watched movie IDs if user is authenticated
      let watchedMovieIds: number[] = [];
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id;
        const userWatchHistory = await storage.getWatchHistory(userId);
        watchedMovieIds = userWatchHistory.map((item) => item.movieId);
      }

      // Convert category IDs to numbers
      const categoryIds =
        filters.categories
          ?.map((id) => parseInt(id))
          .filter((id) => !isNaN(id)) || [];

      // Convert year strings to numbers, if provided
      const yearFrom =
        filters.yearFrom && filters.yearFrom !== "Any"
          ? Number(filters.yearFrom)
          : undefined;
      const yearTo =
        filters.yearTo && filters.yearTo !== "Any"
          ? Number(filters.yearTo)
          : undefined;

      // Get filtered movies
      const movies = await storage.getMovies({
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        minRating: filters.minRating,
        yearFrom,
        yearTo,
        excludeIds: watchedMovieIds,
        sort: filters.sort,
      });

      // Enhance each movie with category names
      const enhancedMovies = await Promise.all(
        (movies as any).map(async (movie: any) => {
          const movieCategories = await storage.getMovieCategories(movie.id);
          const categories = await Promise.all(
            movieCategories.map(async (mc) => {
              const cat = await storage.getCategory(mc.categoryId);
              return cat ? cat.name : null;
            })
          );

          return {
            ...movie,
            categories: categories.filter(Boolean) as string[],
          };
        })
      );

      const response: MCPResponse<any> = {
        success: true,
        data: {
          movies: enhancedMovies,
          totalCount: enhancedMovies.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error getting movies:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch movies",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get a single movie by ID
   */
  async getMovie(req: Request, res: Response) {
    try {
      const movieId = parseInt(req.params.id);

      if (isNaN(movieId)) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid movie ID",
        };
        return res.status(400).json(response);
      }

      const movie = await storage.getMovie(movieId);

      if (!movie) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Movie not found",
        };
        return res.status(404).json(response);
      }

      // Get movie categories
      const movieCategories = await storage.getMovieCategories(movie.id);
      const categories = await Promise.all(
        movieCategories.map(async (mc) => {
          const cat = await storage.getCategory(mc.categoryId);
          return cat ? cat.name : null;
        })
      );

      const enhancedMovie = {
        ...movie,
        categories: categories.filter(Boolean) as string[],
      };

      const response: MCPResponse<any> = {
        success: true,
        data: enhancedMovie,
      };

      res.json(response);
    } catch (error) {
      console.error(`MCP Error fetching movie ${req.params.id}:`, error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch movie",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get a list of all genres/categories
   */
  async getGenres(req: Request, res: Response) {
    try {
      const genres = await storage.getCategories();

      const response: MCPResponse<any> = {
        success: true,
        data: {
          genres,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error getting genres:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch genres",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get user watch history
   */
  async getWatchHistory(req: Request, res: Response) {
    try {
      // Determine which watch history to fetch
      let watchHistory;
      if (req.isAuthenticated()) {
        // If authenticated, get user-specific watch history
        const userId = (req.user as any).id;
        watchHistory = await storage.getWatchHistory(userId);
      } else {
        // Otherwise get all watch history
        watchHistory = await storage.getWatchHistory();
      }

      // Enhance with movie details
      const enhancedHistory = await Promise.all(
        watchHistory.map(async (item) => {
          const movie = await storage.getMovie(item.movieId);

          if (movie) {
            // Get movie categories
            const movieCategories = await storage.getMovieCategories(
              item.movieId
            );
            const categories = await Promise.all(
              movieCategories.map(async (mc) => {
                const cat = await storage.getCategory(mc.categoryId);
                return cat ? cat.name : null;
              })
            );

            return {
              ...item,
              movie: {
                ...movie,
                categories: categories.filter(Boolean) as string[],
              },
            };
          }

          return item;
        })
      );

      const response: MCPResponse<any> = {
        success: true,
        data: {
          watchHistory: enhancedHistory,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error fetching watch history:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch watch history",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Add a movie to watch history
   */
  async addToWatchHistory(req: Request, res: Response) {
    try {
      const { movieId, rating, notes } =
        req.body as MCPAddToWatchHistoryRequest;

      if (!movieId) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Movie ID is required",
        };
        return res.status(400).json(response);
      }

      // Check if movie exists
      const movie = await storage.getMovie(Number(movieId));
      if (!movie) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Movie not found",
        };
        return res.status(404).json(response);
      }

      // Create watch history entry
      let watchHistoryData: any = {
        movieId: Number(movieId),
        watchedAt: new Date(),
        rating: rating || undefined,
        notes: notes || undefined,
      };

      // If authenticated, add userId
      if (req.isAuthenticated()) {
        watchHistoryData.userId = (req.user as any).id;
      }

      // Add to watch history
      const result = await storage.addToWatchHistory(watchHistoryData);

      // Return with movie details
      const watchHistoryWithMovie = {
        ...result,
        movie,
      };

      const response: MCPResponse<any> = {
        success: true,
        data: watchHistoryWithMovie,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("MCP Error adding to watch history:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to add to watch history",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Clear watch history
   */
  async clearWatchHistory(req: Request, res: Response) {
    try {
      if (req.isAuthenticated()) {
        // Clear only the authenticated user's history
        await storage.clearWatchHistory((req.user as any).id);

        const response: MCPResponse<any> = {
          success: true,
          data: {
            message: "Your watch history cleared successfully",
          },
        };

        res.status(200).json(response);
      } else {
        // Clear all watch history (should be restricted to admins in production)
        await storage.clearWatchHistory();

        const response: MCPResponse<any> = {
          success: true,
          data: {
            message: "All watch history cleared successfully",
          },
        };

        res.status(200).json(response);
      }
    } catch (error) {
      console.error("MCP Error clearing watch history:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to clear watch history",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Login a user
   */
  async login(req: Request, res: Response) {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("MCP Authentication error:", err);
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication error",
        };
        return res.status(500).json(response);
      }

      if (!user) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid username or password",
        };
        return res.status(401).json(response);
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("MCP Login error:", loginErr);
          const response: MCPResponse<any> = {
            success: false,
            error: "Login error",
          };
          return res.status(500).json(response);
        }

        const response: MCPResponse<any> = {
          success: true,
          data: user,
        };

        return res.status(200).json(response);
      });
    })(req, res);
  }

  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    try {
      const { username, password, email, fullName } =
        req.body as MCPRegisterRequest;

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Username already exists",
        };
        return res.status(409).json(response);
      }

      // Create user
      const hashedPassword = await hashPassword(password);

      const userData = {
        username,
        password: hashedPassword,
        email: email || undefined,
        fullName: fullName || undefined,
        avatarUrl: null,
      };

      // Validate the user data
      const validation = insertUserSchema.safeParse(userData);
      if (!validation.success) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Invalid user data",
        };
        return res.status(400).json(response);
      }

      const user = await storage.createUser(userData);

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("MCP Registration login error:", err);
          const response: MCPResponse<any> = {
            success: true,
            data: user,
            error: "User created but auto-login failed",
          };
          return res.status(201).json(response);
        }

        const response: MCPResponse<any> = {
          success: true,
          data: user,
        };

        return res.status(201).json(response);
      });
    } catch (error) {
      console.error("MCP Registration error:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to register user",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Logout a user
   */
  async logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        console.error("MCP Logout error:", err);
        const response: MCPResponse<any> = {
          success: false,
          error: "Logout error",
        };
        return res.status(500).json(response);
      }

      const response: MCPResponse<any> = {
        success: true,
        data: {
          message: "Logged out successfully",
        },
      };

      res.status(200).json(response);
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request, res: Response) {
    if (!req.isAuthenticated()) {
      const response: MCPResponse<any> = {
        success: false,
        error: "Not authenticated",
      };
      return res.status(401).json(response);
    }

    const response: MCPResponse<any> = {
      success: true,
      data: req.user,
    };

    res.json(response);
  }

  /**
   * Get recommended movies for a user
   */
  async getRecommendedMovies(req: Request, res: Response) {
    try {
      if (!req.isAuthenticated()) {
        const response: MCPResponse<any> = {
          success: false,
          error: "Authentication required for recommendations",
        };
        return res.status(401).json(response);
      }

      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const recommendedMovies = await storage.getRecommendedMovies(
        userId,
        limit
      );

      // Enhance each movie with category names
      const enhancedMovies = await Promise.all(
        recommendedMovies.map(async (movie) => {
          const movieCategories = await storage.getMovieCategories(movie.id);
          const categories = await Promise.all(
            movieCategories.map(async (mc) => {
              const cat = await storage.getCategory(mc.categoryId);
              return cat ? cat.name : null;
            })
          );

          return {
            ...movie,
            categories: categories.filter(Boolean) as string[],
          };
        })
      );

      const response: MCPResponse<any> = {
        success: true,
        data: {
          recommendations: enhancedMovies,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("MCP Error getting recommendations:", error);
      const response: MCPResponse<any> = {
        success: false,
        error: "Failed to fetch recommendations",
      };
      res.status(500).json(response);
    }
  }
}
